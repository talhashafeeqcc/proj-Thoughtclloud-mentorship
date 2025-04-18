import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';
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
// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';
// Middleware
app.use(cors());
// Special parsing for Stripe webhooks (raw body)
app.use('/api/webhook', bodyParser.raw({ type: 'application/json' }));
// Regular body parsing for other routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// API Routes - use type assertion for handlers
app.post('/api/create-payment-intent', createPaymentIntentHandler);
app.post('/api/capture-payment', capturePaymentHandler);
app.post('/api/create-refund', createRefundHandler);
app.get('/api/mentor-balance/:mentorId', getMentorBalanceHandler);
app.post('/api/create-connect-account', createConnectAccountHandler);
app.post('/api/webhook', handleStripeWebhook);
// New mentor Stripe endpoints
app.post('/api/mentor-stripe-account/:mentorId', createMentorStripeAccountHandler);
app.post('/api/mentor-payout/:mentorId', createMentorPayoutHandler);
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
    }));
}
// Start server
app.listen(port, () => {
    console.log(`Server running in ${isProduction ? 'production' : 'development'} mode on port ${port}`);
});
export default app;
