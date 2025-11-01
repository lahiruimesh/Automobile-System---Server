// Test Service Request API Workflow
const BASE_URL = 'http://localhost:5000';

// 1. Login to get JWT token
async function login() {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  return data.token;
}

// 2. Create Service Request
async function createRequest(token) {
  const response = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      serviceType: 'Oil Change',
      description: 'Regular oil change service needed',
      vehicleInfo: {
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        licensePlate: 'ABC123'
      }
    })
  });
  return await response.json();
}

// 3. Get User Requests
async function getUserRequests(token) {
  const response = await fetch(`${BASE_URL}/api/requests`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

// 4. Update Request Status (Admin only)
async function updateStatus(token, requestId) {
  const response = await fetch(`${BASE_URL}/api/requests/${requestId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status: 'in-progress',
      progress: 50
    })
  });
  return await response.json();
}

// Run Test Workflow
async function testWorkflow() {
  try {
    console.log('🔐 Logging in...');
    const token = await login();
    
    console.log('📝 Creating service request...');
    const newRequest = await createRequest(token);
    console.log('Created:', newRequest);
    
    console.log('📋 Getting user requests...');
    const userRequests = await getUserRequests(token);
    console.log('User Requests:', userRequests);
    
    if (newRequest.data?.id) {
      console.log('🔄 Updating request status...');
      const updated = await updateStatus(token, newRequest.data.id);
      console.log('Updated:', updated);
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Uncomment to run test
// testWorkflow();