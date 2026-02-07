# Awareness Engine Feature Flag

To enable the Awareness Engine Admin UI, add the following environment variable:

``

bash
NEXT_PUBLIC_FEATURE_AWARENESS_ENGINE_UI=true
```

## Local Development

1. Add to `.env.local`:
   ```
   NEXT_PUBLIC_FEATURE_AWARENESS_ENGINE_UI=true
   ```

2. Restart your development server

## Production

Add to Vercel environment variables:
```
NEXT_PUBLIC_FEATURE_AWARENESS_ENGINE_UI=true
```

When the feature flag is enabled:
- "Outreach" section appears in Platform Admin navigation  
- All outreach routes become accessible
- API client automatically falls back to mock data until backend is implemented
