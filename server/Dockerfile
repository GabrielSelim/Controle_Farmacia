# Imagem base Node.js
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Criar diretório para uploads
RUN mkdir -p uploads/records

# Expor porta
EXPOSE 3001

# Comando para iniciar
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
