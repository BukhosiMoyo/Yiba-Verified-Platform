# Environment Variable Setup

## Google Maps API Key

Add the following to your `.env` or `.env.local` file:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCqRBYeUCxVerw4OiEX9GKbWya66BWsgcE
```

**Note:** Make sure this file is in your `.gitignore` to avoid committing the API key to version control.

## Required Google Cloud Setup

1. Enable "Places API (New)" in Google Cloud Console
2. Restrict the API key to your domains (localhost for development, your production domain for production)
3. The API key is safe to expose in client-side code (it's prefixed with `NEXT_PUBLIC_`)
