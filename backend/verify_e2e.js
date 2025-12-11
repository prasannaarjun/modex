
const API_URL = 'http://localhost:3000/api';

async function request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await res.json();
        if (!res.ok) {
            // If 409 User exists, that's fine for re-runs
            if (res.status === 409) return { error: data.error, status: 409 };
            throw new Error(`Failed ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
        }
        return data;
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

async function verify() {
    console.log('--- Starting E2E Verification ---');

    // 1. Register Admin
    console.log('\n> Registering Admin...');
    let admin = await request('POST', '/auth/register', {
        email: `admin_${Date.now()}@test.com`,
        password: 'password123',
        role: 'admin'
    });
    if (!admin) process.exit(1);
    console.log('Admin Registered:', admin.email);

    // 2. Login Admin
    console.log('\n> Logging in Admin...');
    const adminAuth = await request('POST', '/auth/login', {
        email: admin.email,
        password: 'password123'
    });
    const adminToken = adminAuth.token;
    console.log('Admin Token received');

    // 3. Create Show
    console.log('\n> Creating Show (Admin)...');
    const show = await request('POST', '/shows', {
        title: 'E2E Test Show',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        total_seats: 10
    }, adminToken);
    console.log('Show Created:', show.id, show.title);

    // 4. Register User
    console.log('\n> Registering User...');
    let user = await request('POST', '/auth/register', {
        email: `user_${Date.now()}@test.com`,
        password: 'password123'
    });
    console.log('User Registered:', user.email);

    // 5. Login User
    console.log('\n> Logging in User...');
    const userAuth = await request('POST', '/auth/login', {
        email: user.email,
        password: 'password123'
    });
    const userToken = userAuth.token;
    console.log('User Token received');

    // 6. Book Ticket
    console.log('\n> Booking Ticket (User)...');
    const booking = await request('POST', `/shows/${show.id}/book`, {}, userToken);
    console.log('Booking Created:', booking.id, booking.status);

    if (booking.status === 'PENDING') {
        console.log('\n✅ E2E Verification Passed!');
    } else {
        console.error('\n❌ E2E Verification Failed: Booking status is ' + booking.status);
    }
}

verify();
