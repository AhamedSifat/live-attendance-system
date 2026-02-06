# Live Attendance System Backend

A real-time backend system for managing live classroom attendance using WebSocket, with role-based access for teachers and students. Built to pass the test suite (38/38 tests passed) based on the provided specifications.

## Overview

This project is a complete backend implementation for a live attendance system, developed in TypeScript with Node.js. It includes:

- User authentication (signup, login, profile).
- Role-based access control (teacher and student).
- Class management (create classes, add students).
- WebSocket-based live attendance marking and summaries.
- Attendance persistence to MongoDB.
- Key assumption: Only ONE class session active at a time; no room management – all broadcasts to connected clients.

**Specification Source**: [Notion Spec](https://brindle-goal-102.notion.site/Backend-WebSocket-Live-Attendance-System-2c646b36b2e980b09b42d7c0240a8170)

**Test Results**: 32 tests passed using the provided test app: [https://github.com/rahul-MyGit/mid-test](https://github.com/rahul-MyGit/mid-test)

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Node.js
- **Server**: Express
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Authentication**: JWT, bcrypt
- **Real-time**: WebSocket (ws library)
- **Others**: dotenv for environment variables, cors for cross-origin support

## Features

- **Authentication**: Signup, login, and user details retrieval.
- **Role-Based Access**: Teachers manage classes and attendance; students view their status.
- **Class Management**: Create classes, add students, view class details (populated with user info).
- **Live Attendance via WebSocket**: Mark attendance, get summaries, student self-check, and finalize session with DB persistence.
- **Error Handling**: Standardized JSON responses for validation, auth, and not found errors.
- **In-Memory State**: Global active session for the current class attendance.

## Prerequisites

- Node.js v18 or higher
- MongoDB (local or MongoDB Atlas)
- Git

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/live-attendance-system.git
   cd live-attendance-system
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables in `.env`:

   ```
   MONGO_URI=mongodb://127.0.0.1:27017/attendance_db
   JWT_SECRET=supersecretkeychangeinproduction1234567890
   PORT=3000
   ```

4. Build the TypeScript code:

   ```
   npm run build
   ```

5. Start the server:
   ```
   npm start
   ```
   For development mode (with hot-reloading):
   ```
   npm run dev
   ```

The API will be available at `http://localhost:3000`, and WebSocket at `ws://localhost:3000/ws?token=<JWT_TOKEN>`.

## API Routes

All HTTP responses follow the standard format:

- Success: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": "Error message" }`

JWT token required in `Authorization: <JWT_TOKEN>` header for protected routes.

### Authentication Routes

- **POST /auth/signup**: Create user (name, email, password, role).
- **POST /auth/login**: Get JWT token.
- **GET /auth/me**: Get current user details.

### Class Routes

- **POST /class**: Create a class (teacher only).
- **POST /class/:id/add-student**: Add student to class (teacher only).
- **GET /class/:id**: View class details (teacher or enrolled student).
- **GET /students**: List all students (teacher only).
- **GET /class/:id/my-attendance**: View student's attendance (student only).

### Attendance Routes

- **POST /attendance/start**: Start attendance session for a class (teacher only).

## WebSocket Integration

Connect via: `ws://localhost:3000/ws?token=<JWT_TOKEN>`

Messages format: `{ "event": "EVENT_NAME", "data": { ... } }`

### Events

- **ATTENDANCE_MARKED**: Teacher marks student status; broadcast to all.
- **TODAY_SUMMARY**: Teacher requests summary; broadcast to all.
- **MY_ATTENDANCE**: Student requests own status; unicast response.
- **DONE**: Teacher ends session, persists to DB; broadcast final summary to all.

Error messages: `{ "event": "ERROR", "data": { "message": "..." } }`

## Project Structure

```
src/
├── index.ts               # Entry point for server and WebSocket
├── types/
│   └── index.ts           # Type definitions
├── models/
│   ├── User.ts
│   ├── Class.ts
│   └── Attendance.ts
├── middleware/
│   └── auth.ts            # Authentication middleware
├── utils/
│   └── schemas.ts         # Zod validation schemas
├── routes/
│   ├── auth.ts
│   ├── class.ts
│   └── attendance.ts
└── websocket.ts           # WebSocket setup and event handlers
```

## Testing

- Use Postman or Insomnia for API testing.
- For WebSocket: Tools like wscat or WebSocket clients.
- Run against the test app: Clone [https://github.com/rahul-MyGit/mid-test](https://github.com/rahul-MyGit/mid-test) and follow its instructions.
- This implementation passes all 38 tests.

## Contributing

Feel free to fork and submit pull requests. For major changes, open an issue first.

## License

MIT License

## Acknowledgments

- Built based on the Notion spec: [Backend + WebSocket - Live Attendance System](https://brindle-goal-102.notion.site/Backend-WebSocket-Live-Attendance-System-2c646b36b2e980b09b42d7c0240a8170)
- Thanks to the test app for validation.

If you have any issues, feel free to reach out!
