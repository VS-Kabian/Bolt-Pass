// Test script to verify API functionality
const https = require('http');

// Test login and fetch entries
async function testAPI() {
  try {
    console.log('1. Testing login...');

    // First, let's try to login
    const loginResponse = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'kabilan.muki@gmail.com', password: 'test123' })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.log('❌ Login failed. Trying to register...');

      const registerResponse = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'test123' })
      });

      const registerData = await registerResponse.json();
      console.log('Register response:', registerData);

      if (!registerData.token) {
        console.log('❌ Registration failed');
        return;
      }

      console.log('✅ Registered successfully');
      var token = registerData.token;
    } else {
      console.log('✅ Login successful');
      var token = loginData.token;
    }

    console.log('\n2. Testing /api/entries/titles...');
    const titlesResponse = await fetch('http://localhost:3000/api/entries/titles', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const titlesData = await titlesResponse.json();
    console.log('Titles response:', titlesData);

    if (titlesData.ok) {
      console.log(`✅ Found ${titlesData.items.length} password(s)`);
    } else {
      console.log('❌ Failed to fetch titles:', titlesData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
