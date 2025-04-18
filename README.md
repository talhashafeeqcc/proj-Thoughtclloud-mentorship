# Thoughtcloud Mentorship Platform

## Stripe Payment Flow Implementation

This platform uses Stripe's payment API for handling payments between mentees and mentors. The payment flow is implemented as follows:

### Payment Process Flow

1. **Booking & Authorization:** When a mentee books a session, the payment is authorized (but not captured) using Stripe's `manual` capture method. This reserves the funds on the mentee's card.

2. **Session Completion:** After the session is completed, the mentor marks it as completed in the dashboard, which triggers the payment capture, transferring funds to the mentor.

3. **Cancellation & Refunds:** If a session is cancelled, the payment is either:
   - Cancelled (if not yet captured)
   - Refunded (if already captured)

### Implementation Details

- Server-side API routes handle Stripe interactions securely
- Payment status is tracked in the database
- Webhooks handle asynchronous Stripe events
- Mentors can view their balance and pending payouts

### Environment Setup

Create an `.env` file based on the `.env.example` template and fill in your Stripe API keys:

```
# Stripe API Keys
VITE_STRIPE_PUBLIC_KEY=pk_test_your_public_key
VITE_STRIPE_SECRET_KEY=sk_test_your_secret_key
VITE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Development

To run the application with both frontend and backend servers in development mode:

```bash
npm run dev
```

This starts both the Vite dev server for the React frontend and the Express server for the Stripe API.

### Stripe Webhook Setup

For local testing with Stripe webhooks, install the Stripe CLI and run:

```bash
stripe listen --forward-to http://localhost:3001/api/webhook
```

This will provide a webhook secret that should be added to your `.env` file.

### Production Deployment

1. **Build for production:**

   ```bash
   # On Unix/Linux/Mac
   ./deploy.sh
   
   # On Windows
   deploy.bat
   ```

2. **Manual build steps:**

   ```bash
   # Build frontend
   npm run build
   
   # Build server
   npm run build:server
   
   # Start the production server
   npm run start
   ```

3. **Environment variables for production:**

   Make sure to update the `.env` file with production values before starting the server.

### Testing

The implementation uses Stripe Test Mode with test API keys. The Stripe CLI is connected to the Code Clever sandbox (Account ID: acct_1RC0FeCHpB0cQxLd).

For testing the payment flow:
- Use test card number: 4242 4242 4242 4242
- Any future expiry date
- Any 3-digit CVC
- Any postal code