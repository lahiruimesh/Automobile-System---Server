import axios from 'axios';

async function testEmployees() {
  try {
    // Login as admin
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'lahiruimesh111@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    const token = loginRes.data.token;
    
    // Get all employees
    const employeesRes = await axios.get('http://localhost:5000/api/admin/employees/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n📋 Employees Response:');
    console.log('Success:', employeesRes.data.success);
    console.log('Data structure:', Object.keys(employeesRes.data));
    console.log('\nAll employees:', JSON.stringify(employeesRes.data, null, 2));
    
    // Filter active employees
    const activeEmployees = (employeesRes.data.data || employeesRes.data.employees || []).filter(emp => emp.is_active);
    console.log('\n✅ Active employees count:', activeEmployees.length);
    console.log('Active employees:', activeEmployees.map(e => `${e.name} (${e.email})`));
    
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testEmployees();
