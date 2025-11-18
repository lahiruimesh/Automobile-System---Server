import axios from 'axios';

const API = "http://localhost:5000";

async function testAdminAPI() {
  try {
    console.log('\n=== 1. Logging in as Admin ===');
    const loginResponse = await axios.post(`${API}/api/auth/login`, {
      email: 'lahiruimesh111@gmail.com',
      password: 'admin123'
    });
    
    console.log('Login successful!');
    console.log('User:', loginResponse.data.user);
    const token = loginResponse.data.token;
    console.log('Token:', token.substring(0, 50) + '...');

    console.log('\n=== 2. Fetching Pending Employees ===');
    const pendingResponse = await axios.get(`${API}/api/admin/employees/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Pending Employees:', pendingResponse.data);
    console.log('Count:', pendingResponse.data.length);

    if (pendingResponse.data.length > 0) {
      console.log('\n=== 3. Testing Approve (First Employee) ===');
      const firstEmployeeId = pendingResponse.data[0].id;
      console.log('Approving employee ID:', firstEmployeeId);
      
      const approveResponse = await axios.put(
        `${API}/api/admin/employees/${firstEmployeeId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Approve response:', approveResponse.data);
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAdminAPI();
