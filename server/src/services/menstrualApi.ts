import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.RAPIDAPI_CYCLE_KEY;
const API_HOST = process.env.RAPIDAPI_CYCLE_HOST;

export interface CycleHistory {
  start_date: string; // YYYY-MM-DD
  end_date?: string;
}

export const MenstrualApi = {
  predict: async (cycles: CycleHistory[]) => {
    if (!API_KEY || !API_HOST) {
      throw new Error("RapidAPI keys are not configured in .env");
    }

    // Endpoint: /process_cycle_data
    const url = `https://${API_HOST}/process_cycle_data`;

    console.log(`Calling RapidAPI: ${url}`);

    const past_cycle_data = cycles.map(c => {
        const start = new Date(c.start_date);
        let length = 5; // default period length if end_date missing
        if (c.end_date) {
            const end = new Date(c.end_date);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            // Add 1 day because if start=1st and end=5th, it's 5 days (inclusive)
            // But let's check simple diff. 5-1 = 4. Usually inclusive is +1.
            // I'll stick to simple diff for now, or just ensure it's at least 1.
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            length = diffDays > 0 ? diffDays : 5;
        }
        return {
            cycle_start_date: start.toISOString().split('T')[0],
            period_length: length
        };
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-rapidapi-key': API_KEY,
          'x-rapidapi-host': API_HOST,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          current_date: new Date().toISOString().split('T')[0],
          past_cycle_data
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 403 && errorText.includes("subscribed")) {
           throw new Error("RapidAPI Subscription Required: You need to subscribe to this API on RapidAPI Hub.");
        }
        // If 400 "Not enough valid cycle data", we can return a friendly error or null
        if (response.status === 400 && errorText.includes("Not enough")) {
             console.warn("RapidAPI: Not enough data for prediction");
             return { error: "Not enough cycle data for prediction. Please log more cycles." };
        }
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("MenstrualApi Error:", error);
      throw error;
    }
  }
};
