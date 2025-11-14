# Lokolo Platform Backend

Backend API for the Lokolo platform - connecting consumers with Black-owned businesses in Southern Africa.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15 with PostGIS (Cloud SQL)
- **Authentication**: Firebase Authentication
- **Storage**: Google Cloud Storage
- **Deployment**: Cloud Run (africa-south1)

## Prerequisites

- Node.js 18+
- PostgreSQL 15 with PostGIS
- Firebase project with Authentication enabled
- Google Cloud project

## Setup

1. **Install dependencies**
```bash
   npm install
```

2. **Configure environment**
```bash
   cp .env.example .env
   # Edit .env with your configuration
```

3. **Get Firebase service account key**
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Save as `firebase-service-account.json` in backend root

4. **Run database migrations**
```bash
   npm run migrate
```

5. **Start development server**
```bash
   npm run dev
```

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run migrate` - Run database migrations

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /` - API information

### API v1
- Coming soon...

## Database Schema

Schema version: 1.11

See `migrations/` folder for complete schema.

## Environment Variables

See `.env.example` for all required variables.

## Deployment

Deploy to Cloud Run:
```bash
gcloud run deploy lokolo-api \
  --source . \
  --region africa-south1 \
  --platform managed \
  --allow-unauthenticated
```

## License

Proprietary
