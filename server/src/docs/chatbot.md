# /api/chat/chat

POST with Bearer JWT.

Body:
- message: string (required)
- module: breast_cancer | general_oncology | survivorship (optional)

Response JSON:
- success: boolean
- provider: rasa | gemini_fallback
- fallback: boolean
- data.text: string
- safety: { flagged: boolean; reason?: string }

Notes:
- System Prompt is injected and configurable via env MASTER_SYSTEM_PROMPT
- Conversation logs store only timestamp, user_id, module and message length
- Severe symptoms trigger safety advice to contact professionals immediately

