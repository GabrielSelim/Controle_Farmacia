# 🐳 Guia de Deploy com Docker

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose instalado
- Git instalado

## 🚀 Deploy Rápido

### 1. Clone o repositório

```bash
git clone https://github.com/GabrielSelim/Controle_Farmacia.git
cd Controle_Farmacia
```

### 2. Configure as variáveis de ambiente (IMPORTANTE!)

```bash
cp .env.example .env
```

Edite o arquivo `.env` e **altere o JWT_SECRET** para um valor seguro:

```env
JWT_SECRET=SUA_CHAVE_SECRETA_SUPER_SEGURA_AQUI
```

### 3. Execute o projeto

```bash
docker-compose up -d --build
```

Pronto! O sistema estará disponível em:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3001

## 📊 Persistência de Dados

Os dados são armazenados em **Docker Volumes nomeados** que persistem mesmo após `docker-compose down`:

- **db_data**: Banco de dados SQLite
- **uploads_data**: Fotos enviadas

### Para ver os volumes criados:

```bash
docker volume ls
```

### Para fazer backup dos dados:

```bash
# Backup do banco de dados
docker run --rm -v controle_farmacia_db_data:/data -v $(pwd):/backup alpine tar czf /backup/backup-db.tar.gz /data

# Backup das fotos
docker run --rm -v controle_farmacia_uploads_data:/uploads -v $(pwd):/backup alpine tar czf /backup/backup-uploads.tar.gz /uploads
```

### Para restaurar backup:

```bash
# Restaurar banco de dados
docker run --rm -v controle_farmacia_db_data:/data -v $(pwd):/backup alpine tar xzf /backup/backup-db.tar.gz -C /

# Restaurar fotos
docker run --rm -v controle_farmacia_uploads_data:/uploads -v $(pwd):/backup alpine tar xzf /backup/backup-uploads.tar.gz -C /
```

## 🔧 Comandos Úteis

### Ver logs em tempo real

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f server

# Apenas frontend
docker-compose logs -f web
```

### Parar os containers (DADOS PERSISTEM)

```bash
docker-compose down
```

### Parar e REMOVER volumes (⚠️ APAGA DADOS!)

```bash
docker-compose down -v
```

### Reiniciar serviços

```bash
docker-compose restart
```

### Rebuild após alterações no código

```bash
docker-compose up -d --build
```

### Executar comando no container

```bash
# Acessar shell do backend
docker-compose exec server sh

# Executar migrations manualmente
docker-compose exec server npx prisma migrate deploy

# Ver status do Prisma
docker-compose exec server npx prisma migrate status
```

## 🔐 Segurança em Produção

1. **Altere o JWT_SECRET** no arquivo `.env`
2. Configure um **reverse proxy** (Nginx/Traefik) com SSL/TLS
3. Use **firewall** para limitar acesso às portas
4. Configure **backups automáticos** dos volumes
5. Monitore os logs regularmente

## 🌐 Deploy em Servidor

### Exemplo com domínio e SSL (usando Nginx)

1. Instale Nginx no servidor
2. Configure proxy reverso:

```nginx
# /etc/nginx/sites-available/farmacia
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploads
    location /uploads/ {
        proxy_pass http://localhost:3001/uploads/;
        proxy_set_header Host $host;
    }
}
```

3. Configure SSL com Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 🔄 Atualização do Sistema

Para atualizar para uma nova versão:

```bash
# 1. Fazer backup (recomendado)
# (comandos de backup acima)

# 2. Parar containers
docker-compose down

# 3. Atualizar código
git pull origin main

# 4. Rebuild e subir
docker-compose up -d --build
```

## ❓ Troubleshooting

### Containers não iniciam

```bash
# Ver logs de erro
docker-compose logs

# Ver status
docker-compose ps
```

### Banco de dados corrompido

```bash
# Restaurar do backup
# (comandos de restore acima)
```

### Limpar tudo e recomeçar (⚠️ APAGA DADOS!)

```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## 📱 Primeiro Acesso

Após o deploy, crie o usuário administrador acessando a tela de registro ou via API diretamente.

## 🆘 Suporte

Para problemas ou dúvidas, abra uma issue no GitHub.
