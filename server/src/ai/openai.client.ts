import fetch from 'node-fetch';

export class OpenAIClient {
  private apiKeys: string[];
  private apiKeyIndex = 0;
  private model: string;
  private timeout: number;

  constructor(config: { apiKey: string; model?: string; timeout?: number }) {
    const keys = String(config.apiKey || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!keys.length) throw new Error('OPENAI_API_KEY is required');
    this.apiKeys = keys;
    this.model = config.model || 'gpt-4o-mini';
    this.timeout = config.timeout || 15000;
  }

  private getApiKey(): string {
    return this.apiKeys[this.apiKeyIndex] || this.apiKeys[0];
  }

  private rotateKey(): void {
    if (this.apiKeys.length <= 1) return;
    this.apiKeyIndex = (this.apiKeyIndex + 1) % this.apiKeys.length;
  }

  async generateText(system: string, messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<{ content: string; usage?: any }> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: this.model,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.7,
      max_tokens: 800,
    };

    const controller = new AbortController();
    const tId = setTimeout(() => controller.abort(), this.timeout);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal as any,
      });
      clearTimeout(tId);

      if (!res.ok) {
        if (res.status === 429 || res.status === 401 || res.status === 403) {
          this.rotateKey();
        }
        const errText = await res.text();
        throw new Error(`OpenAI error ${res.status}: ${errText}`);
      }
      const data: any = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return { content, usage: data?.usage };
    } catch (e) {
      clearTimeout(tId);
      throw e;
    }
  }

  getModel(): string { return this.model; }
}

