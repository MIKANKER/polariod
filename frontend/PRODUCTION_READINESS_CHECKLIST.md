# Production Readiness Checklist

Use this checklist before deploying to production.

## Pre-Deployment

### Code Quality
- [ ] All tests passing (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript types valid (`npm run type-check`)
- [ ] Code formatted (`npm run format:check`)

### Configuration
- [ ] Production environment variables set
- [ ] API base URL configured correctly
- [ ] Supabase credentials configured
- [ ] CORS configured on backend
- [ ] Backend API accessible from frontend domain

### Build
- [ ] Production build successful (`npm run build`)
- [ ] Build output reviewed (check `dist/` folder)
- [ ] Bundle sizes acceptable (< 1MB total)
- [ ] Source maps generated
- [ ] Assets optimized

### Testing
- [ ] Tested on Chrome (latest)
- [ ] Tested on Firefox (latest)
- [ ] Tested on Safari (latest)
- [ ] Tested on Edge (latest)
- [ ] Tested on mobile (iOS Safari)
- [ ] Tested on mobile (Chrome Android)
- [ ] Tested at 320px width (mobile)
- [ ] Tested at 768px width (tablet)
- [ ] Tested at 1920px width (desktop)
- [ ] Touch interactions work on mobile
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility verified

### Performance
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] No console errors in production
- [ ] No console warnings in production

### Security
- [ ] HTTPS enabled
- [ ] Environment variables not in source code
- [ ] No sensitive data in client code
- [ ] Content Security Policy configured
- [ ] CORS properly configured
- [ ] Authentication working correctly

### Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Session persistence works
- [ ] Template upload works
- [ ] Template deletion works
- [ ] Photo upload works
- [ ] Render generation works
- [ ] Image download works
- [ ] Error messages display correctly
- [ ] Loading states display correctly
- [ ] Navigation works (all routes)
- [ ] Logout works
- [ ] Form validation works

## Deployment

### Platform Setup
- [ ] Deployment platform selected
- [ ] Account created and configured
- [ ] Domain configured (if applicable)
- [ ] SSL certificate configured
- [ ] Environment variables set in platform

### Server Configuration
- [ ] SPA routing configured (serve index.html for all routes)
- [ ] Gzip/Brotli compression enabled
- [ ] Cache headers configured
- [ ] Security headers configured
- [ ] 404 handling configured

### Monitoring
- [ ] Error tracking configured (e.g., Sentry)
- [ ] Analytics configured (e.g., Google Analytics)
- [ ] Uptime monitoring configured
- [ ] Performance monitoring configured

## Post-Deployment

### Verification
- [ ] Production site loads correctly
- [ ] All routes accessible
- [ ] API calls working
- [ ] Authentication working
- [ ] File uploads working
- [ ] No console errors
- [ ] Performance acceptable

### Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Rollback procedure documented
- [ ] Support contacts documented

### Backup
- [ ] Source code backed up (Git)
- [ ] Environment variables backed up
- [ ] Deployment configuration backed up

## Maintenance

### Regular Tasks
- [ ] Monitor error rates
- [ ] Monitor performance metrics
- [ ] Review user feedback
- [ ] Update dependencies monthly
- [ ] Review security advisories
- [ ] Test backup/restore procedures

### Incident Response
- [ ] Incident response plan documented
- [ ] Rollback procedure tested
- [ ] Support escalation path defined
- [ ] Communication plan defined

---

**Last Review Date**: _____________
**Reviewed By**: _____________
**Deployment Date**: _____________
**Deployed By**: _____________
