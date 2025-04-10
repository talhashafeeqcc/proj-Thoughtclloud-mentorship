// This file contains mock implementations of API routes that would typically
// be implemented on the server side. In a real application, you would never
// expose your Stripe secret key in the frontend code.

// Get environment variables
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const isDevelopment = import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

/**
 * Mock API response for creating a payment intent
 */
export const mockCreatePaymentIntent = async (
    amount: number,
    currency: string,
    description: string
) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a random client secret using the first 8 chars of public key to look more realistic
    const prefix = stripePublicKey ? stripePublicKey.substring(0, 8) : 'pk_test_';
    const clientSecret = `pi_${Math.random().toString(36).substring(2)}_secret_${prefix}${Math.random().toString(36).substring(2)}`;

    return {
        clientSecret,
        id: clientSecret.split('_secret_')[0],
        amount,
        currency,
        status: 'requires_payment_method'
    };
};

/**
 * Mock API response for creating a refund
 */
export const mockCreateRefund = async (paymentIntentId: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
        id: `re_${Math.random().toString(36).substring(2)}`,
        payment_intent: paymentIntentId,
        amount: 0, // The real API would return the refunded amount
        status: 'succeeded',
        created: Date.now() / 1000
    };
};

/**
 * Mock API response for retrieving a mentor's balance
 */
export const mockGetMentorBalance = async (mentorId: string) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate random balance amounts for demonstration
    const available = Math.floor(Math.random() * 10000) + 5000; // Between $50-$150
    const pending = Math.floor(Math.random() * 5000) + 1000; // Between $10-$60

    return {
        available: [
            {
                amount: available,
                currency: 'usd',
                source_types: {
                    card: available
                }
            }
        ],
        pending: [
            {
                amount: pending,
                currency: 'usd',
                source_types: {
                    card: pending
                }
            }
        ],
        instant_available: [
            {
                amount: 0,
                currency: 'usd',
                source_types: {
                    card: 0
                }
            }
        ]
    };
};

/**
 * Mock API response for creating a Stripe Connect account
 */
export const mockCreateConnectAccount = async (
    mentorId: string,
    email: string,
    country: string
) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use the public key prefix to make it look more realistic
    const prefix = stripePublicKey ? stripePublicKey.substring(3, 11) : 'test_';

    return {
        accountId: `acct_${prefix}${Math.random().toString(36).substring(2)}`,
        status: 'pending',
        accountLink: `https://connect.stripe.com/setup/mock/${Math.random().toString(36).substring(2)}`
    };
}; 