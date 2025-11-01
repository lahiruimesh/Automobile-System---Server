const BASE_URL = 'http://localhost:5000';

async function registerAndTest() {
  try {
    // 1. Register user
    console.log('📝 Registering user...');
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890',
        role: 'customer'
      })
    });
    console.log('Signup:', await signupRes.json());

    // 2. Login
    console.log('🔐 Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);

    // 3. Create service request
    if (loginData.token) {
      console.log('📋 Creating service request...');
      const requestRes = await fetch(`${BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${loginData.token}`
        },
        body: JSON.stringify({
          serviceType: 'Oil Change',
          description: 'Regular maintenance',
          vehicleInfo: { make: 'Toyota', model: 'Camry' }
        })
      });
      console.log('Request created:', await requestRes.json());
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run test
registerAndTest();