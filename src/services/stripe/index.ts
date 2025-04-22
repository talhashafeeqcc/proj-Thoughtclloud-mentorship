import { getStripe } from './config';
import {
    updateDocument,
    COLLECTIONS
} from '../firebase';
import { API_BASE_URL } from '../config';

// Check if we're in a development environment
// const isDevelopment = import.meta.env.DEV ||
//     window.location.hostname === 'localhost' ||
//     window.location.hostname === '127.0.0.1';

// Process payment with Stripe
export const createPaymentIntent = async (
    amount: number,
    currency: string = 'usd',
    description: string,
    mentorStripeAccountId?: string
) => {
    try {
        // Send request to our backend API
        const response = await fetch(`${API_BASE_URL}/api/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount,
                currency,
                description,
                mentorStripeAccountId
            }),
            credentials: 'include',
            mode: 'cors',
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
        
        // Use Stripe.js to confirm the payment intent
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
        
        // Use Stripe.js to retrieve the payment intent
        return await stripe.retrievePaymentIntent(clientSecret);
    } catch (error) {
        console.error('Error retrieving payment intent:', error);
        throw error;
    }
};

// Capture payment after session is complete
export const capturePayment = async (paymentIntentId: string) => {
    try {
        // Send request to our backend API
        const response = await fetch(`${API_BASE_URL}/api/capture-payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId
            }),
            credentials: 'include',
            mode: 'cors',
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error('Error capturing payment:', error);
        throw error;
    }
};

// Process a refund
export const createRefund = async (paymentIntentId: string, reason?: string) => {
    try {
        // Send request to our backend API
        const response = await fetch(`${API_BASE_URL}/api/create-refund`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                paymentIntentId,
                reason
            }),
            credentials: 'include',
            mode: 'cors',
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
        // Send request to our backend API
        const response = await fetch(`${API_BASE_URL}/api/mentor-balance/${mentorId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            mode: 'cors',
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
        // Send request to our backend API
        const response = await fetch(`${API_BASE_URL}/api/create-connect-account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mentorId,
                email,
                country
            }),
            credentials: 'include',
            mode: 'cors',
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