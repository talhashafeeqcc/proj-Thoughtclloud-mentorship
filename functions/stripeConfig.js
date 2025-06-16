import Stripe from "stripe";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

// Validate that the secret key exists
if (!stripeSecretKey) {
  console.error("❌ Stripe secret key not found in environment variables");
  console.error("Please set STRIPE_SECRET_KEY in your Netlify environment variables");
  throw new Error("Stripe secret key is required");
}

// Log that Stripe is being initialized (without exposing the key)
console.log("✅ Initializing Stripe with secret key:", stripeSecretKey.substring(0, 12) + "...");

// Initialize Stripe with your secret key
const stripe = new Stripe(stripeSecretKey);

export default stripe;
