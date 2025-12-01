# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Create a `.env.local` file in the root directory with the following:

```env
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

## 3. Get Strava API Credentials

1. Visit https://www.strava.com/settings/api
2. Click "Create App"
3. Fill in:
   - **Application Name**: Strava Dashboard
   - **Category**: Website
   - **Website**: http://localhost:3000
   - **Authorization Callback Domain**: localhost
4. Copy your **Client ID** and **Client Secret** to `.env.local`

## 4. Run the Development Server

```bash
npm run dev
```

## 5. Open in Browser

Navigate to http://localhost:3000 and click "Connect with Strava"

That's it! 🎉

