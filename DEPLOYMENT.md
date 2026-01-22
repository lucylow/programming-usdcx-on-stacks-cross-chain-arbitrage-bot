# Deployment Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL 15+ (for production)
- Redis 7+ (for caching)
- Ethereum RPC endpoint (Alchemy, Infura, etc.)
- Stacks API access
- Circle xReserve API key

## Local Development

### Frontend Setup

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development server:
\`\`\`bash
npm run dev
\`\`\`

3. Access at `http://localhost:3000`

### Backend Setup

1. Navigate to backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Configure environment:
\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

4. Start backend server:
\`\`\`bash
npm run dev
\`\`\`

5. API available at `http://localhost:3001`

## Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend on Vercel
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
\`\`\`

#### Backend on Railway
\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
\`\`\`

### Option 2: Docker Deployment

1. Build and run with Docker Compose:
\`\`\`bash
cd backend
docker-compose up -d
\`\`\`

2. Access API at `http://localhost:3001`

### Option 3: VPS Deployment

1. SSH into your server:
\`\`\`bash
ssh user@your-server.com
\`\`\`

2. Clone repository:
\`\`\`bash
git clone https://github.com/yourusername/arbitrage-bot.git
cd arbitrage-bot
\`\`\`

3. Setup backend:
\`\`\`bash
cd backend
npm install
npm run build
pm2 start dist/index.js --name arbitrage-bot
\`\`\`

4. Setup nginx reverse proxy:
\`\`\`nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

## Environment Variables

### Frontend (.env.local)
\`\`\`bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
\`\`\`

### Backend (.env)
See `backend/.env.example` for complete list.

## Database Setup

### PostgreSQL

1. Create database:
\`\`\`sql
CREATE DATABASE arbitrage_bot;
\`\`\`

2. Run migrations:
\`\`\`bash
cd backend
npm run db:migrate
\`\`\`

### Redis

Redis should be running on default port 6379. Configure connection in `.env` if using custom settings.

## Monitoring

### Health Checks
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api/health`

### Logs
- Frontend: Check browser console
- Backend: `tail -f backend/logs/app.log`

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Store private keys in secrets manager
- [ ] Enable HTTPS in production
- [ ] Configure CORS for production domain only
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerts

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify environment variables are set
- Check port 3001 is available

### Frontend can't connect to backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS settings in backend
- Ensure backend is running

### Database connection errors
- Verify PostgreSQL credentials
- Check database exists
- Ensure database port is accessible

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/arbitrage-bot/issues
- Documentation: See README.md and ARCHITECTURE.md
