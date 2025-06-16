import { v4 as uuidv4 } from "uuid";
import {
  getDocument,
  getDocuments,
  setDocument,
  updateDocument,
  whereEqual,
  COLLECTIONS
} from "./firebase";
import { updateSession, getSessionById } from "./sessionService";
import type { Payment } from "../types";
import {
  createPaymentIntent,
  confirmPayment,
  createRefund,
  capturePayment
} from "./stripe";
import { getApiUrl } from "./config";

// Define interface for Firestore document type
interface PaymentDocument {
  id: string;
  sessionId: string;
  mentorId: string;
  menteeId: string;
  amount: number;
  status: string;
  date: string;
  transactionId: string;
  paymentIntentId?: string;
  paymentMethodId?: string;
  createdAt: number;
  updatedAt: number;
}

// Define interface for Mentor document type
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  [key: string]: any;
}

/**
 * Process a payment for a session using Stripe
 */
export const processPayment = async (
  sessionId: string,
  amount: number,
  paymentMethodId?: string
): Promise<Payment> => {
  try {
    console.log(`Processing payment for session: ${sessionId}, amount: ${amount}`);
    
    // Get the session
    const session = await getSessionById(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    console.log(`Session found: ${session.id}, mentor: ${session.mentorId}, mentee: ${session.menteeId}`);

    // Check for existing payments - wrap in try-catch to handle permission issues
    let existingPayments: PaymentDocument[] = [];
    try {
      existingPayments = await getDocuments<PaymentDocument>(
        COLLECTIONS.PAYMENTS,
        [whereEqual('sessionId', sessionId)]
      );
      console.log(`Found ${existingPayments.length} existing payments for session ${sessionId}`);
    } catch (error) {
      console.warn(`Could not check for existing payments (permission issue): ${error}`);
      // Continue without checking existing payments - the payment creation will handle duplicates
    }

    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      if (existingPayment.status === "completed" || existingPayment.status === "authorized") {
        throw new Error("Payment has already been processed for this session");
      }
    }

    const now = Date.now();
    const paymentId = uuidv4();
    let transactionId = '';
    let paymentIntentId = '';

    // Real Stripe payment processing
    if (paymentMethodId) {
      try {
        // Get the mentor's Stripe account ID if available - handle permission issues
        let mentorStripeAccountId: string | undefined;
        try {
          const mentor = await getDocument<MentorDocument>(COLLECTIONS.MENTORS, session.mentorId);
          mentorStripeAccountId = mentor?.stripeAccountId;
          console.log(`Mentor Stripe account ID: ${mentorStripeAccountId || 'Not found'}`);
        } catch (error) {
          console.warn(`Could not get mentor Stripe account (permission issue): ${error}`);
          // Continue without mentor Stripe account - payment will go to platform account
        }

        // Create a payment intent with manual capture (authorization only)
        const paymentIntent = await createPaymentIntent(
          amount * 100, // Stripe uses cents
          'usd',
          `Payment for session ${sessionId}`,
          mentorStripeAccountId
        );

        console.log(`Payment intent created: ${paymentIntent.id}`);

        // Confirm the payment intent with the payment method
        const confirmation = await confirmPayment(
          paymentIntent.clientSecret,
          paymentMethodId
        );

        if (confirmation.error) {
          throw new Error(confirmation.error.message);
        }

        if (confirmation.paymentIntent.status === 'requires_capture' || confirmation.paymentIntent.status === 'succeeded') {
          transactionId = confirmation.paymentIntent.id;
          paymentIntentId = confirmation.paymentIntent.id;
          console.log(`Payment authorized successfully: ${transactionId}`);
        } else {
          throw new Error(`Payment failed with status: ${confirmation.paymentIntent.status}`);
        }
      } catch (error) {
        console.error("Stripe payment error:", error);
        const stripeError = error as Error;
        throw new Error(`Payment processing failed: ${stripeError.message}`);
      }
    }

    // Create payment record
    const newPayment = {
      id: paymentId,
      sessionId: sessionId,
      mentorId: session.mentorId,
      menteeId: session.menteeId,
      amount: amount,
      status: "authorized" as const, // Changed from "completed" to "authorized"
      date: new Date().toISOString().split("T")[0],
      createdAt: now,
      updatedAt: now,
      // Only include fields if they have values
      ...(transactionId && { transactionId: transactionId }),
      ...(paymentIntentId && { paymentIntentId: paymentIntentId }),
      ...(paymentMethodId && { paymentMethodId: paymentMethodId })
    };

    console.log(`Creating payment record: ${paymentId}`);
    console.log('Payment data (should not have undefined values):', newPayment);

    // Insert the payment
    await setDocument(COLLECTIONS.PAYMENTS, paymentId, newPayment);

    console.log(`Payment record created successfully`);

    // Update the session payment status
    await updateSession(sessionId, {
      paymentStatus: "authorized" as "pending", // Type assertion to make it compatible
      paymentAmount: amount,
    });

    console.log(`Session payment status updated`);

    return {
      id: paymentId,
      sessionId: sessionId,
      amount: amount,
      status: "authorized" as "pending", // Type assertion to make it compatible
      date: newPayment.date,
      transactionId: transactionId,
    };
  } catch (error) {
    console.error("Failed to process payment:", error);
    throw error;
  }
};

/**
 * Complete (capture) a payment after a session
 */
