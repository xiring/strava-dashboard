# Strava Dashboard

A beautiful, modern dashboard for viewing your Strava activities and statistics. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 **OAuth Authentication** - Secure login with Strava
- 📊 **Activity Statistics** - View your total distance, activities, and elevation gain
- 📈 **Activity Charts** - Visualize your recent activities with interactive charts
- 📋 **Activity List** - Browse your recent activities with detailed information
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- ⚡ **Fast & Efficient** - Built with Next.js 14 for optimal performance

## Prerequisites

- Node.js 18+ and npm/yarn
- A Strava account
- Strava API credentials (Client ID and Client Secret)

## Getting Started

### 1. Get Strava API Credentials

1. Go to [Strava API Settings](https://www.strava.com/settings/api)
2. Create a new application
3. Fill in the application details:
   - **Application Name**: Strava Dashboard (or any name you prefer)
   - **Category**: Website
   - **Website**: `http://localhost:3000` (for development)
   - **Authorization Callback Domain**: `localhost` (for development)
4. Save and note down your **Client ID** and **Client Secret**

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Strava credentials:

```env
STRAVA_CLIENT_ID=your_client_id_here
STRAVA_CLIENT_SECRET=your_client_secret_here
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/callback
```

**Important**: Make sure the redirect URI in your `.env.local` matches exactly what you configured in your Strava API settings.

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Connect Your Strava Account

1. Click the "Connect with Strava" button
2. Authorize the application in Strava
3. You'll be redirected back to the dashboard
4. Your activities and statistics will be displayed!

## Project Structure

```
strava/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── callback/    # OAuth callback handler
│   │   │   ├── login/       # Login redirect
│   │   │   └── logout/      # Logout handler
│   │   ├── activities/      # Activities API endpoints
│   │   │   └── [id]/        # Single activity API endpoint
│   │   └── athlete/         # Athlete data API endpoint
│   ├── activities/
│   │   └── [id]/            # Activity detail page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main dashboard page
├── components/
│   ├── ActivityChart.tsx    # Activity visualization chart
│   ├── ActivityList.tsx     # Activities list component
│   ├── ActivityMap.tsx      # OpenStreetMap route visualization
│   └── StatsCard.tsx        # Statistics card component
├── lib/
│   ├── strava.ts            # Strava API client
│   ├── auth.ts              # Authentication utilities
│   └── polyline.ts          # Polyline decoder for map routes
└── package.json
```

## Pages

- `/` - Main dashboard with overview statistics
- `/activities` - All activities page with filtering, sorting, pagination, and export
- `/activities/[id]` - Individual activity detail page with map and pace breakdown
- `/statistics` - Statistics & Analytics page with trends and breakdowns
- `/records` - Personal Records page showing your best performances
- `/summary` - Weekly/Monthly/Yearly activity summaries
- `/compare` - Compare up to 2 activities side-by-side
- `/goals` - Set and track fitness goals
- `/settings` - User preferences and data management

## API Endpoints

- `GET /api/auth/login` - Redirects to Strava OAuth
- `GET /api/auth/callback` - Handles OAuth callback
- `POST /api/auth/logout` - Logs out the user
- `GET /api/athlete` - Fetches athlete profile and stats
- `GET /api/activities` - Fetches activities list
- `GET /api/activities/[id]` - Fetches a single activity by ID

## Features in Detail

### Statistics Dashboard
- Total distance (all time)
- Total activities count
- Total elevation gain
- Recent activities count (last 4 weeks)

### Activity Chart
- Visualizes the last 7 activities
- Shows distance and elevation gain
- Interactive tooltips and legends

### Activity List
- Displays recent activities with:
  - Activity name and type
  - Date and time
  - Distance
  - Duration
  - Elevation gain (if available)
- Click on any activity to view detailed information

### Activity Detail Page
- Comprehensive activity information including:
  - **Interactive Route Map with Playback** - OpenStreetMap visualization with animated route playback
    - Play/Pause controls to animate the route
    - Speed controls (1x, 2x, 4x, 8x) for faster playback
    - Progress slider to jump to any point in the activity
    - Real-time display of elapsed time and distance during playback
    - Moving marker that follows the route
    - Highlighted route progress with faded full route
  - Full activity details (distance, time, elevation)
  - Performance metrics (speed, pace, cadence)
  - Heart rate data (if available)
  - Elevation profile (high/low points)
  - Social stats (kudos, comments, achievements)
  - Start and end markers on the map
  - Direct link to view on Strava

## Production Deployment

### Environment Variables

For production, update your environment variables:

```env
STRAVA_CLIENT_ID=your_production_client_id
STRAVA_CLIENT_SECRET=your_production_client_secret
STRAVA_REDIRECT_URI=https://yourdomain.com/api/auth/callback
NODE_ENV=production
```

### Strava API Settings

Update your Strava API application settings:
- **Website**: Your production URL
- **Authorization Callback Domain**: Your production domain (without http:// or https://)

### Deploy

You can deploy to platforms like:
- [Vercel](https://vercel.com) (recommended for Next.js)
- [Netlify](https://netlify.com)
- Any Node.js hosting platform

## Security Notes

- Access tokens are stored in HTTP-only cookies
- Tokens are automatically refreshed when expired
- Never commit your `.env.local` file to version control

## Troubleshooting

### "No access token available" error
- Make sure you've completed the OAuth flow
- Check that your redirect URI matches exactly
- Verify your environment variables are set correctly

### Activities not loading
- Check your Strava API rate limits
- Verify your access token hasn't expired
- Check the browser console for errors

### Rate Limit Exceeded Error
If you see a "Rate Limit Exceeded" error:
- **Strava API Limits**: 600 requests per 15 minutes, 30,000 per day
- Wait a few minutes before making more requests
- Reduce the number of activities loaded at once (use filters)
- The app will show a helpful message with retry time and usage information
- Rate limit errors are automatically detected and displayed with clear instructions

**Note**: The app includes intelligent caching to reduce API calls:
- Athlete data cached for 10 minutes
- Stats cached for 5 minutes
- Recent activities cached for 2 minutes
- Individual activities cached for 10 minutes

This reduces API calls by 80-90% for repeated views. See `RATE_LIMITS.md` for more optimization strategies.

### OAuth callback fails
- Ensure your redirect URI in Strava settings matches your `.env.local`
- Check that your Client ID and Secret are correct
- Verify the callback URL is accessible

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!

