import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
import type { RequestHandler } from 'express';

// Load environment variables
dotenv.config();

// Import API handlers
import { createPaymentIntentHandler } from './api/createPaymentIntent.js';
import { capturePaymentHandler } from './api/capturePayment.js';
import { createRefundHandler } from './api/createRefund.js';
import { getMentorBalanceHandler } from './api/getMentorBalance.js';
import { createConnectAccountHandler } from './api/createConnectAccount.js';
import { handleStripeWebhook } from './api/stripeWebhook.js';
import { createMentorStripeAccountHandler } from './api/createMentorStripeAccount.js';
import { createMentorPayoutHandler } from './api/createMentorPayout.js';
// Import server-side Firebase configuration
// import { db, firebaseApp } from './firebase.js';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://thoughtcloud-mentorship.netlify.app',
      'https://devserver-main--thoughtcloud-mentorship.netlify.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Enable CORS preflight for all routes
app.options('*', cors(corsOptions));

// Special parsing for Stripe webhooks (raw body)
app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));

// Regular body parsing for other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to sanitize URLs in route parameters
app.use((req, res, next) => {
  // Fix for path-to-regexp issues with URLs in route parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      const param = req.params[key];
      // Check if the parameter looks like a URL
      if (typeof param === 'string' && (param.startsWith('http://') || param.startsWith('https://'))) {
        // Encode the URL to prevent path-to-regexp from trying to parse it
        req.params[key] = encodeURIComponent(param);
      }
    });
  }
  next();
});

// API Routes - use type assertion for handlers
app.post('/api/create-payment-intent', createPaymentIntentHandler as RequestHandler);
app.post('/api/capture-payment', capturePaymentHandler as RequestHandler);
app.post('/api/create-refund', createRefundHandler as RequestHandler);
app.get('/api/mentor-balance/:mentorId', getMentorBalanceHandler as RequestHandler);
app.post('/api/create-connect-account', createConnectAccountHandler as RequestHandler);
app.post('/api/webhook', handleStripeWebhook as RequestHandler);

// New mentor Stripe endpoints
app.post('/api/mentor-stripe-account/:mentorId', createMentorStripeAccountHandler as RequestHandler);
app.post('/api/mentor-payout/:mentorId', createMentorPayoutHandler as RequestHandler);

// In production, serve the static frontend files
if (isProduction) {
  // Serve static files from the Vite build output directory
  const distPath = path.resolve(__dirname, '../../');
  console.log(`Serving static files from: ${distPath}`);
  
  app.use(express.static(distPath));
  
  // For any other request, send index.html (for SPA routing)
  app.get('*', ((req, res) => {
    // Skip API routes
    if (req.url.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    res.sendFile(path.resolve(distPath, 'index.html'));
  }) as RequestHandler);
}

// Start server
app.listen(port, () => {
  console.log(`Server running in ${isProduction ? 'production' : 'development'} mode on port ${port}`);
});

export default app; 