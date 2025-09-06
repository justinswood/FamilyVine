FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
# Force reinstall sharp for the correct platform
RUN npm rebuild sharp --platform=linux --arch=x64
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]
