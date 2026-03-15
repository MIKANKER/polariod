# Deployment Guide - Polaroid Frame Frontend

This document provides comprehensive instructions for building and deploying the Polaroid Frame web frontend application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Build Process](#build-process)
- [Deployment Steps](#deployment-steps)
- [Browser Compatibility](#browser-compatibility)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the application, ensure you have:

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Backend API**: Running and accessible Python/FastAPI backend
- **Supabase Project**: Active Supabase project with authentication configured

## Environment Variables

The application requires the following environment variables to be configured. Create a `.env` file in the `frontend/` directory based on `.env.example`.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL of the backend API | `https://api.yourapp.com` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_ENV` | Environment identifier | `production` |

### Development Environment

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_development_anon_key
VITE_ENV=development
```

### Production Environment

```env
VITE_API_BASE_URL=https://api.yourapp.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_ENV=production
```

### Getting Supabase Credentials

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** (for `VITE_SUPABASE_URL`)
5. Copy the **anon/public** key (for `VITE_SUPABASE_ANON_KEY`)

**Security Note**: The anon key is safe to use in the frontend as it only allows operations permitted by your Row Level Security (RLS) policies.

## Build Process

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Type Checking

Verify TypeScript types before building:

```bash
npm run type-check
```

This runs TypeScript compiler in check mode without emitting files. Fix any type errors before proceeding.

### 3. Linting

Check and fix code quality issues:

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors
npm run lint:fix
```

### 4. Run Tests

Ensure all tests pass before deployment:

```bash
# Run all tests
npm run test

# Run tests with coverage report
npm run test:coverage
```

### 5. Build for Production

```bash
npm run build
```

This command:
- Runs TypeScript compiler to check types
- Bundles the application using Vite
- Applies code splitting and lazy loading
- Minifies JavaScript and CSS
- Optimizes assets (images, fonts)
- Generates source maps for debugging
- Outputs to `dist/` directory

### Build Output

The build process creates the following structure:

```
dist/
├── index.html                 # Entry HTML file
├── assets/
│   ├── js/
│   │   ├── index-[hash].js           # Main entry point
│   │   ├── react-vendor-[hash].js    # React libraries chunk
│   │   ├── ui-vendor-[hash].js       # UI libraries chunk
│   │   ├── form-vendor-[hash].js     # Form libraries chunk
│   │   ├── state-vendor-[hash].js    # State management chunk
│   │   ├── api-vendor-[hash].js      # API libraries chunk
│   │   └── [page]-[hash].js          # Lazy-loaded page chunks
│   ├── images/
│   │   └── [name]-[hash].[ext]       # Optimized images
│   ├── fonts/
│   │   └── [name]-[hash].[ext]       # Font files
│   └── [name]-[hash].css             # Compiled CSS
```

### Build Optimization Features

The build configuration includes:

- **Code Splitting**: Separate chunks for vendors and pages
- **Lazy Loading**: Routes loaded on-demand
- **Tree Shaking**: Removes unused code
- **Minification**: Compressed JavaScript and CSS
- **Asset Optimization**: Images inlined if < 4KB
- **Console Removal**: `console.log` statements removed in production
- **Cache Optimization**: Content-based hashing for long-term caching

### Preview Build Locally

Test the production build locally before deployment:

```bash
npm run preview
```

This starts a local server serving the `dist/` directory at `http://localhost:4173`.

## Deployment Steps

### Option 1: Static Hosting (Vercel, Netlify, etc.)

#### Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd frontend
   vercel
   ```

3. Configure environment variables in Vercel dashboard:
   - Go to **Settings** → **Environment Variables**
   - Add all required `VITE_*` variables
   - Redeploy after adding variables

#### Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   cd frontend
   netlify deploy --prod
   ```

3. Configure environment variables in Netlify dashboard:
   - Go to **Site settings** → **Environment variables**
   - Add all required `VITE_*` variables

#### Configuration Files

For automated deployments, include these configuration files:

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 2: Traditional Web Server (Nginx, Apache)

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourapp.com;
    root /var/www/polaroid-frame/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache Configuration (.htaccess)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>
```

### Option 3: Docker Deployment

**Dockerfile**:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t polaroid-frame-frontend .
docker run -p 80:80 polaroid-frame-frontend
```

### Option 4: AWS S3 + CloudFront

1. Build the application:
   ```bash
   npm run build
   ```

2. Upload to S3:
   ```bash
   aws s3 sync dist/ s3://your-bucket-name --delete
   ```

3. Configure S3 bucket for static website hosting

4. Create CloudFront distribution pointing to S3 bucket

5. Configure CloudFront error pages to redirect 404 to `/index.html` for SPA routing

## Browser Compatibility

### Supported Browsers

The application is tested and supported on:

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |
| Opera | 76+ | Full support |
| Samsung Internet | 14+ | Full support |
| iOS Safari | 14+ | Mobile support |
| Chrome Android | 90+ | Mobile support |

### Browser Features Required

The application requires the following browser features:

- **ES2020 JavaScript**: Modern JavaScript syntax
- **CSS Grid & Flexbox**: Layout
- **CSS Custom Properties**: Theming
- **Fetch API**: Network requests
- **LocalStorage**: Session persistence
- **File API**: File uploads
- **FormData**: Multipart uploads
- **Promises & Async/Await**: Asynchronous operations
- **IntersectionObserver**: Lazy loading (with polyfill fallback)

### Polyfills

The build automatically includes necessary polyfills for older browsers through Vite's default configuration.

### Testing Browser Compatibility

Test the application on:
- Latest versions of Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Android)
- Different screen sizes (320px to 2560px width)
- Touch and mouse input devices

## Performance Optimization

### Build Optimizations

The production build includes:

1. **Code Splitting**: Vendor libraries separated into chunks
2. **Lazy Loading**: Routes loaded on demand
3. **Tree Shaking**: Unused code eliminated
4. **Minification**: JavaScript and CSS compressed
5. **Asset Optimization**: Images optimized and inlined when small
6. **Gzip Compression**: Enabled on server

### Runtime Optimizations

1. **React Query Caching**: API responses cached for 5-10 minutes
2. **Image Lazy Loading**: Images loaded as they enter viewport
3. **Debounced Inputs**: Form inputs debounced to reduce re-renders
4. **Memoization**: Expensive computations memoized with `useMemo`
5. **Virtual Scrolling**: Large lists virtualized (if implemented)

### Performance Metrics

Target metrics:

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Monitoring Performance

Use these tools to monitor performance:

- **Lighthouse**: Built into Chrome DevTools
- **WebPageTest**: https://www.webpagetest.org
- **Chrome DevTools Performance Tab**: Record and analyze runtime performance

## Troubleshooting

### Build Errors

**TypeScript Errors**:
```bash
# Check types
npm run type-check

# Common fix: Update type definitions
npm install --save-dev @types/react@latest @types/react-dom@latest
```

**Dependency Errors**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Out of Memory**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Runtime Errors

**Environment Variables Not Loading**:
- Ensure variables start with `VITE_` prefix
- Restart dev server after changing `.env`
- Check variables are set in deployment platform

**API Connection Errors**:
- Verify `VITE_API_BASE_URL` is correct
- Check CORS configuration on backend
- Ensure backend is accessible from frontend domain

**Authentication Errors**:
- Verify Supabase credentials are correct
- Check Supabase project is active
- Ensure RLS policies are configured

**Routing Issues (404 on Refresh)**:
- Configure server to serve `index.html` for all routes
- Check `.htaccess` or Nginx configuration
- Verify deployment platform supports SPA routing

### Performance Issues

**Large Bundle Size**:
```bash
# Analyze bundle
npm run build:analyze

# Check for duplicate dependencies
npm dedupe
```

**Slow Loading**:
- Enable gzip/brotli compression on server
- Configure CDN for static assets
- Optimize images before upload
- Review lazy loading implementation

### Deployment Issues

**Build Succeeds Locally but Fails in CI/CD**:
- Check Node.js version matches
- Verify all dependencies in `package.json`
- Check environment variables are set
- Review build logs for specific errors

**White Screen After Deployment**:
- Check browser console for errors
- Verify all environment variables are set
- Check asset paths are correct
- Ensure server serves `index.html` for routes

## Security Considerations

### Environment Variables

- Never commit `.env` files to version control
- Use different Supabase keys for development and production
- Rotate keys if accidentally exposed

### Content Security Policy

Consider adding CSP headers:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://your-api.com https://*.supabase.co;
```

### HTTPS

Always deploy with HTTPS enabled:
- Use Let's Encrypt for free SSL certificates
- Configure automatic certificate renewal
- Redirect HTTP to HTTPS

## Maintenance

### Regular Updates

Keep dependencies updated:

```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Update to latest major versions (carefully)
npm install package@latest
```

### Monitoring

Set up monitoring for:
- Error tracking (e.g., Sentry)
- Performance monitoring (e.g., Google Analytics, Vercel Analytics)
- Uptime monitoring (e.g., UptimeRobot)

### Backup

Regularly backup:
- Source code (Git repository)
- Environment variables
- Deployment configurations

## Support

For issues or questions:
- Check application logs
- Review browser console errors
- Consult backend API documentation
- Review Supabase documentation

---

**Last Updated**: 2024
**Version**: 1.0.0
