# Vercel Environment Variables Setup Guide
**Project ID**: prj_RaaH9fNFH5JKJRjUzpKsSC3kaklm
**Project**: Gesclic Medical Platform

---

## Required Environment Variables

### Supabase Configuration

#### 1. VITE_SUPABASE_URL
- **Value**: `https://agjxgomgkzwdmkjapzhs.supabase.co`
- **Description**: Supabase project URL
- **Environment**: Production, Preview, Development

#### 2. VITE_SUPABASE_PUBLISHABLE_KEY
- **Value**: Get from Supabase Dashboard
- **Description**: Supabase publishable API key (anon key)
- **Environment**: Production, Preview, Development
- **How to get**:
  1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
  2. Select project: agjxgomgkzwdmkjapzhs
  3. Navigate to Settings > API
  4. Copy "Project URL" (already known)
  5. Copy "anon public" key

#### 3. VITE_SUPABASE_PROJECT_ID
- **Value**: `agjxgomgkzwdmkjapzhs`
- **Description**: Supabase project reference ID
- **Environment**: Production, Preview, Development

---

## Setup Instructions

### Method 1: Via Vercel Dashboard (Recommended)

1. **Access Vercel Dashboard**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select project: prj_RaaH9fNFH5JKJRjUzpKsSC3kaklm

2. **Navigate to Environment Variables**
   - Go to Settings > Environment Variables
   - Click "Add New"

3. **Add Variables for Each Environment**

   **For Production:**
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://agjxgomgkzwdmkjapzhs.supabase.co`
   - Environment: Production
   - Click Save

   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: `[your-supabase-anon-key]`
   - Environment: Production
   - Click Save

   - Name: `VITE_SUPABASE_PROJECT_ID`
   - Value: `agjxgomgkzwdmkjapzhs`
   - Environment: Production
   - Click Save

   **For Preview & Development:**
   - Repeat the same steps for Preview and Development environments
   - Use the same values (or different if you have staging Supabase projects)

4. **Redeploy**
   - After adding variables, go to Deployments
   - Click the three dots on the latest deployment
   - Select "Redeploy"

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL production
# Enter: https://agjxgomgkzwdmkjapzhs.supabase.co

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
# Enter: [your-supabase-anon-key]

vercel env add VITE_SUPABASE_PROJECT_ID production
# Enter: agjxgomgkzwdmkjapzhs

# Repeat for preview and development environments
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY preview
vercel env add VITE_SUPABASE_PROJECT_ID preview

vercel env add VITE_SUPABASE_URL development
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY development
vercel env add VITE_SUPABASE_PROJECT_ID development

# Redeploy
vercel --prod
```

---

## Verification

### Check Variables are Set

**Via Dashboard:**
1. Go to Settings > Environment Variables
2. Verify all three variables are listed
3. Check they have values for Production, Preview, Development

**Via CLI:**
```bash
vercel env ls
```

### Test Deployment

After setting variables:
1. Trigger a new deployment
2. Check deployment logs for any environment variable errors
3. Test the application in production

---

## Troubleshooting

### Issue: Variables not working in production

**Solution:**
- Ensure variables are set for the "Production" environment specifically
- Redeploy after adding variables
- Check deployment logs for missing variable warnings

### Issue: Supabase connection errors

**Solution:**
- Verify `VITE_SUPABASE_URL` is correct
- Verify `VITE_SUPABASE_PUBLISHABLE_KEY` is the anon key (not service role)
- Check Supabase project is active and accessible

### Issue: Build fails with missing variables

**Solution:**
- Ensure variables are set before deployment
- Check variable names match exactly (case-sensitive)
- Verify no typos in values

---

## Security Notes

- **Never commit** `.env` files with real values to Git
- **Use different keys** for production and development if possible
- **Rotate keys** periodically for security
- **Monitor usage** in Supabase dashboard
- **Restrict access** to keys in Vercel dashboard

---

## Additional Variables (Optional)

For future enhancements, you may need:

### LOVABLE_API_KEY (for Edge Function)
- **Value**: Get from Lovable AI platform
- **Description**: API key for medical AI assistant
- **Environment**: Production only (set in Supabase Edge Functions, not Vercel)

### Custom Domain
- If using custom domain, no additional variables needed
- Configure domain in Vercel Dashboard > Domains

---

## Quick Reference

| Variable | Value | Environment |
|----------|-------|-------------|
| VITE_SUPABASE_URL | https://agjxgomgkzwdmkjapzhs.supabase.co | All |
| VITE_SUPABASE_PUBLISHABLE_KEY | [get from Supabase Dashboard] | All |
| VITE_SUPABASE_PROJECT_ID | agjxgomgkzwdmkjapzhs | All |

---

## Next Steps

1. ✅ Get Supabase anon key from Dashboard
2. ✅ Add environment variables in Vercel
3. ✅ Redeploy application
4. ✅ Test production deployment
5. ⏳ Deploy Edge Function via Supabase Dashboard

---

**Last Updated**: July 4, 2026
**Vercel Project ID**: prj_RaaH9fNFH5JKJRjUzpKsSC3kaklm
