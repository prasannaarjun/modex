const { PrismaClient } = require('@prisma/client');
// We don't strictly need PrismaClient if we use fetch, but good for cleanup if needed.
// Actually, let's just use fetch.

async function main() {
    // 1. Login
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'seat_admin@example.com', password: 'password123' })
    });

    if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
    const { token } = await loginRes.json();
    console.log('Logged in successfully.');

    // 2. Create Allocated Show
    console.log('Creating show...');
    const showRes = await fetch('http://localhost:3000/api/shows', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            title: 'Allocated API Test',
            start_time: new Date(Date.now() + 86400000).toISOString(),
            total_seats: 100
        })
    });
    if (!showRes.ok) throw new Error('Create Show failed: ' + await showRes.text());
    const show = await showRes.json();
    console.log('Show created. ID:', show.id);

    // 3. Get Show Details (verify seats)
    const detailsRes = await fetch(`http://localhost:3000/api/shows/${show.id}`);
    const details = await detailsRes.json();

    if (!details.seats || details.seats.length === 0) {
        throw new Error('No seats generated!');
    }
    console.log('Seats generated count:', details.seats.length);
    console.log('First Seat:', JSON.stringify(details.seats[0]));

    // 4. Book Seats
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
    console.log('Confirming booking...');
    const confirmRes = await fetch(`http://localhost:3000/api/bookings/${booking.id}/confirm`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!confirmRes.ok) throw new Error('Confirm failed: ' + await confirmRes.text());
    console.log('Confirmed.');

    // 6. Verify status
    console.log('Verifying final seat status...');
    const detailsAfter = await (await fetch(`http://localhost:3000/api/shows/${show.id}`)).json();
    const s1 = detailsAfter.seats.find(s => s.id === seat1);
    if (s1.status !== 'BOOKED') throw new Error('Seat status verify failed. Expected BOOKED, got: ' + s1.status);
    console.log('Verification Complete! Seat status:', s1.status);
}

main().catch(err => {
    console.error('Verification Failed:', err);
    process.exit(1);
});
