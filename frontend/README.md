# Polaroid Frame - Frontend

Modern, responsive web interface for the Polaroid Frame application built with React, TypeScript, and Vite.

## Features

- 🎨 Modern UI with Tailwind CSS
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🔐 Authentication with Supabase
- 🖼️ Template management and photo rendering
- ♿ WCAG AA accessibility compliant
- 🧪 Comprehensive testing (unit + property-based)
- ⚡ Fast development with Vite HMR

## Tech Stack

- **Framework**: React 18.3+ with TypeScript 5.3+
- **Build Tool**: Vite 5+
- **Routing**: React Router 6
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS 3
- **UI Components**: Headless UI, Lucide React, Framer Motion
- **Forms**: React Hook Form + Zod
- **API**: Axios + Supabase JS Client
- **Testing**: Vitest + Testing Library + fast-check

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running on http://localhost:8000
- Supabase project configured

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# VITE_API_BASE_URL=http://localhost:8000
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API service layer
│   ├── stores/         # Zustand stores
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── config/         # Configuration files
│   ├── test/           # Test setup and utilities
│   ├── App.tsx         # Root component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── tests/              # Test files
└── index.html          # HTML entry point
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_ENV` | Environment (development/production) | No |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Testing

The project uses a dual testing approach:

- **Unit Tests**: Verify specific examples and component behavior
- **Property-Based Tests**: Verify universal properties across randomized inputs

Run tests with:
```bash
npm run test
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Private project
