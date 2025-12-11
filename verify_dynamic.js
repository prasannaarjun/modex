async function main() {
    // 1. Register and Login admin
    console.log('Registering admin...');
    try {
        await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'dynamic_admin@example.com', password: 'password123' })
        });
    } catch (e) { /* Might already exist */ }

    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dynamic_admin@example.com', password: 'password123' })
    });
    if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
    const { token } = await loginRes.json();

    // Promote to admin (via psql)
    console.log('Promoting to admin via SQL...');
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
        exec(`psql -U modex_user -d modex_db -c "UPDATE users SET role = 'admin' WHERE email = 'dynamic_admin@example.com';"`,
            { env: { ...process.env, PGPASSWORD: 'modex_password', PGHOST: 'postgres' } },
            (err, stdout, stderr) => {
                if (err) console.warn('psql error (may be ok):', stderr);
                resolve(null);
            }
        );
    });

    // 2. Create Show with custom prices
    console.log('Creating show with dynamic pricing...');
    const showRes = await fetch('http://localhost:3000/api/shows', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: 'Dynamic Grid Test',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            total_seats: 100,
            price1: 50,
            price2: 100,
            price3: 150
        })
    });
    if (!showRes.ok) throw new Error('Create Show failed: ' + await showRes.text());
    const show = await showRes.json();
    console.log('Show created. ID:', show.id);

    // 3. Get Show Details
    const detailsRes = await fetch(`http://localhost:3000/api/shows/${show.id}`);
    const details = await detailsRes.json();

    if (!details.seats || details.seats.length === 0) {
        throw new Error('No seats generated!');
    }
    console.log('Seats count:', details.seats.length);

    // Grid should be 10x10 for 100 seats
    const gridSize = Math.sqrt(details.seats.length);
    console.log('Grid size:', gridSize);
    if (gridSize !== 10) throw new Error('Expected 10x10 grid, got ' + gridSize);

    // Check tier distribution (approx 3-4 rows per tier)
    const prices = details.seats.map(s => s.price);
    const uniquePrices = [...new Set(prices)].sort((a, b) => a - b);
    console.log('Unique prices:', uniquePrices);

    if (!uniquePrices.includes(50) || !uniquePrices.includes(100) || !uniquePrices.includes(150)) {
        throw new Error('Expected prices 50, 100, 150. Got: ' + uniquePrices.join(', '));
    }

    // 4. Book some seats
    const seat1 = details.seats[0].id;
    const seat2 = details.seats[1].id;
    console.log(`Booking seats ${seat1}, ${seat2}...`);

    const bookRes = await fetch(`http://localhost:3000/api/shows/${show.id}/book`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ seatIds: [seat1, seat2] })
    });
    if (!bookRes.ok) throw new Error('Booking failed: ' + await bookRes.text());
    const booking = await bookRes.json();
    console.log('Booking created. ID:', booking.id);

    // 5. Confirm
    console.log('Confirming...');
    const confirmRes = await fetch(`http://localhost:3000/api/bookings/${booking.id}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!confirmRes.ok) throw new Error('Confirm failed: ' + await confirmRes.text());
    console.log('Confirmed.');

    console.log('\\n=== DYNAMIC SEATING VERIFICATION PASSED ===');
}

main().catch(err => {
    console.error('Verification Failed:', err);
    process.exit(1);
});
