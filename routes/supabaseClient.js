const fetch = require('node-fetch');

const SUPABASE_URL = 'https://jrhrpebhmmtxccsqrokl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyaHJwZWJobW10eGNjc3Fyb2tsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NjA2NzAsImV4cCI6MjA4ODQzNjY3MH0.NbH3_ypmZH-MoPwqEvPMjHkkd8sL8XHKtHOVux3g04E';

async function callEdgeFunction(functionName, method, body = null, queryParams = {}) {
  const url = new URL(`${SUPABASE_URL}/functions/v1/${functionName}`);
  Object.keys(queryParams).forEach(key => queryParams[key] && url.searchParams.append(key, queryParams[key]));

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), options);
  const data = await response.json();
  return { data, status: response.status };
}

module.exports = { callEdgeFunction };
