const axios = require('axios');

const BASE = 'https://test.api.amadeus.com';

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const res = await axios.post(
    `${BASE}/v1/security/oauth2/token`,
    new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  _token = res.data.access_token;
  _tokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return _token;
}

async function amadeusGet(path, params) {
  const token = await getToken();
  const res = await axios.get(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

function isConfigured() {
  const id = process.env.AMADEUS_CLIENT_ID;
  return id && id !== 'your_amadeus_client_id';
}

module.exports = { amadeusGet, isConfigured };
