# ⚡ SPORTVAULT — Full-Stack Sports Club

> React + Vite · Tailwind CSS · Node/Express · MongoDB Atlas · Socket.io · JWT Auth

---

## Architecture

```
sports-club/
├── server.js              ← Express API + Socket.io (port 3000)
├── package.json           ← Root: concurrently scripts
├── .env.example           ← Copy to .env and fill in
└── client/
    ├── vite.config.js     ← Proxy /api & /socket.io → :3000
    ├── src/
    │   ├── App.jsx        ← Router + ProtectedRoute
    │   ├── context/
    │   │   └── AuthContext.jsx   ← JWT state management
    │   ├── components/
    │   │   └── Navbar.jsx
    │   └── pages/
    │       ├── Home.jsx
    │       ├── Sports.jsx  ← useEffect fetch from /api/sports/news
    │       ├── Chat.jsx    ← Socket.io live chat
    │       └── Auth.jsx    ← Login + Signup
```

---

## How React (5173) Talks to Express (3000)

In **development**, Vite's `proxy` config in `vite.config.js` is the bridge:

```js
proxy: {
  '/api':       { target: 'http://localhost:3000', changeOrigin: true },
  '/socket.io': { target: 'http://localhost:3000', changeOrigin: true, ws: true },
}
```

- `fetch('/api/sports/news')` in React → Express `GET /api/sports/news`
- `io()` Socket.io connect → Express Socket.io server
- **No CORS headers needed** in dev (same origin from the browser's perspective)

In **production**, deploy Express separately and point React's `fetch` calls at the deployed URL, or set `VITE_API_URL` env var.

---

## Quick Start (GitHub Codespaces / Local)

### 1. Clone & install
```bash
git clone <your-repo>
cd sports-club
npm run install:all      # installs root + client dependencies
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and a strong JWT_SECRET
```

### 3. Run both servers simultaneously
```bash
npm run dev
```
- **React** → http://localhost:5173  
- **Express** → http://localhost:3000  
- `concurrently` kills both if either crashes.

---

## API Endpoints

| Method | Path                  | Auth     | Description              |
|--------|-----------------------|----------|--------------------------|
| POST   | `/api/auth/signup`    | Public   | Create account           |
| POST   | `/api/auth/login`     | Public   | Login, receive JWT       |
| GET    | `/api/auth/me`        | 🔒 JWT   | Get current user profile |
| GET    | `/api/sports/news`    | Public   | Fetch sports news feed   |
| GET    | `/api/health`         | Public   | Server health check      |

## Socket.io Events

| Event             | Direction          | Payload                         |
|-------------------|--------------------|---------------------------------|
| `join_room`       | Client → Server    | `{ room, username }`            |
| `message_history` | Server → Client    | `Message[]` (last 30)           |
| `send_message`    | Client → Server    | `{ room, username, text }`      |
| `receive_message` | Server → All Room  | `{ username, text, timestamp }` |
| `user_joined`     | Server → Room      | `{ username, message }`         |
| `user_left`       | Server → Room      | `{ username, message }`         |
| `online_count`    | Server → Room      | `number`                        |
| `typing`          | Client → Server    | `{ room, username }`            |
| `user_typing`     | Server → Others    | `{ username }`                  |

---

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist your IP (or `0.0.0.0/0` for Codespaces)
3. Copy the connection string into `.env`:
   ```
   MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/sportsclub
   ```

---

## Tech Stack

| Layer     | Tech                         |
|-----------|------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS |
| Backend   | Node.js, Express 4           |
| Database  | MongoDB Atlas (Mongoose)     |
| Real-time | Socket.io 4                  |
| Auth      | JWT (jsonwebtoken, bcryptjs) |
| Dev Tools | concurrently, nodemon        |
