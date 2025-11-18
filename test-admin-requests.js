import axios from 'axios';

async function testAdminRequests() {
  try {
    // Login as admin
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'lahiruimesh111@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    const token = loginRes.data.token;
    
    // Get all service requests
    const requestsRes = await axios.get('http://localhost:5000/api/admin/requests', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📋 Service Requests Response:');
    console.log('Success:', requestsRes.data.success);
    console.log('Total Requests:', requestsRes.data.data?.length || 0);
    console.log('\nRequests:');
    requestsRes.data.data?.forEach((req, i) => {
      console.log(`\n${i + 1}. ${req.service_type} (ID: ${req.id})`);
      console.log(`   Customer: ${req.customer_name}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Vehicle: ${req.vehicle_info?.year} ${req.vehicle_info?.make} ${req.vehicle_info?.model}`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testAdminRequests();
