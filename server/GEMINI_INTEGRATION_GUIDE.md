# Gemini AI Integration Guide - HopeBloom

Complete production-ready integration of Google Gemini API for HopeBloom Health Companion.

## Quick Start (3 Steps)

### 1. Set Up Environment Variables

Copy the example file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
GEMINI_API_KEY=AIzaSyDi-9DC1y4qYWjel32jek3xaLrOxHOE9Wc
GEMINI_MODEL=gemini-1.5-pro
```

**⚠️ Security**: Never commit `.env` to Git. It's in `.gitignore`.

### 2. Initialize AI on App Startup

Update your `index.ts`:

```typescript
import { initializeGeminiAI } from './ai/init';

async function startApp() {
  // Initialize AI BEFORE starting server
  await initializeGeminiAI();
  
  // Now safe to use AI routes
  app.use('/api/ai', aiRoutes);
  
  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
}

startApp().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
```

### 3. Use AI Service in Controllers

```typescript
import { getAIService } from '../ai/ai.service';
import { AITask } from '../ai/types';

const aiService = getAIService();

// In your route handler:
const response = await aiService.chat(userId, {
  task: AITask.WELLNESS_ADVICE,
  input: {
    currentSymptoms: ['fatigue'],
    goals: ['better sleep']
  },
  context: { language: 'en' }
});

res.json({ success: true, data: response });
```

## Architecture Overview

```
Controller Route
    ↓
AIService (singleton)
    ├→ Validates request
    ├→ Injects master prompt
    ├→ Builds task-specific prompt
    ↓
GeminiClient
    ├→ Handles API communication
    ├→ Retry logic + timeout
    ├→ Error handling
    ↓
Google Gemini API
```

## Available AI Tasks

All tasks are enum-based and pre-defined for medical safety:

1. **WELLNESS_ADVICE** - Lifestyle and prevention
2. **SYMPTOM_EDUCATION** - Understanding symptoms (not diagnosis)
3. **MEDICATION_REMINDER** - Medication adherence guidance
4. **CYCLE_TRACKING_INSIGHT** - Menstrual cycle awareness
5. **HEALTH_QUESTION** - Educational health answers
6. **WELLNESS_TIPS** - Preventive health practices
7. **SELF_EXAM_GUIDANCE** - Self-examination education
8. **PREVENTIVE_TIPS** - Disease prevention strategies
9. **LIFESTYLE_SUGGESTION** - Habit improvement
10. **APPOINTMENT_PREPARATION** - Doctor visit preparation

## API Endpoints

All endpoints require authentication middleware that sets `req.userId`.

### POST /api/ai/wellness-advice
```json
{
  "currentSymptoms": ["fatigue", "headache"],
  "goals": ["better sleep", "more energy"]
}
```

### POST /api/ai/symptom-education
```json
{
  "symptoms": ["breast pain", "discharge"],
  "context": "Symptoms started 2 weeks ago"
}
```

### POST /api/ai/medication-reminder
```json
{
  "medicationName": "Tamoxifen",
  "dosage": "20mg daily",
  "sideEffects": ["hot flashes", "mood changes"]
}
```

### POST /api/ai/health-question
```json
{
  "question": "What are the risk factors for breast cancer?",
  "context": "Family history present"
}
```

### GET /api/ai/health
Health check endpoint. No auth required.

Response:
```json
{
  "success": true,
  "status": "healthy",
  "provider": "GoogleGemini",
  "timestamp": "2025-01-26T..."
}
```

## Medical Safety Features

### 1. Task-Driven Architecture
- Only predefined tasks (enum-based)
- No free-text prompts
- Prevents prompt injection attacks

### 2. Master System Prompt
- Injected into every request
- Enforces medical safety principles
- Prevents diagnosis/prescription
- Stored in environment for easy updates

### 3. Response Validation
- Check for empty responses
- Validate safety ratings
- Block harmful content before returning

### 4. Error Handling
- Structured error objects
- User-friendly error messages
- Internal logging for debugging
- HTTP status codes for API clients

## File Structure

```
src/ai/
├── types.ts                    # Type definitions and enums
├── gemini.client.ts            # Gemini API client
├── ai.service.ts               # Core AI service (singleton)
├── init.ts                      # Initialization helper
├── hopebloom-system-prompt.ts  # System prompt manager
├── interfaces/
│   └── ai-provider.interface.ts # Provider contract
├── dtos/
│   ├── ai-request.dto.ts
│   └── ai-response.dto.ts
└── ...

src/routes/
└── ai.ts                       # API endpoints

src/lib/
└── master-prompt.ts            # Master prompt loader

Configuration:
├── .env                        # Secrets (in .gitignore)
└── .env.example                # Template
```

## Error Handling

The service returns structured errors with:
- `type`: AIErrorType (enum)
- `message`: Internal debug message
- `userMessage`: Safe message for client
- `statusCode`: HTTP status
- `details`: Optional debugging info

Example error response:
```json
{
  "success": false,
  "error": {
    "type": "GEMINI_RATE_LIMIT",
    "userMessage": "Too many requests. Please try again later.",
    "statusCode": 429,
    "details": { "retryAfter": 60 }
  }
}
```

## Environment Variables

```env
# Gemini Configuration
GEMINI_API_KEY=AIzaSy...         # Your API key
GEMINI_MODEL=gemini-1.5-pro      # Model to use
GEMINI_TIMEOUT=30000              # Request timeout (ms)
GEMINI_MAX_RETRIES=3              # Retry attempts

# Master Prompt (can be very long)
MASTER_SYSTEM_PROMPT=You are...  # System prompt for all requests
```

## Testing

### Health Check
```bash
curl http://localhost:3000/api/ai/health
```

### Wellness Advice
```bash
curl -X POST http://localhost:3000/api/ai/wellness-advice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "currentSymptoms": ["fatigue"],
    "goals": ["better energy"]
  }'
```

## Troubleshooting

### "GEMINI_API_KEY not found"
- Check `.env` file exists and has correct API key
- Restart application after changing .env
- Don't commit `.env` to Git

### "AI service not initialized"
- Ensure `initializeGeminiAI()` is called before routes
- Check application startup logs for initialization errors

### "Rate limit exceeded"
- Implement exponential backoff (already in GeminiClient)
- Check Gemini API quota in Google Cloud Console
- Errors include `retryAfter` timestamp

### "Timeout errors"
- Increase `GEMINI_TIMEOUT` for slow networks
- Default is 30 seconds
- Check network connectivity

### Empty responses
- Validate that input is not empty
- Check `currentSymptoms`, `question`, etc. are provided
- Review error logs for details

## Production Checklist

- [ ] Set secure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in .env
- [ ] Use strong `GEMINI_API_KEY` from Google Cloud
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS/TLS in production
- [ ] Add rate limiting middleware (optional)
- [ ] Set up monitoring/logging
- [ ] Test all AI endpoints
- [ ] Verify error messages don't leak sensitive info
- [ ] Document any custom system prompt modifications
- [ ] Set up backup API key rotation strategy

## Next Steps

1. **Implement Database Logging** - Log all AI requests/responses for audit trail
2. **Add Rate Limiting** - Prevent API abuse with request rate limiting
3. **Implement Caching** - Cache similar requests for performance
4. **Add Analytics** - Track which AI features are most used
5. **Custom Prompts** - Load system prompt from database for real-time updates
6. **Multi-language** - Add task-specific prompts for Arabic support

## Support

For issues:
1. Check error logs in console
2. Review error messages and error types
3. Check network connectivity
4. Verify API key is valid in Google Cloud Console
5. Check API quota usage
