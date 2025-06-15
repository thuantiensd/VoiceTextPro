# 🚀 VoiceText Pro - Hướng dẫn Deploy sang Hosting Khác

## 📦 Tải xuống Project hoàn chỉnh

File `voicetext-pro-complete.tar.gz` đã được tạo và chứa toàn bộ source code.

### Cách tải xuống từ Replit:
1. Nhấn vào file `voicetext-pro-complete.tar.gz` trong Files panel
2. Nhấn Download để tải về máy
3. Giải nén file: `tar -xzf voicetext-pro-complete.tar.gz`

## 🌐 Các Hosting Provider được khuyên dùng:

### 1. **VPS/Server riêng** (Khuyên dùng nhất)
- **DigitalOcean Droplet**: $5/tháng, Ubuntu 20.04
- **Vultr**: $2.5/tháng, nhiều datacenter
- **Linode**: $5/tháng, hiệu năng tốt
- **AWS EC2**: Scalable, pay-as-you-use

### 2. **Platform-as-a-Service**
- **Railway**: Deploy nhanh, tự động scaling
- **Render**: Free tier có sẵn
- **Heroku**: Dễ sử dụng (có phí)

### 3. **Serverless/JAMstack**
- **Vercel**: Tốt nhất cho frontend, cần Serverless functions cho backend
- **Netlify**: Tương tự Vercel

## ⚙️ Bước deploy nhanh (VPS Ubuntu):

```bash
# 1. Cài đặt môi trường
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib

# 2. Tạo database
sudo -u postgres createdb voicetext_pro
sudo -u postgres psql -c "CREATE USER voicetext_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE voicetext_pro TO voicetext_user;"

# 3. Upload và setup project
cd /var/www
sudo mkdir voicetext-pro
sudo chown $USER:$USER voicetext-pro
cd voicetext-pro

# Upload file tar.gz và giải nén
tar -xzf voicetext-pro-complete.tar.gz

# 4. Cài đặt dependencies
npm install

# 5. Tạo .env file
cat > .env << EOF
DATABASE_URL=postgresql://voicetext_user:your_password@localhost:5432/voicetext_pro
FPT_API_KEY=your_fpt_api_key
OPENAI_API_KEY=your_openai_key
SESSION_SECRET=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3000
EOF

# 6. Setup database
npm run db:push

# 7. Build và chạy
npm run build
npm run start
```

## 🔑 Lấy API Keys:

### FPT AI API Key:
1. Truy cập: https://fpt.ai/
2. Đăng ký tài khoản
3. Vào dashboard → API Keys
4. Copy API key vào .env

### OpenAI API Key:
1. Truy cập: https://platform.openai.com/
2. Đăng nhập/đăng ký
3. Vào API Keys section
4. Tạo new key và copy vào .env

## 🔧 Cấu hình Nginx (Optional):

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📋 Troubleshooting:

### Database không kết nối được:
```bash
# Kiểm tra PostgreSQL đang chạy
sudo systemctl status postgresql
sudo systemctl start postgresql

# Test connection
psql -h localhost -U voicetext_user -d voicetext_pro
```

### Port đã được sử dụng:
```bash
# Kiểm tra process đang dùng port 3000
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Permission denied:
```bash
# Cấp quyền cho thư mục uploads
chmod 755 uploads/
sudo chown -R www-data:www-data uploads/
```

## 🎯 Tips để website chạy ổn định:

1. **Sử dụng PM2** để auto-restart:
```bash
npm install -g pm2
pm2 start "npm run start" --name voicetext-pro
pm2 startup
pm2 save
```

2. **Setup SSL** với Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

3. **Monitor logs**:
```bash
pm2 logs voicetext-pro
tail -f /var/log/nginx/error.log
```

4. **Backup database** định kỳ:
```bash
pg_dump voicetext_pro > backup_$(date +%Y%m%d).sql
```

## 💡 Lưu ý quan trọng:

- Đảm bảo server có ít nhất 1GB RAM
- Mở port 3000 (hoặc port bạn chọn) trong firewall
- Cấu hình domain trỏ về IP server
- Thiết lập SSL certificate cho security
- Backup database thường xuyên
- Monitor disk space cho thư mục uploads/

Chúc bạn deploy thành công!