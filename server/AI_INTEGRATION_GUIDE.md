# HopeBloom AI Integration Guide

## Overview
The HopeBloom AI Health Companion is now integrated with Google Gemini AI to provide empathetic, scientifically-grounded breast health support.

## API Configuration

### Environment Setup
The Google Gemini API key is configured in `/server/.env`:
```
GEMINI_API_KEY=AIzaSyDi-9DC1y4qYWjel32jek3xaLrOxHOE9Wc
```

## API Endpoints

### 1. Chat Endpoint
**POST** `/api/ai/chat`

Send messages to the HopeBloom AI Health Companion.

#### Request Body:
```json
{
  "prompt": "I noticed a small lump in my breast. Should I be worried?",
  "topic": "symptom",
  "useSystemPrompt": true
}
```

#### Parameters:
- `prompt` (required): User's question or message
- `topic` (optional): Type of conversation
  - `"general"` - General health questions
  - `"symptom"` - Symptom analysis and categorization
  - `"report"` - Medical report interpretation
- `useSystemPrompt` (optional, default: true): Whether to use HopeBloom system context

#### Response:
```json
{
  "success": true,
  "text": "AI response here...",
  "model": "gemini-2.0-flash-exp",
  "topic": "symptom",
  "timestamp": "2026-01-26T21:18:25.000Z"
}
```

### 2. Health Check Endpoint
**GET** `/api/ai/health`

Check if the AI service is properly configured.

#### Response:
```json
{
  "status": "healthy",
  "provider": "Google Gemini",
  "model": "gemini-2.0-flash-exp",
  "apiKeyConfigured": true,
  "timestamp": "2026-01-26T21:18:25.000Z"
}
```

## AI Capabilities

### 1. Medical Report Analysis
The AI can simplify complex medical reports (ultrasound, mammogram) into easy-to-understand language.

**Example:**
```json
{
  "prompt": "Can you explain this mammogram report: BI-RADS Category 3, scattered fibroglandular densities...",
  "topic": "report"
}
```

### 2. Symptom Categorization
Analyzes symptoms and categorizes them as:
- **Normal**: Common, non-concerning
- **Requires Monitoring**: Should be tracked
- **High Risk**: Needs immediate medical attention

**Example:**
```json
{
  "prompt": "I've had breast tenderness for 3 days before my period",
  "topic": "symptom"
}
```

### 3. Personalized Guidance
Tailored advice based on user profile:
- Health-Conscious Woman (prevention)
- Breast Cancer Fighter (treatment)
- Survivor (recovery)

### 4. Holistic Wellness
- Hormonal-balancing nutrition advice
- Post-surgery exercises (lymphedema prevention)
- Psychological coping strategies
- Meditation and journaling suggestions

### 5. Logistical Support
- Medication reminders
- Self-exam scheduling
- Doctor appointment tracking

## Language Support
The AI responds in both **Arabic** and **English**, automatically detecting the user's language.

## Safety Features

### Medical Disclaimer
All health-related responses include:
> ⚕️ This guidance is for informational purposes only and does not replace professional medical advice. Please consult with your healthcare provider for personalized medical decisions.

### Empathetic Tone
The AI uses supportive, calming language that acknowledges emotional stress and anxiety.

## Testing the Integration

### Using curl:
```bash
# Test general chat
curl -X POST http://localhost:4000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What are the early signs of breast cancer?",
    "topic": "general"
  }'

# Test symptom analysis
curl -X POST http://localhost:4000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "I have a painful lump that appeared suddenly",
    "topic": "symptom"
  }'

# Check AI health
curl http://localhost:4000/api/ai/health
```

### Using JavaScript/TypeScript:
```typescript
// General chat
const response = await fetch('http://localhost:4000/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'What exercises can help prevent lymphedema?',
    topic: 'general'
  })
});
const data = await response.json();
console.log(data.text);
```

## System Prompt Architecture

The AI uses a layered prompt system:

1. **Base System Prompt** (`HOPEBLOOM_SYSTEM_PROMPT`)
   - Defines role and mission
   - Sets empathy and safety guidelines
   - Establishes response protocols

2. **Topic-Specific Prompts**
   - `SYMPTOM_ANALYSIS_PROMPT` - For symptom categorization
   - `REPORT_ANALYSIS_PROMPT` - For medical report interpretation

3. **User Context** (Future Enhancement)
   - User profile data
   - Medical history
   - Current treatment phase

## Files Modified/Created

1. **Created**: `/server/src/ai/hopebloom-system-prompt.ts`
   - System prompts and role definitions

2. **Modified**: `/server/src/routes/ai.ts`
   - Enhanced with HopeBloom context
   - Added health check endpoint
   - Improved error handling

3. **Modified**: `/server/.env`
   - Added `GEMINI_API_KEY`

## Next Steps

To start using the AI:

1. **Start the server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:4000/api/ai/health
   ```

3. **Send your first message:**
   ```bash
   curl -X POST http://localhost:4000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Hello, I need help understanding breast health"}'
   ```

## Trusted Sources
The AI bases information on:
- World Health Organization (WHO)
- Mayo Clinic
- Egyptian Ministry of Health
- Evidence-based medical research

---

**Remember**: The HopeBloom AI is a supportive companion, not a replacement for professional medical care. Always encourage users to consult healthcare providers for medical decisions.
