const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.get('http://localhost:5000/v1/carts', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'X-Currency': 'USD'
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
testApi();
