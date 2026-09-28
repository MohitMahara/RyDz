# RyDz — Real-Time Ride Hailing Platform

![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat&logo=socketdotio&logoColor=white)

A real-time ride-hailing platform built with React, Node.js, PostgreSQL, Redis, Prisma, Socket.IO, and a self-hosted OSRM routing service.

RyDz provides rider and driver flows with real-time ride requests, driver availability, ride management, location-based driver matching, and route/distance calculations.

## Tech Stack

### Client

- React
- TypeScript
- Vite
- Tailwind CSS
- Socket.IO Client
- Photon Geocoder

### Server

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- Redis
- Socket.IO
- JWT
- Zod

### Routing

- Self-hosted OSRM routing engine
- OpenStreetMap data

## Project Structure

```text
RyDz/
├── client/                 # React + Vite frontend
├── server/                 # Node.js + Express backend
│   ├── prisma/             # Prisma schema and configuration
│   ├── src/                # Backend source code
│   ├── test/               # Tests
│   ├── dist/               # Compiled JavaScript
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
├── docs/                   # Project documentation
└── .gitignore
```

## Environment Variables

### Client

Create `client/.env`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

`VITE_BACKEND_URL` should point to the URL where the RyDz backend is running.

### Server

Create `server/.env`:

```env
PORT=5000
DATABASE_URL=
REDIS_URL=
NODE_ENV=development
RECAPTCHA_SECRET=
JWT_SECRET=
JWT_REFRESH_SECRET=
OSRM_ROUTING_URL=
```

Example environment files are included in the project for reference.

## Running Locally

### Backend

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

## OSRM Routing Service

RyDz uses a self-hosted OSRM routing service for routing-related operations such as road distance and travel duration.

Configure the service through:

```env
OSRM_ROUTING_URL=
```

The OSRM service must be running and accessible to the RyDz backend.

## License

MIT License
