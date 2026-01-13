import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
// Ensure you set GEMINI_API_KEY in your environment before starting the server.
const ai = new GoogleGenAI({});

router.post('/chat', async (req, res) => {
  try {
    const { prompt, system } = req.body as { prompt?: string; system?: string };
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    // Combine system prompt with user prompt when provided
    const contents = system ? `${system}\n\nUser: ${prompt}` : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const text = (response as any)?.text ?? '';
    return res.json({ text });
  } catch (err: any) {
    console.error('Gemini chat error:', err?.message || err);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

export default router;