
const API_URL = 'http://localhost:3000/api';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        if (!res.ok) {
            if (path.includes('login') || path.includes('register')) {
                const data = await res.json();
                if (res.status === 409) return { status: 409 };
                throw new Error(JSON.stringify(data));
            }
            throw new Error(`Failed ${res.status}`);
        }
        return await res.json();
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

async function verifyRedis() {
    console.log('--- Starting Redis Expiry Verification ---');
    const timestamp = Date.now();

    // 1. Setup Data
    console.log('> Setting up Admin and User...');
    const adminEmail = `admin_redis_${timestamp}@test.com`;
    const userEmail = `user_redis_${timestamp}@test.com`;

    await request('POST', '/auth/register', { email: adminEmail, password: 'password123', role: 'admin' });
    const adminAuth = await request('POST', '/auth/login', { email: adminEmail, password: 'password123' });
    const adminToken = adminAuth.token;

    await request('POST', '/auth/register', { email: userEmail, password: 'password123' });
    const userAuth = await request('POST', '/auth/login', { email: userEmail, password: 'password123' });
    const userToken = userAuth.token;

    // 2. Create Show with Short Expiry? 
    // We can't change server config dynamically. We must wait 2 minutes.
    console.log('> Creating Show...');
    const show = await request('POST', '/shows', {
        title: `Redis Test Show ${timestamp}`,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        total_seats: 10
    }, adminToken);

    // 3. Book Ticket
    console.log('> Booking Ticket...');
    const booking = await request('POST', `/shows/${show.id}/book`, {}, userToken);
    console.log(`Booking ID: ${booking.id}, Status: ${booking.status}`);

    if (booking.status !== 'PENDING') {
        console.error('❌ Booking should be PENDING initially');
        return;
    }

    // 4. Wait for Expiry (2 mins + buffer)
    // We will poll every 20 seconds
    console.log('> Waiting for Expiry (approx 2 minutes)...');

    const maxRetries = 14; // 14 * 10s = 140s
    for (let i = 0; i < maxRetries; i++) {
        await wait(10000); // Wait 10s
        process.stdout.write(`...${(i + 1) * 10}s `);

        const check = await request('GET', `/bookings/${booking.id}`, null, userToken);
        if (check.status === 'EXPIRED') {
            console.log(`\n✅ Booking ${booking.id} is EXPIRED! Redis Worker Success.`);
            return;
        }
    }

    console.error('\n❌ Timeout waiting for expiry. Redis Worker might be down.');
}

verifyRedis();
