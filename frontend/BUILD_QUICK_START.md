# Build Quick Start Guide

Quick reference for building and deploying the Polaroid Frame frontend.

## Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- Environment variables configured

## Quick Build

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Run tests
npm run test

# 4. Build for production
npm run build

# 5. Preview locally
npm run preview
```

## Environment Variables

Create `.env` file with:

```env
VITE_API_BASE_URL=https://your-api.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ENV=production
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

## Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Deploy to Nginx

```bash
# Build
npm run build

# Copy to server
scp -r dist/* user@server:/var/www/app/

# Configure Nginx (see DEPLOYMENT.md)
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run lint` | Check code quality |
| `npm run type-check` | Check TypeScript types |

## Build Output

```
dist/
├── index.html
└── assets/
    ├── js/           # JavaScript bundles
    ├── images/       # Optimized images
    └── fonts/        # Font files
```

## Troubleshooting

**Build fails**: Check Node.js version (need 18+)
**White screen**: Check environment variables
**404 on refresh**: Configure server for SPA routing

See `DEPLOYMENT.md` for detailed documentation.
