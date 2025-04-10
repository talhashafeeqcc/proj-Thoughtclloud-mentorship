import { loadStripe } from '@stripe/stripe-js';

// Use the Stripe public key from environment variables
// For Vite applications, environment variables need to be prefixed with VITE_
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51RC0FLCGFrJ9I9yomIOZuAZybKrecjBRxOHP0l8pKToeRBaks4dGenWBIJkvusdIyvjdksplV8a7chst1KdmykdY006JFYs6ip';

// Log the key being used (only in development)
if (import.meta.env.DEV) {
    console.log('Using Stripe publishable key:', stripePublishableKey.substring(0, 8) + '...');
}

// Initialize Stripe
let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
    if (!stripePromise) {
        stripePromise = loadStripe(stripePublishableKey);
    }
    return stripePromise;
}; 