import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { AuthenticatedWebSocket } from './types/types.ts';

let activeSession: {
  classId: string | null;
  startedAt: string | null;
  attendance: Map<string, 'present' | 'absent'>;
} = {
  classId: null,
  startedAt: null,
  attendance: new Map(),
};

export function startSession(classId: string) {
  activeSession = {
    classId,
    startedAt: new Date().toISOString(),
    attendance: new Map(),
  };
  console.log(`📍 Attendance session started for class: ${classId}`);
  return activeSession;
}

export function clearSession() {
  activeSession = {
    classId: null,
    startedAt: null,
    attendance: new Map(),
  };
  console.log('🧹 Active session cleared');
}

export function getActiveSession() {
  return activeSession;
}

export const createWss = (httpServer: any) => {
  const wss = new WebSocketServer({ server: httpServer });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => clearInterval(interval));

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.send(
        JSON.stringify({
          event: 'ERROR',
          data: { message: 'Unauthorized or invalid token' },
        }),
      );
      ws.close();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        role: 'teacher' | 'student';
      };
      ws.user = decoded;
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
      console.log(`🔌 Client connected: ${ws.user.userId} (${ws.user.role})`);
    } catch (err) {
      ws.send(
        JSON.stringify({
          event: 'ERROR',
          data: { message: 'Unauthorized or invalid token' },
        }),
      );
      ws.close();
      return;
    }

    ws.on('close', () => {
      console.log(`❌ Client disconnected: ${ws.user?.userId}`);
    });
  });
};
