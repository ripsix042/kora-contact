# Kora Contacts Hub - Backend API

Backend API for Kora Contacts Hub - A centralized contact and device management platform with CardDAV and Mosyle MDM integration.

## Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- MongoDB Atlas account
- Redis (for BullMQ - optional for initial setup)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd koracontacthub

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your MongoDB connection string and other values

# Start development server
npm run dev
```

Server will run on `http://localhost:8085`

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run prod` - Run production server locally (uses .env.production)
- `npm run prod:watch` - Run production server with auto-reload
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## Environment Setup

### Development/Staging
- Copy `.env.example` to `.env`
- Update `MONGODB_URI` with staging database connection string
- Generate JWT secrets

### Production
- See `.env.production.example` for production configuration
- Set environment variables in Render dashboard
- Use production MongoDB connection string

## Database Configuration

### Staging
- Cluster: `koracontactstaging.9jtkgbf.mongodb.net`
- Database: `koracontacthub_staging`
- User: `contactsstaging`

### Production
- Cluster: `koracontacthubprod.k4qngme.mongodb.net`
- Database: `koracontacthub`
- User: `Koracontacthubprod`

## API Endpoints

- `GET /health` - Health check
- `GET /api` - API information

More endpoints to be implemented according to BACKEND_TRD.md

## Project Structure

```
koracontacthub/
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── package.json        # Dependencies
├── .env.example        # Environment template
├── models/             # Mongoose models (to be created)
├── routes/             # API routes (to be created)
├── controllers/        # Route controllers (to be created)
├── services/           # Business logic (to be created)
├── middleware/         # Custom middleware (to be created)
└── utils/              # Utility functions (to be created)
```

## Deployment

See `HANDOVER_GUIDE.md` for detailed deployment instructions to Render.

## Documentation

- `BACKEND_TRD.md` - Technical Requirements Document (if available)
- `HANDOVER_GUIDE.md` - Setup and deployment guide

## License

ISC