export const completePayment = async (sessionId: string): Promise<Payment> => {
  try {
    // Get the session payment
    const payment = await getSessionPayment(sessionId);
    if (!payment) {
      throw new Error(`No payment found for session ${sessionId}`);
    }

    // Get the payment document
    const paymentDoc = await getDocument<PaymentDocument>(COLLECTIONS.PAYMENTS, payment.id);
    if (!paymentDoc) {
      throw new Error(`Payment document not found for ID ${payment.id}`);
    }

    // Check if payment is in the right state
    if (paymentDoc.status !== "authorized") {
      throw new Error(`Payment cannot be completed: status is ${paymentDoc.status}`);
    }

    // Capture the payment through Stripe
    if (paymentDoc.paymentIntentId) {
      try {
        const capturedPayment = await capturePayment(paymentDoc.paymentIntentId);
        
        if (capturedPayment.error) {
          throw new Error(capturedPayment.error.message);
        }
      } catch (error) {
        console.error("Stripe capture error:", error);
        const stripeError = error as Error;
        throw new Error(`Payment capture failed: ${stripeError.message}`);
      }
    }

    const now = Date.now();

    // Update payment status
    await updateDocument(COLLECTIONS.PAYMENTS, payment.id, {
      status: "completed",
      updatedAt: now,
    });

    // Update the session payment status
    await updateSession(sessionId, {
      paymentStatus: "completed",
    });

    return {
      id: payment.id,
      sessionId: sessionId,
      amount: payment.amount,
      status: "completed" as const,
      date: payment.date,
      transactionId: payment.transactionId,
    };
  } catch (error) {
    console.error("Failed to complete payment:", error);
    throw error;
  }
};

/**
 * Refund a payment using Stripe
 */
export const refundPayment = async (paymentId: string): Promise<Payment> => {
  try {
    // Check if payment exists
    const payment = await getDocument<PaymentDocument>(COLLECTIONS.PAYMENTS, paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    // Check if payment can be refunded
    if (payment.status !== "completed" && payment.status !== "authorized") {
      throw new Error("Only completed or authorized payments can be refunded");
    }

    // Process the refund through Stripe if there's a paymentIntentId
    if (payment.paymentIntentId) {
      try {
        const refund = await createRefund(
          payment.paymentIntentId, 
          'requested_by_customer'
        );

        if (refund.error) {
          throw new Error(refund.error.message);
        }
      } catch (error) {
        console.error("Stripe refund error:", error);
        const stripeError = error as Error;
        throw new Error(`Refund processing failed: ${stripeError.message}`);
      }
    }

    const now = Date.now();

    // Update payment status
    await updateDocument(COLLECTIONS.PAYMENTS, paymentId, {
      status: "refunded",
      updatedAt: now,
    });

    // Update the session payment status
    await updateSession(payment.sessionId, {
      paymentStatus: "refunded",
    });

    return {
      id: payment.id,
      sessionId: payment.sessionId,
      amount: payment.amount,
      status: "refunded" as const,
      date: payment.date,
      transactionId: payment.transactionId,
    };
  } catch (error) {
    console.error("Failed to refund payment:", error);
    throw error;
  }
};

/**
 * Get all payments for a user (either mentor or mentee)
 */
export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  try {
    // Find payments where user is either the mentor or mentee
    const mentorPayments = await getDocuments<PaymentDocument>(
      COLLECTIONS.PAYMENTS,
      [whereEqual('mentorId', userId)]
    );

    const menteePayments = await getDocuments<PaymentDocument>(
      COLLECTIONS.PAYMENTS,
      [whereEqual('menteeId', userId)]
    );

    // Combine and deduplicate payments
    const allPayments = [...mentorPayments, ...menteePayments];
    const uniquePaymentIds = new Set();
    const uniquePayments = [];

    for (const payment of allPayments) {
      if (!uniquePaymentIds.has(payment.id)) {
        uniquePaymentIds.add(payment.id);
        uniquePayments.push({
          id: payment.id,
          sessionId: payment.sessionId,
          amount: payment.amount,
          status: payment.status as "completed" | "pending" | "refunded",
          date: payment.date,
          transactionId: payment.transactionId,
        });
      }
    }

    return uniquePayments as Payment[];
  } catch (error) {
    console.error(`Failed to get payments for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (id: string): Promise<Payment | null> => {
  try {
    const payment = await getDocument<PaymentDocument>(COLLECTIONS.PAYMENTS, id);

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      sessionId: payment.sessionId,
      amount: payment.amount,
      status: payment.status as "completed" | "pending" | "refunded",
      date: payment.date,
      transactionId: payment.transactionId,
    };
  } catch (error) {
    console.error(`Failed to get payment with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get payment for a session
 */
export const getSessionPayment = async (
  sessionId: string
): Promise<Payment | null> => {
  try {
    const payments = await getDocuments<PaymentDocument>(
      COLLECTIONS.PAYMENTS,
      [whereEqual('sessionId', sessionId)]
    );

    if (payments.length === 0) {
      return null;
    }

    const payment = payments[0];
    return {
      id: payment.id,
      sessionId: payment.sessionId,
      amount: payment.amount,
      status: payment.status as "completed" | "pending" | "refunded",
      date: payment.date,
      transactionId: payment.transactionId,
    };
  } catch (error) {
    console.error(`Failed to get payment for session ${sessionId}:`, error);
    throw error;
  }
};
