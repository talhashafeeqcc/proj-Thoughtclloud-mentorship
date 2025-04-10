import { getStripe } from './config';
import {
    updateDocument,
    COLLECTIONS
} from '../firebase';
import {
    mockCreatePaymentIntent,
    mockCreateRefund,
    mockGetMentorBalance,
    mockCreateConnectAccount
} from './api';

// Check if we're in a development environment
const isDevelopment = process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

// Process payment with Stripe
export const createPaymentIntent = async (
    amount: number,
    currency: string = 'usd',
    description: string
) => {
    try {
        if (isDevelopment) {
            // Use mock API in development
            return await mockCreatePaymentIntent(amount, currency, description);
        }

        // This would typically be a server-side call to create a payment intent
        const response = await fetch('/api/create-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount,
                currency,
                description
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating payment intent:', error);
        throw error;
    }
};

// Confirm a payment with Stripe Elements
export const confirmPayment = async (clientSecret: string, paymentMethodId: string) => {
    try {
        const stripe = await getStripe();

        if (isDevelopment) {
            // In development, simulate a successful payment confirmation
            // Check if clientSecret is defined before trying to split it
            if (!clientSecret) {
                console.log("Warning: clientSecret is undefined, using fallback ID");
                return {
                    paymentIntent: {
                        id: `pi_mock_${Math.random().toString(36).substring(2)}`,
                        status: 'succeeded',
                        amount: 0,
                        currency: 'usd'
                    }
                };
            }

            return {
                paymentIntent: {
                    id: clientSecret.split('_secret_')[0],
                    status: 'succeeded',
                    amount: 0,
                    currency: 'usd'
                }
            };
        }

        return await stripe.confirmCardPayment(clientSecret, {
            payment_method: paymentMethodId
        });
    } catch (error) {
        console.error('Error confirming payment:', error);
        throw error;
    }
};

// Retrieve a payment intent status
export const retrievePaymentIntent = async (clientSecret: string) => {
    try {
        const stripe = await getStripe();

        if (isDevelopment) {
            // In development, simulate a successful payment intent
            // Check if clientSecret is defined before trying to split it
            if (!clientSecret) {
                console.log("Warning: clientSecret is undefined, using fallback ID");
                return {
                    paymentIntent: {
                        id: `pi_mock_${Math.random().toString(36).substring(2)}`,
                        status: 'succeeded',
                        amount: 0,
                        currency: 'usd'
                    }
                };
            }

            return {
                paymentIntent: {
                    id: clientSecret.split('_secret_')[0],
                    status: 'succeeded',
                    amount: 0,
                    currency: 'usd'
                }
            };
        }

        return await stripe.retrievePaymentIntent(clientSecret);
    } catch (error) {
        console.error('Error retrieving payment intent:', error);
        throw error;
    }
};

// Process a refund
export const createRefund = async (paymentIntentId: string) => {
    try {
        if (isDevelopment) {
            // Use mock API in development
            return await mockCreateRefund(paymentIntentId);
        }

        // This would be a server-side call
        const response = await fetch('/api/create-refund', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating refund:', error);
        throw error;
    }
};

// Get a mentor's Stripe balance
export const getMentorBalance = async (mentorId: string) => {
    try {
        if (isDevelopment) {
            // Use mock API in development
            return await mockGetMentorBalance(mentorId);
        }

        // In a real implementation, this would be a call to your backend
        // which would then call Stripe's API with the mentor's Stripe account ID
        const response = await fetch(`/api/mentor-balance/${mentorId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting mentor balance:', error);
        throw error;
    }
};

// Connect a mentor to Stripe (start onboarding process)
export const connectMentorToStripe = async (mentorId: string, email: string, country: string) => {
    try {
        if (isDevelopment) {
            // Use mock API in development
            const data = await mockCreateConnectAccount(mentorId, email, country);

            // Update the mentor's record with their Stripe account ID
            await updateDocument(COLLECTIONS.MENTORS, mentorId, {
                stripeAccountId: data.accountId
            });

            return data;
        }

        // This would be a server-side call to create a Stripe Connect account
        const response = await fetch('/api/create-connect-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mentorId,
                email,
                country
            }),
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        // Update the mentor's record with their Stripe account ID
        await updateDocument(COLLECTIONS.MENTORS, mentorId, {
            stripeAccountId: data.accountId
        });

        return data;
    } catch (error) {
        console.error('Error connecting mentor to Stripe:', error);
        throw error;
    }
}; 