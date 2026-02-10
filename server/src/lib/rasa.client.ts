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
    const payload = JSON.stringify({ sender: senderId, message });
    const url = new URL(this.baseUrl);
    const isHttps = url.protocol === 'https:';
    const httpMod = require(isHttps ? 'https' : 'http');
    const options = {
      hostname: url.hostname,
      port: Number(url.port || (isHttps ? 443 : 80)),
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    };
    return new Promise<string>((resolve, reject) => {
      const req = httpMod.request(options, (res: any) => {
        let body = '';
        res.on('data', (chunk: any) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body) as RasaResponseItem[];
            const text = (data || [])
              .map((d) => d.text)
              .filter(Boolean)
              .join('\n');
            resolve(text || '');
          } catch (e) {
            reject(e);
          }
        });
      });
      req.on('error', (err: any) => reject(err));
      req.setTimeout(this.timeoutMs, () => {
        try { req.destroy(new Error('Rasa timeout')); } catch {}
      });
      req.write(payload);
      req.end();
    });
  }
}
