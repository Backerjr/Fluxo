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
# Contact repository owner for required environment variables

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

## 🧪 Testing

```bash
# Run all tests
pnpm test
```

## 🔧 Environment

Create a `.env` in the repo root before running `pnpm dev`. Common keys:

- `DATABASE_URL` — MySQL/TiDB connection string
- `JWT_SECRET` — secret used to sign session tokens
- `OAUTH_SERVER_URL` and `VITE_OAUTH_PORTAL_URL` — OAuth base URLs
- `VITE_APP_ID` — app/client ID for OAuth flows
- `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` — optional; set to enable Umami analytics
- `VITE_FRONTEND_FORGE_API_URL` / `VITE_FRONTEND_FORGE_API_KEY` and `BUILT_IN_FORGE_API_URL` / `BUILT_IN_FORGE_API_KEY` — optional Forge API access
- `OWNER_OPEN_ID` — optional admin override

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
