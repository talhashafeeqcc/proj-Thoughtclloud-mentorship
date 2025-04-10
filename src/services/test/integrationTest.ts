import {
    setDocument,
    getDocument,
    getDocuments,
    updateDocument,
    whereEqual,
    COLLECTIONS
} from '../firebase';

import {
    createPaymentIntent,
    confirmPayment,
    getMentorBalance
} from '../stripe';

/**
 * Test functions for Firebase and Stripe integration
 * These functions are for testing purposes only and should not be used in production
 */

// Check if we have Stripe environment variables set up
const hasStripeEnvVars = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Test Firebase connection and basic operations
export const testFirebaseConnection = async () => {
    console.log("Testing Firebase connection...");

    try {
        // Create a test document
        const testId = `test_${Date.now()}`;
        const testData = {
            id: testId,
            name: "Test User",
            email: "test@example.com",
            createdAt: Date.now()
        };

        // Set the document
        await setDocument(COLLECTIONS.USERS, testId, testData);
        console.log("✅ Successfully created test document");

        // Retrieve the document
        const retrievedData = await getDocument(COLLECTIONS.USERS, testId);
        console.log("✅ Successfully retrieved test document:", retrievedData);

        // Update the document
        await updateDocument(COLLECTIONS.USERS, testId, { updatedAt: Date.now() });
        console.log("✅ Successfully updated test document");

        // Query for the document
        const queryResults = await getDocuments(
            COLLECTIONS.USERS,
            [whereEqual('name', 'Test User')]
        );
        console.log("✅ Successfully queried for test documents. Found:", queryResults.length);

        // Clean up - delete the test document at the end of your testing
        // await deleteDocument(COLLECTIONS.USERS, testId);
        // console.log("✅ Successfully deleted test document");

        return true;
    } catch (error) {
        console.error("❌ Firebase test failed:", error);
        return false;
    }
};

// Test Stripe integration
export const testStripeIntegration = async () => {
    console.log("Testing Stripe integration...");
    console.log(`Using Stripe ${hasStripeEnvVars ? 'environment variables' : 'default test keys'}`);

    try {
        // Create a test payment intent
        const paymentIntent = await createPaymentIntent(
            1000, // $10.00
            'usd',
            'Test payment intent'
        );
        console.log("✅ Successfully created test payment intent:", paymentIntent);

        // Test payment confirmation (this is a mock in development)
        const confirmation = await confirmPayment(
            paymentIntent.clientSecret,
            'pm_test_123456789'
        );
        console.log("✅ Successfully confirmed test payment:", confirmation);

        // Test getting a mentor's balance
        const balance = await getMentorBalance('test_mentor_id');
        console.log("✅ Successfully retrieved test mentor balance:", balance);

        return true;
    } catch (error) {
        console.error("❌ Stripe test failed:", error);
        return false;
    }
};

// Run both tests
export const runIntegrationTests = async () => {
    console.log("Starting integration tests");
    console.log(`Environment: ${import.meta.env.DEV ? 'Development' : 'Production'}`);
    if (hasStripeEnvVars) {
        console.log("Using Stripe keys from environment variables");
    } else {
        console.log("Using fallback Stripe test keys");
    }

    const firebaseResult = await testFirebaseConnection();
    const stripeResult = await testStripeIntegration();

    return {
        firebase: firebaseResult,
        stripe: stripeResult,
        success: firebaseResult && stripeResult
    };
}; 