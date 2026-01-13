# HopeBloom AI Health Assistant - Prompt System

## Overview

This prompt system provides a comprehensive framework for the HopeBloom AI Health Assistant chatbot. It ensures the assistant responds with empathy, accuracy, and appropriate medical boundaries while providing personalized support based on user type.

## Key Features

### 1. **Context-Aware Responses**
- Adapts to user type (Fighter, Survivor, Wellness)
- Personalizes greetings using user's name
- Provides relevant suggestions based on user journey

### 2. **Medical Safety**
- Never provides medical diagnoses
- Always includes disclaimers when discussing medical topics
- Encourages consulting healthcare providers
- Detects emergency situations and responds appropriately

### 3. **Emotional Support**
- Recognizes emotional distress keywords
- Provides empathetic responses
- Offers coping strategies and resources
- Validates user feelings

### 4. **Response Templates**
Pre-built templates for common scenarios:
- Greetings (personalized by user type)
- Symptom inquiries
- Emotional support
- Treatment support
- General questions

## System Prompt Structure

### Base System Prompt
Defines core principles:
- Compassion-first approach
- Medical boundaries
- Empowerment focus
- Evidence-based information
- Respectful communication

### User Type Specific Prompts

#### Fighter (Currently in Treatment)
- Focus on treatment support
- Side effect management
- Emotional validation during treatment
- Encouragement and strength reminders

#### Survivor (Post-Treatment)
- Recovery and follow-up care
- Recurrence concerns
- Post-treatment wellness
- Long-term health strategies

#### Wellness (Prevention Focus)
- Education and prevention
- Self-examination guidance
- Lifestyle factors
- Early detection strategies

## Usage

```typescript
import { 
  generateSystemPrompt, 
  getContextualSuggestions,
  needsMedicalDisclaimer,
  formatResponse,
  RESPONSE_TEMPLATES
} from "@/lib/chatbot-prompts";

// Generate system prompt for user
const systemPrompt = generateSystemPrompt({
  userName: "Sarah",
  userType: "fighter",
  currentDate: "2024-03-15"
});

// Get contextual suggestions
const suggestions = getContextualSuggestions("fighter");

// Check if medical disclaimer needed
const needsDisclaimer = needsMedicalDisclaimer(userMessage);

// Format response with disclaimer if needed
const formattedResponse = formatResponse(
  response,
  needsDisclaimer,
  userName
);
```

## Response Generation Logic

The system uses keyword detection to route messages:

1. **Emergency Detection**: Severe symptoms trigger immediate medical attention advice
2. **Emotional Support**: Detects emotional distress and provides empathetic responses
3. **Symptom Inquiries**: Provides guidance with medical disclaimers
4. **Treatment Questions**: Offers treatment-related support
5. **General Support**: Provides general helpful responses

## Safety Guidelines

- Never diagnose medical conditions
- Always refer to healthcare providers for medical decisions
- Detect and respond to emergency situations
- No medication recommendations
- Respect user boundaries
- Cultural sensitivity
- Bilingual support (Arabic/English)

## Integration with AI APIs

The system prompt is stored in localStorage and can be used with AI APIs:

```typescript
// Get stored system prompt
const systemPrompt = localStorage.getItem('hopebloom_chatbot_prompt');

// Use with AI API
const response = await aiAPI.chat({
  system: systemPrompt,
  messages: conversationHistory,
  user: userMessage
});
```

## Future Enhancements

- Integration with actual AI/LLM APIs (OpenAI, Anthropic, etc.)
- Conversation history management
- Multi-language support (Arabic/English)
- Learning from user interactions
- Integration with health tracking data
- Personalized recommendations based on user profile

## Medical Disclaimer

All responses include appropriate medical disclaimers when discussing health topics:

> "This information is for educational and support purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."

