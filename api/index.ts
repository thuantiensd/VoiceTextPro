import 'dotenv/config';
import express from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "../server/routes";
import { passport } from "../server/oauth.js";

const app = express();

// CORS configuration for production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://voicetextpro-new.vercel.app', 'https://*.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Express session for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'voicetextpro-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  name: 'vtp.session.id',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/'
  }
}));

// Passport OAuth setup
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register all routes
registerRoutes(app);

// Export for Vercel
export default app; 