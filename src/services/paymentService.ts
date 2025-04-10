import { v4 as uuidv4 } from "uuid";
import {
  getDocument,
  getDocuments,
  setDocument,
  updateDocument,
  whereEqual,
  COLLECTIONS
} from "./firebase";
import { updateSession } from "./sessionService";
import type { Payment } from "../types";
import {
  createPaymentIntent,
  confirmPayment,
  createRefund
} from "./stripe";

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

/**
 * Process a payment for a session using Stripe
 */
export const processPayment = async (
  sessionId: string,
  amount: number,
  paymentMethodId?: string
): Promise<Payment> => {
  try {
    // Special handling for temporary session IDs
    if (sessionId === 'temp-session-id') {
      console.log('Processing payment for temporary session');

      // Create a simulated payment for demonstration
      const paymentId = uuidv4();
      const transactionId = `tx_${Math.random().toString(36).substring(2, 15)}`;

      return {
        id: paymentId,
        sessionId: sessionId,
        amount: amount,
        status: "completed" as const,
        date: new Date().toISOString().split("T")[0],
        transactionId: transactionId,
      };
    }

    // Check if session exists
    const session = await getDocument(COLLECTIONS.SESSIONS, sessionId);
    if (!session) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    // Check if payment has already been processed
    const existingPayments = await getDocuments(
      COLLECTIONS.PAYMENTS,
      [whereEqual('sessionId', sessionId)]
    );

    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0];
      if (existingPayment.status === "completed") {
        throw new Error("Payment has already been processed for this session");
      }
    }

    const now = Date.now();
    const paymentId = uuidv4();
    let transactionId = `tx_${Math.random().toString(36).substring(2, 15)}`;
    let paymentIntentId = "";

    // In a real app, we would use Stripe here
    if (paymentMethodId) {
      try {
        // Create a payment intent
        const paymentIntent = await createPaymentIntent(
          amount * 100, // Stripe uses cents
          'usd',
          `Payment for session ${sessionId}`
        );

        // Confirm the payment
        const confirmation = await confirmPayment(
          paymentIntent.client_secret,
          paymentMethodId
        );

        if (confirmation.error) {
          throw new Error(confirmation.error.message);
        }

        if (confirmation.paymentIntent.status === 'succeeded') {
          transactionId = confirmation.paymentIntent.id;
          paymentIntentId = confirmation.paymentIntent.id;
        } else {
          throw new Error(`Payment failed with status: ${confirmation.paymentIntent.status}`);
        }
      } catch (stripeError) {
        console.error("Stripe payment error:", stripeError);
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
      status: "completed" as const,
      date: new Date().toISOString().split("T")[0],
      transactionId: transactionId,
      paymentIntentId: paymentIntentId,
      paymentMethodId: paymentMethodId,
      createdAt: now,
      updatedAt: now,
    };

    console.log("Creating payment record:", newPayment);

    // Insert the payment
    await setDocument(COLLECTIONS.PAYMENTS, paymentId, newPayment);

    // Update the session payment status
    await updateSession(sessionId, {
      paymentStatus: "completed",
      paymentAmount: amount,
    });

    return {
      id: paymentId,
      sessionId: sessionId,
      amount: amount,
      status: "completed" as const,
      date: newPayment.date,
      transactionId: transactionId,
    };
  } catch (error) {
    console.error("Failed to process payment:", error);
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
    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded");
    }

    // Process the refund through Stripe if there's a paymentIntentId
    if (payment.paymentIntentId) {
      try {
        const refund = await createRefund(payment.paymentIntentId);

        if (refund.error) {
          throw new Error(refund.error.message);
        }
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
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
