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

// Set up allowed origins
const allowedOrigins = [
  'https://thoughtcloud-mentorship.netlify.app',
  'https://devserver-main--thoughtcloud-mentorship.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Debug middleware to log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// CORS middleware with improved configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  console.log(`Processing CORS for origin: ${origin}`);
  
  // Check if origin is allowed or allow all origins in development
  if (!isProduction || (origin && allowedOrigins.includes(origin))) {
    // In development, use less restrictive CORS settings
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    console.log(`CORS headers set for origin: ${origin || '*'}`);
  } else {
    console.log(`CORS not allowed for origin: ${origin}`);
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request');
    return res.status(200).end();
  }
  
  next();
});

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
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
});

export default app; 