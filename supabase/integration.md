# Supabase Integration for Vercel

## Integration Overview

This guide covers integrating Supabase with Vercel for the Gesclic medical platform.

## Vercel Integration Setup

### 1. Install Supabase Vercel Integration

1. Go to your Vercel project dashboard
2. Navigate to **Integrations**
3. Search for "Supabase"
4. Click "Add Integration"

### 2. Configure Integration

When prompted, provide:

- **Supabase Organization**: Your Supabase organization name
- **Supabase Project**: Select your Gesclic project
- **Environment Variables**: Auto-mapped to Vercel

The integration automatically creates these environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Manual Environment Variable Setup

If not using the Vercel integration, manually add these in Vercel:

### Production Environment
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-ref
```

### Preview Environment
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-ref
```

### Development Environment
Use `.env.local` file locally (not committed to Git):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-ref
```

## Supabase Client Configuration

The Supabase client is configured in `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Database Schema

### Core Tables

- `clinics` - Clinic/medical practice information
- `profiles` - User profiles and roles
- `patients` - Patient records
- `appointments` - Appointment scheduling
- `medical_records` - Patient medical history
- `prescriptions` - Medication prescriptions
- `payments` - Payment transactions
- `pharmacy_inventory` - Pharmacy stock management
- `laboratory_results` - Lab test results

### Row Level Security (RLS)

Enable RLS for all tables to ensure data security:

```sql
-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables

-- Example policy for patients
CREATE POLICY "Clinics can view their patients"
ON patients FOR SELECT
USING (clinic_id IN (
  SELECT id FROM clinics 
  WHERE id = auth.uid()::text
));
```

## Edge Functions (Optional)

### Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy medical-ai
```

### Function Environment Variables

Set in Supabase dashboard under **Edge Functions > Settings**:

```
OPENAI_API_KEY=your-openai-key
VERCEL_URL=your-vercel-url
```

## Webhooks

### Vercel to Supabase Webhooks

Configure webhooks for real-time updates:

1. Go to Supabase **Database > Webhooks**
2. Create new webhook
3. Set URL to: `https://your-vercel-app.vercel.app/api/webhooks/supabase`
4. Select events: `INSERT`, `UPDATE`, `DELETE`
5. Add secret key for verification

## Backup Strategy

### Automated Backups

Supabase provides:
- Daily backups (retained 7 days)
- Point-in-time recovery (up to 7 days)
- Physical backups (retained 30 days)

### Manual Backup

```bash
# Backup database
supabase db dump -f backup.sql

# Restore database
supabase db reset
```

## Monitoring

### Supabase Dashboard

Monitor in Supabase dashboard:
- **Database**: Query performance, connections, storage
- **Auth**: User activity, sign-ups, sessions
- **API**: Request count, error rate, latency
- **Storage**: File usage, bandwidth

### Vercel Analytics

Track frontend performance:
- Core Web Vitals
- Page load times
- User engagement

## Security Best Practices

1. **Use Anon Key**: Never use service role key in client-side code
2. **Enable RLS**: Ensure all tables have Row Level Security
3. **Validate Inputs**: Use Zod schemas for all user inputs
4. **Rate Limiting**: Implement rate limiting on API endpoints
5. **HTTPS**: Vercel provides automatic SSL
6. **Environment Variables**: Never commit sensitive keys

## Troubleshooting

### Connection Issues

```typescript
// Test connection
const { data, error } = await supabase.from('clinics').select('*').limit(1)
if (error) console.error('Supabase connection error:', error)
```

### RLS Policy Issues

```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'patients';

-- Test policy as specific user
SET ROLE authenticated;
SELECT * FROM patients;
```

### Performance Issues

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Add indexes if needed
CREATE INDEX idx_patients_clinic_id ON patients(clinic_id);
```

## Scaling Considerations

### Database Scaling

- **Pro Tier**: Up to 8GB RAM, 8 CPU cores
- **Team Tier**: Up to 16GB RAM, 16 CPU cores
- **Enterprise**: Custom scaling options

### Connection Pooling

Use connection pooling for high-traffic applications:
- Supabase provides PgBouncer
- Configure in Supabase dashboard
- Update connection string to use pooler

## Cost Optimization

1. **Monitor Usage**: Track database size and API calls
2. **Optimize Queries**: Use indexes and efficient queries
3. **Cache Data**: Use React Query for client-side caching
4. **Storage**: Compress images and files
5. **Edge Functions**: Minimize execution time

## Support Resources

- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Vercel Integration: [vercel.com/integrations/supabase](https://vercel.com/integrations/supabase)
- Supabase Support: [supabase.com/support](https://supabase.com/support)
