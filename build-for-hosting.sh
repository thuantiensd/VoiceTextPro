#!/bin/bash

echo "🚀 Chuẩn bị build cho hosting external..."

# Tạo thư mục build
mkdir -p build-output

# Copy tất cả file cần thiết
echo "📦 Copy files..."
cp -r client build-output/
cp -r server build-output/
cp -r shared build-output/
cp -r scripts build-output/
cp package.json build-output/
cp package-lock.json build-output/
cp tsconfig.json build-output/
cp vite.config.ts build-output/
cp tailwind.config.ts build-output/
cp postcss.config.js build-output/
cp components.json build-output/
cp drizzle.config.ts build-output/
cp DEPLOYMENT.md build-output/
cp .env.example build-output/

# Tạo thư mục uploads
mkdir -p build-output/uploads

# Tạo file start script cho production
cat > build-output/start.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VoiceText Pro..."
npm install
npm run build
npm run start
EOF

chmod +x build-output/start.sh

echo "✅ Build completed! Thư mục 'build-output' chứa tất cả file cần thiết."
echo ""
echo "📋 Hướng dẫn deploy:"
echo "1. Tải xuống thư mục 'build-output'"
echo "2. Upload lên hosting của bạn"
echo "3. Tạo file .env với các biến môi trường"
echo "4. Chạy: chmod +x start.sh && ./start.sh"