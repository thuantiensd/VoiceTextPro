#!/bin/bash

echo "🚀 VoiceText Pro - Quick Clone Script"
echo "Tạo copy toàn bộ project để deploy..."

# Tạo thư mục project mới
PROJECT_DIR="voicetext-pro-deploy"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Tạo package.json
cat > package.json << 'EOF'
{
  "name": "voicetext-pro",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.28.9",
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.17.10",
    "@types/multer": "^1.4.11",
    "@types/node": "^20.11.30",
    "@types/react": "^18.2.73",
    "@types/react-dom": "^18.2.23",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.19",
    "bcrypt": "^5.1.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "drizzle-kit": "^0.20.14",
    "drizzle-orm": "^0.30.4",
    "drizzle-zod": "^0.5.1",
    "express": "^4.19.2",
    "express-session": "^1.18.0",
    "framer-motion": "^11.0.28",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.363.0",
    "multer": "^1.4.5-lts.1",
    "nanoid": "^5.0.6",
    "next-themes": "^0.3.0",
    "openai": "^4.28.4",
    "postcss": "^8.4.38",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.51.1",
    "react-icons": "^5.0.1",
    "recharts": "^2.12.2",
    "tailwind-merge": "^2.2.2",
    "tailwindcss": "^3.4.1",
    "tailwindcss-animate": "^1.0.7",
    "tsx": "^4.7.1",
    "typescript": "^5.4.3",
    "vaul": "^0.9.0",
    "vite": "^5.2.6",
    "wouter": "^3.1.0",
    "zod": "^3.22.4"
  }
}
EOF

# Tạo .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/voicetext_pro

# API Keys
FPT_API_KEY=your_fpt_api_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Session Secret
SESSION_SECRET=your_random_session_secret_here

# Environment
NODE_ENV=production
PORT=3000
EOF

# Tạo thư mục cần thiết
mkdir -p client/src/{components,pages,hooks,lib}
mkdir -p server
mkdir -p shared
mkdir -p uploads

echo "✅ Project structure created!"
echo "📋 Next steps:"
echo "1. Copy source code từ Replit vào các thư mục tương ứng"
echo "2. Tạo file .env từ .env.example"
echo "3. npm install"
echo "4. npm run build"
echo "5. npm run start"