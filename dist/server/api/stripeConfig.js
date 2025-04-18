import Stripe from 'stripe';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Load Stripe secret key from environment variable
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY ||
    'sk_test_51RC0FLCGFrJ9I9yocH6DdLtuPj3MC8qfc8lMrKWP235vLcfXlnPQwA9GCtvRfA3eDa7GvCfaEySRReNh1dagKNSI00fksH3mYe';
// Initialize Stripe
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' // Use the latest stable API version
});
console.log(`Stripe initialized with API version: ${stripe.getApiField('version')}`);
export default stripe;
