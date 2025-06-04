import Stripe from "stripe";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

export default stripe;
