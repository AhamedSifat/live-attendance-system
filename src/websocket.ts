import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import type { AuthenticatedWebSocket } from './types/types.ts';
import Attendance from './models/Attendance.ts';
import Class from './models/Class.ts';

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

          case 'TODAY_SUMMARY':
            await handleTodaySummary(ws, wss);
            break;

          case 'MY_ATTENDANCE':
            await handleMyAttendance(ws);
            break;

          case 'DONE':
            await handleDone(ws, wss);
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

async function handleTodaySummary(
  ws: AuthenticatedWebSocket,
  wss: WebSocketServer,
) {
  if (ws.user.role !== 'teacher')
    throw new Error('Forbidden, teacher event only');
  if (!activeSession.classId) throw new Error('No active attendance session');

  const values = Array.from(activeSession.attendance.values());
  const present = values.filter((s: string) => s === 'present').length;
  const absent = values.filter((s: string) => s === 'absent').length;
  const total = present + absent;

  broadcastToStudents(wss, 'TODAY_SUMMARY', { present, absent, total });
}

async function handleMyAttendance(ws: AuthenticatedWebSocket) {
  if (ws.user.role !== 'student')
    throw new Error('Forbidden, student event only');
  if (!activeSession.classId) throw new Error('No active attendance session');

  const status =
    activeSession.attendance.get(ws.user.userId) || 'not yet updated';
  ws.send(
    JSON.stringify({
      event: 'MY_ATTENDANCE',
      data: { status },
    }),
  );
}

async function handleDone(ws: AuthenticatedWebSocket, wss: WebSocketServer) {
  if (ws.user.role !== 'teacher')
    throw new Error('Forbidden, teacher event only');
  if (!activeSession.classId) throw new Error('No active attendance session');

  const classDoc = await Class.findById(activeSession.classId);
  if (!classDoc || classDoc.teacherId.toString() !== ws.user.userId) {
    throw new Error('Forbidden, not class teacher');
  }

  for (const studentId of classDoc.studentIds) {
    const sid = studentId.toString();
    if (!activeSession.attendance.has(sid)) {
      activeSession.attendance.set(sid, 'absent');
    }
  }

  const records = Array.from(activeSession.attendance.entries()).map(
    ([studentId, status]) => ({
      classId: activeSession.classId,
      studentId,
      status,
    }),
  );

  await Attendance.insertMany(records);

  const values = Array.from(activeSession.attendance.values());
  const present = values.filter((s: string) => s === 'present').length;
  const absent = values.filter((s: string) => s === 'absent').length;
  const total = present + absent;

  broadcastToStudents(wss, 'DONE', {
    message: 'Attendance persisted',
    present,
    absent,
    total,
  });

  clearSession();
}
