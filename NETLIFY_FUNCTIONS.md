# Netlify Functions for Payment Processing

This project uses Netlify Functions to handle payment processing with Stripe. The functions are serverless and run on Netlify's infrastructure, which helps separate the payment processing from the main application server.

## Available Functions

The following Netlify Functions are available for payment processing:

- `create-payment-intent`: Creates a Stripe payment intent with manual capture
- `capture-payment`: Captures an authorized payment
- `create-refund`: Processes refunds for payments
- `mentor-balance`: Gets a mentor's Stripe balance
- `create-connect-account`: Creates a Stripe Connect account for mentors
- `webhook`: Handles Stripe webhook events
- `mentor-payout`: Creates payouts for mentors

## Local Development

To run and test the functions locally:

1. Make sure you have the Netlify CLI installed:

   ```
   npm install -g netlify-cli
   ```

2. Run the Netlify dev server:

   ```
   npm run netlify:dev
   ```

3. Test the functions using the test script:
   ```
   npm run netlify:test
   ```

## Function URLs

When deployed, the functions will be available at the following URLs:

- `/.netlify/functions/create-payment-intent`
- `/.netlify/functions/capture-payment`
- `/.netlify/functions/create-refund`
- `/.netlify/functions/mentor-balance/:mentorId`
- `/.netlify/functions/create-connect-account`
- `/.netlify/functions/webhook`
- `/.netlify/functions/mentor-payout/:mentorId`

## API Endpoints

The API endpoints are mapped to the Netlify Functions using redirects in the `netlify.toml` file:

- `/api/create-payment-intent` → `/.netlify/functions/create-payment-intent`
- `/api/capture-payment` → `/.netlify/functions/capture-payment`
- `/api/create-refund` → `/.netlify/functions/create-refund`
- `/api/mentor-balance/:mentorId` → `/.netlify/functions/mentor-balance/:mentorId`
- `/api/create-connect-account` → `/.netlify/functions/create-connect-account`
- `/api/webhook` → `/.netlify/functions/webhook`
- `/api/mentor-payout/:mentorId` → `/.netlify/functions/mentor-payout/:mentorId`

## Environment Variables

The following environment variables are required for the functions to work:

- `VITE_STRIPE_SECRET_KEY`: Your Stripe secret key
- `VITE_STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret
- `VITE_APP_URL`: The URL of your application (for redirect URLs)

You can set these in your Netlify dashboard or in a `.env` file for local development.

## Deployment

To deploy the functions to Netlify:

1. Make sure your Netlify CLI is configured and authorized:

   ```
   netlify login
   ```

2. Deploy to Netlify:
   ```
   npm run netlify:deploy
   ```

## Webhooks

To test webhooks locally, you can use the Stripe CLI:

1. Install the Stripe CLI: [Stripe CLI Installation](https://stripe.com/docs/stripe-cli)

2. Login to Stripe:

   ```
   stripe login
   ```

3. Forward webhook events to your local server:

   ```
   stripe listen --forward-to http://localhost:8888/.netlify/functions/webhook
   ```

4. In another terminal, trigger webhook events:
   ```
   stripe trigger payment_intent.succeeded
   ```
