/**
 * Test script to fetch contacts from the API
 * Run: node test-contacts-api.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testContactsAPI() {
  try {
    console.log('🧪 Testing GET /api/contacts...\n');
    console.log(`📍 URL: ${BASE_URL}/api/contacts?page=1&limit=10000\n`);

    const response = await fetch(`${BASE_URL}/api/contacts?page=1&limit=10000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error Response:', data);
      return;
    }

    console.log('\n✅ Success! Response data:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Contacts returned: ${data.contacts?.length || 0}`);
    console.log(`📊 Total in database: ${data.pagination?.total || 0}`);
    console.log(`📄 Page: ${data.pagination?.page || 0}`);
    console.log(`📏 Limit: ${data.pagination?.limit || 0}`);
    console.log(`📑 Total pages: ${data.pagination?.pages || 0}`);
    
    if (data.contacts && data.contacts.length > 0) {
      console.log('\n📝 First 3 contacts:');
      data.contacts.slice(0, 3).forEach((contact, index) => {
        console.log(`\n  ${index + 1}. ${contact.name || 'N/A'}`);
        console.log(`     Email: ${contact.email || 'N/A'}`);
        console.log(`     Phone: ${contact.phone || 'N/A'}`);
        console.log(`     Company: ${contact.company || 'N/A'}`);
        console.log(`     ID: ${contact._id || 'N/A'}`);
      });
    } else {
      console.log('\n⚠️  No contacts found in database');
      console.log('💡 Try creating a contact first using the frontend or API');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. Backend server is running on port 3000');
    console.error('   2. MongoDB is connected');
    console.error('   3. Network connectivity is available');
  }
}

// Run the test
testContactsAPI();

