import Stripe from 'stripe';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Load Stripe secret key from environment variable
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY ||
    'sk_test_51RC0FLCGFrJ9I9yocH6DdLtuPj3MC8qfc8lMrKWP235vLcfXlnPQwA9GCtvRfA3eDa7GvCfaEySRReNh1dagKNSI00fksH3mYe';
// Initialize Stripe
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-03-31.basil' // Latest stable API version
});
// Log the API version (using the config object)
console.log(`Stripe initialized with API version: 2025-03-31.basil`);
export default stripe;
