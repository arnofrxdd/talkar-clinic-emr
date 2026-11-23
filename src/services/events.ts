import { Response } from 'express';

interface SSEClient {
  id: string;
  res: Response;
  clinicSlug?: string;
}

class ClinicEventService {
  private clients: SSEClient[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  addClient(id: string, res: Response, clinicSlug?: string) {
    this.clients.push({ id, res, clinicSlug });
  }

  removeClient(id: string) {
    this.clients = this.clients.filter((client) => client.id !== id);
  }

  broadcast(eventType: string, data: any, targetClinicSlug?: string) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;

    this.clients.forEach((client) => {
      if (
        !targetClinicSlug ||
        !client.clinicSlug ||
        client.clinicSlug === 'all' ||
        client.clinicSlug === targetClinicSlug
      ) {
        try {
          client.res.write(payload);
        } catch (err) {
          console.error(`Failed to push SSE to client ${client.id}:`, err);
        }
      }
    });
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        try {
          client.res.write(`: heartbeat\n\n`);
        } catch {
          // ignore dead connections
        }
      });
    }, 20000);
  }
}

export const clinicEventService = new ClinicEventService();
