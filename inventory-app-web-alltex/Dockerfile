FROM node:20-alpine

WORKDIR /app

# Instalar pnpm primero
RUN npm install -g pnpm

# Copiar dependencias y lock
COPY package.json pnpm-lock.yaml* ./

# Instalar usando pnpm
RUN pnpm install

COPY . .

EXPOSE 5173

# Arrancar Vite con pnpm
CMD ["pnpm", "run", "dev", "--", "--host"]