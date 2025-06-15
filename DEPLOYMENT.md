# VoiceText Pro - Hướng dẫn Deploy lên Hosting Khác

## 🚀 Cách Deploy lên VPS/Hosting

### Bước 1: Chuẩn bị Server
```bash
# Cài đặt Node.js 18+ và PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib

# Tạo database
sudo -u postgres createdb voicetext_pro
sudo -u postgres createuser --interactive voicetext_user
```

### Bước 2: Upload Code
```bash
# Tải file từ Replit hoặc clone repository
# Giải nén vào thư mục /var/www/voicetext-pro
cd /var/www/voicetext-pro

# Cài đặt dependencies
npm install
```

### Bước 3: Cấu hình Environment Variables

Tạo file `.env`:
```env
# Database (thay đổi theo thông tin của bạn)
DATABASE_URL=postgresql://voicetext_user:password@localhost:5432/voicetext_pro

# API Keys (lấy từ dashboard FPT.AI và OpenAI)
FPT_API_KEY=your_fpt_api_key_here
OPENAI_API_KEY=sk-your_openai_key_here

# Session Secret (tạo chuỗi ngẫu nhiên 32 ký tự)
SESSION_SECRET=random_32_character_string_here

# Production Environment
NODE_ENV=production
PORT=3000
```

### Bước 4: Setup Database
```bash
# Chạy migrations
npm run db:push

# Khởi tạo dữ liệu mặc định (optional)
npm run db:seed
```

### Bước 5: Build và Chạy
```bash
# Build frontend
npm run build

# Chạy production server
npm run start

# Hoặc dùng PM2 để chạy background
npm install -g pm2
pm2 start "npm run start" --name voicetext-pro
pm2 save
pm2 startup
```

## 🌐 Deploy lên Vercel/Netlify

### Vercel (Recommended)
1. Fork repository về GitHub của bạn
2. Kết nối Vercel với GitHub repo
3. Thêm Environment Variables trong Vercel dashboard
4. Deploy tự động

### Netlify
1. Build local: `npm run build`
2. Upload thư mục `dist/` lên Netlify
3. Cấu hình redirects cho SPA

## 🐳 Deploy với Docker

Tạo `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

Chạy với Docker:
```bash
docker build -t voicetext-pro .
docker run -p 3000:3000 --env-file .env voicetext-pro
```

## 📋 Checklist Deploy

- [ ] Node.js 18+ đã cài đặt
- [ ] PostgreSQL đã setup và chạy
- [ ] File `.env` đã cấu hình đầy đủ
- [ ] Thư mục `uploads/` có quyền ghi
- [ ] Port 3000 đã mở (hoặc port bạn chọn)
- [ ] SSL certificate đã cài đặt (cho production)
- [ ] Backup database định kỳ

## 🔧 Troubleshooting

### Lỗi Database Connection
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql

# Kiểm tra connection string
psql "postgresql://username:password@host:port/database"
```

### Lỗi Permission
```bash
# Cấp quyền cho thư mục uploads
chmod 755 uploads/
chown -R www-data:www-data uploads/
```

### Lỗi Build
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🎯 Hosting Providers Khuyên Dùng

1. **DigitalOcean Droplet** - VPS linh hoạt, giá rẻ
2. **AWS EC2** - Scalable, nhiều tính năng
3. **Vercel** - Dễ deploy, tích hợp CI/CD
4. **Railway** - Deploy nhanh, tự động scaling
5. **Render** - Free tier, dễ sử dụng

## 💡 Tips Tối ưu Performance

1. Sử dụng CDN cho static files
2. Enable gzip compression
3. Setup Redis cache
4. Monitor với PM2/Supervisor
5. Regular database backup
