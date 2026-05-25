
FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /app

# Copy package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install dependencies (hanya yang diperlukan untuk production)
RUN npm install --production

# Copy seluruh source code kamu ke dalam container
COPY . .

# Beritahu Docker bahwa container ini menggunakan port 3001
EXPOSE 3001

# Perintah utama untuk menjalankan server saat container start
CMD ["node", "index.js"]