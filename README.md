# WhatsApp-style Chat App (MERN + Socket.io)

Real-time 1-to-1 chat application built with MongoDB, Express, React and Node — messaging is powered by Socket.io.

## Features
- Signup / Login with JWT auth (passwords hashed with bcrypt)
- User list with online/offline status
- Real-time messaging via Socket.io
- Typing indicator
- Message delivery/read ticks (✓ sent, ✓✓ delivered, ✓✓ blue-ish for read)
- Chat history persisted in MongoDB

## Project structure
```
whatsapp-clone/
├── server/   # Express + Socket.io + MongoDB backend
└── client/   # React (Vite) frontend
```

## Setup

### 1. Backend
```bash
cd server
npm install
cp .env.example .env
# edit .env: set MONGO_URI (local MongoDB or Atlas), JWT_SECRET
npm run dev
```
Server runs on `http://localhost:5000`.

You need MongoDB running locally (`mongod`) or a MongoDB Atlas connection string in `.env`.

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`.

### 3. Try it
- Open two different browser windows (or one normal + one incognito) at `http://localhost:5173`
- Register two different accounts
- Select each other from the sidebar and start chatting in real time

## Notes / Next steps you can add
- Group chats (extend Message schema with a `roomId`)
- Media/file sharing (use multer + cloud storage like Cloudinary)
- Push notifications
- Message search
- Deploy: backend on Render/Railway, frontend on Vercel/Netlify, DB on MongoDB Atlas
