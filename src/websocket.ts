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
