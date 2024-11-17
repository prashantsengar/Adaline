# Real-time File System with Drag & Drop

A real-time file system with folder support and multi-session sync built with React, TypeScript, and Socket.IO.

## Features
- Real-time drag and drop file/folder organization
- Multi-session synchronization
- Nested folder support
- File type icons and visual feedback
- Real-time updates across multiple clients
- Error boundary protection
- Smooth animations and transitions

## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

## Environment Variables
```env
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[dbname]
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5000

## Technical Stack
- Frontend: React + TypeScript + Vite
- Styling: Tailwind CSS
- Drag & Drop: @dnd-kit
- Real-time: Socket.IO
- Database: PostgreSQL with Drizzle ORM
- Backend: Express + TypeScript

## Project Structure
- `/client` - Frontend React application
- `/server` - Express backend
- `/db` - Database schema and configurations
