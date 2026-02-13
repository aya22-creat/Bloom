interface RasaMessage {
  recipient_id: string;
  text: string;
}

interface RasaResponseItem {
  text?: string;
  image?: string;
  buttons?: any[];
  custom?: any;
}

export class RasaClient {
  constructor(private baseUrl: string, private timeoutMs: number = 15000) {}

  async sendMessage(senderId: string, message: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: senderId, message }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Rasa HTTP ${res.status}`);
      }
      const data = (await res.json().catch(() => [])) as RasaResponseItem[];
      const text = (data || [])
        .map((d) => d.text)
        .filter(Boolean)
        .join('\n');
      return text || '';
    } finally {
      clearTimeout(timeout);
    }
  }
}
