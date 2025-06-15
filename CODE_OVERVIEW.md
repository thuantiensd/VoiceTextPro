# VoiceText Pro - Code Overview

## Cấu trúc project

### Frontend (client/)
- **src/App.tsx** - Router và component chính
- **src/pages/home.tsx** - Trang chủ với TTS tool
- **src/components/tts-tool.tsx** - Component TTS chính
- **src/hooks/use-tts.tsx** - Hook xử lý FPT TTS API
- **src/components/file-manager.tsx** - Quản lý file audio
- **src/components/hero.tsx** - Hero section
- **src/lib/queryClient.ts** - API client setup

### Backend (server/)
- **index.ts** - Express server setup
- **routes.ts** - API routes (TTS, file upload, audio management)
- **storage.ts** - In-memory database
- **vite.ts** - Vite development setup

### Shared (shared/)
- **schema.ts** - Database schema và types

### Config files
- **package.json** - Dependencies
- **vite.config.ts** - Vite configuration
- **tailwind.config.ts** - Tailwind CSS config
- **tsconfig.json** - TypeScript config

## Key Features Implemented

1. **FPT TTS Integration** - API endpoint `/api/tts`
2. **File Upload** - PDF/Word/TXT text extraction
3. **Audio Management** - Save, search, share audio files
4. **Responsive Design** - Mobile-friendly interface
5. **Dark/Light Theme** - Theme switching
6. **Audio Visualizer** - Visual feedback during playback

## API Endpoints

- `POST /api/tts` - Generate speech with FPT AI
- `POST /api/extract-text` - Extract text from files
- `GET /api/audio-files` - List audio files
- `POST /api/audio-files` - Save audio file
- `DELETE /api/audio-files/:id` - Delete audio file

## Environment Variables Required

- `FPT_API_KEY` - FPT AI Text-to-Speech API key
- `DATABASE_URL` - PostgreSQL connection (provided by Replit)