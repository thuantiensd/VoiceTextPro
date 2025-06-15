# 🚀 Hướng dẫn Deploy VoiceTextPro lên Vercel

## Bước 1: Chuẩn bị Database PostgreSQL

### Tùy chọn A: Vercel Postgres (Khuyên dùng)
1. Truy cập: https://vercel.com/dashboard
2. Tạo project mới hoặc vào project hiện tại
3. Vào tab "Storage" → "Create Database" → "Postgres"
4. Chọn region gần nhất (Singapore cho Việt Nam)
5. Copy DATABASE_URL được tạo tự động

### Tùy chọn B: Neon Database (Miễn phí)
1. Truy cập: https://neon.tech
2. Đăng ký tài khoản miễn phí
3. Tạo project mới
4. Copy connection string từ dashboard

## Bước 2: Lấy API Keys

### FPT AI API Key
1. Truy cập: https://fpt.ai/
2. Đăng ký tài khoản
3. Vào Dashboard → API Keys
4. Tạo key mới cho Text-to-Speech

### OpenAI API Key  
1. Truy cập: https://platform.openai.com/
2. Đăng nhập/đăng ký
3. Vào API Keys section
4. Tạo new secret key

## Bước 3: Deploy lên Vercel

### Cách 1: Deploy từ Terminal (Nhanh)
```bash
# 1. Đăng nhập Vercel (nếu chưa)
vercel login

# 2. Deploy project
vercel

# 3. Làm theo hướng dẫn:
# - Chọn "Y" để setup project
# - Chọn scope (team/personal)
# - Nhập tên project hoặc để mặc định
# - Chọn "N" cho override settings (dùng vercel.json)
```

### Cách 2: Deploy từ GitHub (Tự động)
```bash
# 1. Push code lên GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main

# 2. Truy cập vercel.com
# 3. Import project từ GitHub
# 4. Chọn repository VoiceTextPro
```

## Bước 4: Cấu hình Environment Variables

Sau khi deploy, vào Vercel Dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
FPT_API_KEY=your_fpt_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=your_random_session_secret_here
NODE_ENV=production
```

### Tạo SESSION_SECRET ngẫu nhiên:
```bash
# Chạy lệnh này để tạo secret key:
openssl rand -base64 32
```

## Bước 5: Setup Database Schema

Sau khi deploy thành công:

```bash
# 1. Cài đặt Vercel CLI (nếu chưa)
npm install -g vercel

# 2. Link project local với Vercel
vercel link

# 3. Pull environment variables về local
vercel env pull .env.local

# 4. Chạy database migration
npm run db:push
```

## Bước 6: Khởi tạo Database với dữ liệu mẫu

```bash
# Chạy script khởi tạo database
npx tsx scripts/init-database.ts
```

## Bước 7: Kiểm tra Deploy

1. Truy cập URL được Vercel cung cấp
2. Kiểm tra các chức năng:
   - Đăng nhập: admin/admin123
   - Tạo audio từ text
   - Upload file
   - Admin dashboard

## 🔧 Troubleshooting

### Lỗi Database Connection
```bash
# Kiểm tra DATABASE_URL trong Vercel dashboard
# Đảm bảo database đang chạy và accessible
```

### Lỗi API Keys
```bash
# Kiểm tra FPT_API_KEY và OPENAI_API_KEY
# Test API keys trước khi deploy
```

### Lỗi Build
```bash
# Kiểm tra logs trong Vercel dashboard
# Thường do missing dependencies hoặc TypeScript errors
```

### Lỗi File Upload
```bash
# Vercel Serverless có giới hạn file size
# Cần cấu hình maxDuration và bodyParser limits
```

## 📋 Checklist Deploy

- [ ] Database PostgreSQL đã tạo
- [ ] FPT AI API Key đã có
- [ ] OpenAI API Key đã có  
- [ ] Environment variables đã cấu hình
- [ ] Database schema đã setup (db:push)
- [ ] Database đã khởi tạo dữ liệu mẫu
- [ ] Website truy cập được
- [ ] Đăng nhập admin thành công
- [ ] Chức năng TTS hoạt động
- [ ] Upload file hoạt động

## 🎯 Lưu ý quan trọng

1. **File Upload**: Vercel có giới hạn 50MB cho serverless functions
2. **Database**: Sử dụng connection pooling cho PostgreSQL
3. **API Limits**: Theo dõi usage của FPT AI và OpenAI APIs
4. **Domain**: Có thể add custom domain sau khi deploy
5. **SSL**: Vercel tự động cấp SSL certificate
6. **Monitoring**: Sử dụng Vercel Analytics để theo dõi performance

## 🚀 Sau khi Deploy thành công

1. **Custom Domain**: Thêm domain riêng nếu cần
2. **Analytics**: Bật Vercel Analytics
3. **Monitoring**: Setup alerts cho errors
4. **Backup**: Backup database định kỳ
5. **Updates**: Setup CI/CD cho auto-deploy

Chúc bạn deploy thành công! 🎉 