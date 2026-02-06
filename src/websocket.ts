import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import type { AuthenticatedWebSocket } from './types/types.ts';

let activeSession: {
  classId: string | null;
  startedAt: string | null;
  attendance: Map<string, 'present' | 'absent'>;
} = {
  classId: null,
  startedAt: null,
  attendance: new Map(),
};

function broadcastToStudents(wss: WebSocketServer, event: string, data: any) {
  const message = JSON.stringify({ event, data });
  wss.clients.forEach((client: any) => {
    if (
      client.readyState === WebSocket.OPEN &&
      client.user?.role === 'student'
    ) {
      client.send(message);
    }
  });
}
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
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

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

    ws.on('message', async (message: Buffer) => {
      const { event, data } = JSON.parse(message.toString());
      try {
        switch (event) {
          case 'ATTENDANCE_MARKED':
            await handleAttendanceMarked(ws, wss, data);
            break;
          default:
            ws.send(
              JSON.stringify({
                event: 'ERROR',
                data: { message: 'Unknown event' },
              }),
            );
        }
      } catch (err: any) {
        console.error('WebSocket error:', err);
        ws.send(
          JSON.stringify({
            event: 'ERROR',
            data: { message: err.message || 'Internal server error' },
          }),
        );
      }
    });

    ws.on('close', () => {
      console.log(`❌ Client disconnected: ${ws.user?.userId}`);
    });
  });
};

async function handleAttendanceMarked(
  ws: AuthenticatedWebSocket,
  wss: WebSocketServer,
  data: any,
) {
  if (ws.user.role !== 'teacher')
    throw new Error('Forbidden, teacher event only');
  if (!activeSession.classId) throw new Error('No active attendance session');

  const { studentId, status } = data;
  if (!studentId || !['present', 'absent'].includes(status)) {
    throw new Error('Invalid studentId or status');
  }

  activeSession.attendance.set(studentId, status);
  broadcastToStudents(wss, 'ATTENDANCE_MARKED', { studentId, status });
}
