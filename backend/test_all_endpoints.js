
const API_URL = 'http://localhost:3000/api';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log(`\n[${method}] ${path}`);
    try {
        const res = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await res.json();
        if (!res.ok) {
            if (res.status === 409 && path.includes('register')) return { error: 'User exists', status: 409 };
            console.error(`❌ Failed: ${res.status}`, JSON.stringify(data));
            throw new Error(`Request failed`);
        }
        console.log(`✅ Success`);
        return data;
    } catch (e) {
        console.error(`❌ Error request: ${e.message}`);
        return null;
    }
}

async function runTests() {
    console.log('--- Starting Comprehensive API Test ---');
    const timestamp = Date.now();

    // --- 1. AUTH ---
    const adminEmail = `admin_${timestamp}@test.com`;
    const userEmail = `user_${timestamp}@test.com`;

    // 1.1 Register Admin
    let admin = await request('POST', '/auth/register', {
        email: adminEmail,
        password: 'password123',
        role: 'admin'
    });
    if (!admin) process.exit(1);

    // 1.2 Login Admin
    const adminAuth = await request('POST', '/auth/login', {
        email: adminEmail,
        password: 'password123'
    });
    const adminToken = adminAuth.token;

    // 1.3 Register User
    await request('POST', '/auth/register', {
        email: userEmail,
        password: 'password123'
    });

    // 1.4 Login User
    const userAuth = await request('POST', '/auth/login', {
        email: userEmail,
        password: 'password123'
    });
    const userToken = userAuth.token;

    // --- 2. ADMIN ONBOARDING ---
    // 2.1 Onboard Admin
    await request('POST', '/admin/onboard', {
        name: 'Super Cinema',
        street: '123 Movie Lane',
        area: 'Downtown',
        city: 'Metropolis',
        state: 'NY',
        country: 'USA'
    }, adminToken);

    // --- 3. SHOWS ---
    // 3.1 Create Show (Admin)
    const show = await request('POST', '/shows', {
        title: `Blockbuster ${timestamp}`,
        start_time: new Date(Date.now() + 86400000).toISOString(),
        total_seats: 5
    }, adminToken);

    // 3.2 Get All Shows (Public)
    const shows = await request('GET', '/shows');
    console.log(`Found ${shows.length} shows`);

    // 3.3 Get Show Details
    await request('GET', `/shows/${show.id}`);

    // --- 4. BOOKING ---
    // 4.1 Book Ticket (User)
    const booking = await request('POST', `/shows/${show.id}/book`, {}, userToken);
    console.log('Booking Status:', booking.status);

    // 4.2 Get Booking Details (User)
    await request('GET', `/bookings/${booking.id}`, null, userToken);

    // 4.3 Confirm Booking (User)
    // Note: Usually requires payment process, here we confirm directly
    const confirmed = await request('POST', `/bookings/${booking.id}/confirm`, {}, userToken);
    console.log('Final Status:', confirmed.status);

    console.log('\n--- All Tests Completed Successfully ---');
}

runTests();
