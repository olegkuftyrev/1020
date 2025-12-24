# Netlify Deployment Guide

## Quick Deploy

1. **Connect to Netlify:**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository: `olegkuftyrev/1020`

2. **Build Settings:**
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist`

   OR use the `netlify.toml` file (already configured)

3. **Environment Variables:**
   - None required! The frontend works standalone with local PIN validation.

## Notes

- The frontend is configured to work without a backend (PIN validation is client-side)
- Default PIN: `123456`
- All routing is handled client-side (React Router not needed for current setup)
- The `_redirects` file ensures SPA routing works correctly

## Manual Deploy from Root

If deploying from the repository root:

```bash
# Netlify will use netlify.toml automatically
# Or configure in Netlify dashboard:
# Build command: cd frontend && npm install && npm run build
# Publish directory: frontend/dist
```

