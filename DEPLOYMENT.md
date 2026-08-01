# Gesclic - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **Supabase Project**: Set up a Supabase project at [supabase.com](https://supabase.com)
3. **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket

## Environment Variables

Configure these environment variables in your Vercel project settings:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project reference ID | `your-project-ref` |

### How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings > API**
3. Copy the following:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **Project reference** (from URL) → `VITE_SUPABASE_PROJECT_ID`

## Deployment Steps

### Option 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option 2: Vercel Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add environment variables in **Settings > Environment Variables**
5. Click **Deploy**

## Vercel Configuration

The `vercel.json` file includes:

- **Build optimization**: Production-ready build settings
- **Security headers**: XSS protection, frame options, content type sniffing
- **Caching strategy**: Long-term caching for static assets
- **SPA routing**: Client-side routing support via rewrites
- **Region deployment**: Optimized for US East (iad1)

## Supabase Integration

### Database Migrations

Deploy Supabase migrations:

```bash
# From your project root
supabase db push
```

### Edge Functions (Optional)

If using Supabase Edge Functions:

```bash
# Deploy edge functions
supabase functions deploy
```

## Build Optimizations

The Vite configuration includes:

- **Code splitting**: Vendor, UI, and chart chunks for better caching
- **Tree shaking**: Removes unused code
- **Minification**: Terser for production builds
- **Console removal**: Drops console.log in production
- **Source maps**: Enabled in development mode

## Performance Monitoring

### Vercel Analytics

Install Vercel Analytics for real-time performance data:

```bash
npm install @vercel/analytics
```

Add to `src/main.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

// In your App component
<Analytics />
```

### Speed Insights

Enable Speed Insights in Vercel dashboard for Core Web Vitals monitoring.

## Security Best Practices

1. **Environment Variables**: Never commit `.env` files
2. **API Keys**: Use Supabase anon key (not service role key) for client-side
3. **Row Level Security**: Enable RLS in Supabase for data protection
4. **HTTPS**: Vercel automatically provides SSL certificates
5. **Headers**: Security headers configured in `vercel.json`

## Troubleshooting

### Build Failures

```bash
# Clear Vercel cache
vercel build --force

# Check build logs in Vercel dashboard
```

### Environment Variables Not Loading

- Ensure variables start with `VITE_` for client-side access
- Verify variable names match exactly in `.env.example`
- Check Vercel project environment variable settings

### Supabase Connection Issues

- Verify Supabase URL format: `https://your-project.supabase.co`
- Check anon key is valid and not expired
- Ensure Supabase project is active and not paused

## Continuous Deployment

Vercel automatically deploys on:

- Push to main branch → Production
- Push to other branches → Preview deployments
- Pull requests → Preview deployments

Configure branch protection rules in your Git provider for production safety.

## Monitoring

- **Vercel Dashboard**: Real-time logs, analytics, and performance
- **Supabase Dashboard**: Database metrics, auth logs, and API usage
- **Error Tracking**: Consider integrating Sentry for error monitoring

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Supabase Documentation: [supabase.com/docs](https://supabase.com/docs)
- Vite Documentation: [vitejs.dev](https://vitejs.dev)
