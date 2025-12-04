# Fluxo — Lead Enrichment Intelligence

A production-ready lead enrichment dashboard built with React 19, Tailwind CSS 4, and tRPC. Designed for B2B sales teams to manage and monitor AI-driven lead enrichment pipelines.

## ✨ Features

- **Lead Management Dashboard**: View, filter, and manage enriched leads with confidence scores
- **AI-Powered Insights**: Gemini Intelligence integration for smart lead analysis
- **Real-time Status Tracking**: Monitor enrichment progress (enriched, processing, failed, pending)
- **Mobile-First Design**: Fully responsive with touch-friendly interactions
- **Database Persistence**: MySQL backend with Drizzle ORM
- **Authentication**: Built-in user authentication system
- **Modern UI**: Dark mode interface with glassmorphism effects

## 🚀 Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Node.js, Express, tRPC
- **Database**: MySQL with Drizzle ORM
- **Authentication**: JWT-based auth system
- **Testing**: Vitest

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.production
# Edit .env.production with your values

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

## 🚀 Deployment

### Quick Deployment

```bash
# Deploy with PM2 (recommended for production)
./scripts/deploy.sh pm2

# Deploy with Docker
./scripts/deploy.sh docker

# Manual deployment
./scripts/deploy.sh manual
```

### Detailed Deployment Guide

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment instructions including:
- Environment configuration
- Database setup (AWS RDS, PlanetScale, self-hosted)
- Docker deployment
- Manual deployment with PM2
- CI/CD setup with GitHub Actions
- Monitoring and maintenance
- Backup and restore procedures

## 🧪 Testing

```bash
# Run all tests
pnpm test
```

## 📱 Mobile Support

Fluxo is fully responsive with:
- Collapsible sidebar with hamburger menu
- Mobile card view for lead table
- Full-screen detail panel on mobile
- Touch-friendly buttons and interactions

## 🔗 Repository

GitHub: [Backerjr/Fluxo](https://github.com/Backerjr/Fluxo)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
