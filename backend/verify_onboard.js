
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
            throw new Error(`Failed ${method} ${path}: ${res.status} ${JSON.stringify(data)}`);
        }
        return data;
    } catch (e) {
        console.error(e.message);
        return null;
    }
}

async function verify() {
    console.log('--- Starting Onboard Verification ---');

    // 1. Register Admin
    console.log('\n> Registering Admin...');
    let admin = await request('POST', '/auth/register', {
        email: `admin_onboard_${Date.now()}@test.com`,
        password: 'password123',
        role: 'admin'
    });
    if (!admin) process.exit(1);

    // 2. Login Admin
    console.log('\n> Logging in Admin...');
    const adminAuth = await request('POST', '/auth/login', {
        email: admin.email,
        password: 'password123'
    });
    const token = adminAuth.token;
    console.log('Token received');

    // 3. Onboard
    console.log('\n> Onboarding Admin (Theater Details)...');
    const theater = await request('POST', '/admin/onboard', {
        name: 'Grand Rex',
        street: '1 Boulevard Poissonnière',
        area: '2nd Arrondissement',
        city: 'Paris',
        state: 'Ile-de-France',
        country: 'France'
    }, token);

    if (theater && theater.city === 'Paris') {
        console.log('\n✅ Onboarding Verified! Theater ID:', theater.id);
    } else {
        console.error('\n❌ Onboarding Failed');
    }
}

verify();
