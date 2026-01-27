import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.RAPIDAPI_KEY;
const API_HOST = process.env.RAPIDAPI_HOST;

if (!API_KEY || !API_HOST) {
  console.error("Missing keys in .env");
  process.exit(1);
}

async function testApi() {
  console.log('Testing RapidAPI connection...');
  
  const endpoints = [
    { path: '/predict_cycle_phases', method: 'POST', body: { last_period_start: "2023-10-01", average_cycle_length: 28 } },
    { path: '/predict_phases', method: 'POST', body: { last_period_start: "2023-10-01", cycle_length: 28 } },
    { 
      path: '/process_cycle_data', 
      method: 'POST', 
      body: { 
        current_date: new Date().toISOString().split('T')[0],
         past_cycle_data: [
             { cycle_start_date: "2023-10-01", period_length: 5 },
             { cycle_start_date: "2023-10-29", period_length: 5 },
             { cycle_start_date: "2023-11-26", period_length: 5 }
         ]
      } 
    }
  ];

  for (const ep of endpoints) {
    const url = `https://${API_HOST}${ep.path}`;
    console.log(`\nTrying ${ep.method} ${url}...`);
    try {
      const response = await fetch(url, {
        method: ep.method,
        headers: {
          'x-rapidapi-key': API_KEY!,
          'x-rapidapi-host': API_HOST!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ep.body)
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 300)}`);
      
    } catch (error) {
      console.error(`Error with ${ep.path}:`, error);
    }
  }
}

testApi();
