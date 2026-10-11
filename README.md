# IdeaVault – API Server

This is the Express.js REST API backend for the IdeaVault startup idea sharing platform. It handles authentication, idea management, and comment interactions.

## Tech Stack

- **Runtime:** Node.js with Express.js
- **Database:** MongoDB Atlas (via official Node.js driver)
- **Auth:** JSON Web Tokens (JWT)
- **Hosting:** Vercel (serverless) or Railway

## API Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/jwt` | Generate a signed JWT token |

### Ideas
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/ideas` | Public | Fetch ideas (supports `?search=` and `?category=`) |
| GET | `/ideas/trending` | Public | Fetch top 6 trending ideas |
| GET | `/ideas/user/:email` | Protected | Fetch ideas by a specific user |
| GET | `/ideas/:id` | Protected | Fetch a single idea's full details |
| POST | `/ideas` | Protected | Create a new startup idea |
| PUT | `/ideas/:id` | Protected | Update own idea |
| DELETE | `/ideas/:id` | Protected | Delete own idea (also removes its comments) |

### Comments
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/comments/:ideaId` | Public | Fetch all comments for an idea |
| POST | `/comments` | Protected | Add a new comment |
| PUT | `/comments/:id` | Protected | Edit own comment |
| DELETE | `/comments/:id` | Protected | Delete own comment |

### Interactions
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/interactions/:email` | Protected | Get all ideas a user has commented on |

## Project Architecture

```
ideavault-server/
├── config/
│   └── db.js                  # MongoDB connection setup and health checks
├── middleware/
│   ├── errorHandler.js        # Centralized error handling and ApiError class
│   ├── logger.js              # Request logging with response time tracking
│   └── securityHeaders.js     # HTTP security headers (XSS, MIME, clickjack)
├── utils/
│   ├── constants.js           # API status codes, error messages, config values
│   ├── shutdown.js            # Graceful shutdown for MongoDB disconnection
│   └── validators.js          # Input validation and sanitization helpers
├── index.js                   # Main server entry point with all route definitions
├── vercel.json                # Vercel serverless deployment configuration
├── .env.example               # Environment variable template
└── package.json               # Dependencies and scripts
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `DB_USER` | MongoDB Atlas username | Yes |
| `DB_PASS` | MongoDB Atlas password | Yes |
| `JWT_SECRET` | Secret key for signing JWT tokens | Yes |

## Getting Started

1. Clone the repository.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and fill in credentials.
4. Run `npm run dev` to start in development mode with nodemon.

## Deployment

This server is configured for deployment on **Vercel** as a serverless function. The `vercel.json` routes all incoming requests to `index.js`. Environment variables must be configured in the Vercel project dashboard under Settings → Environment Variables.
