import { v4 as uuidv4 } from "uuid";
import { getDatabase } from "./database/db";
import { updateSession } from "./sessionService";
import type { Payment } from "../types";

// Define interface for RxDB document type
interface PaymentDocument {
  id: string;
  sessionId: string;
  mentorId: string;
  menteeId: string;
  amount: number;
  status: string;
  date: string;
  transactionId: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Process a payment for a session
 * This is a simulation service that would be replaced with a real payment gateway in production
 */
export const processPayment = async (
  sessionId: string,
  amount: number
): Promise<Payment> => {
  try {
    const db = await getDatabase();

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
    const sessionDoc = await db.sessions.findOne(sessionId).exec();
    if (!sessionDoc) {
      throw new Error(`Session with ID ${sessionId} not found`);
    }

    const session = sessionDoc.toJSON();

    // Check if payment has already been processed
    const existingPayments = await db.payments
      .find({
        selector: {
          sessionId: sessionId,
        },
      })
      .exec();

    if (existingPayments.length > 0) {
      const existingPayment = existingPayments[0].toJSON();
      if (existingPayment.status === "completed") {
        throw new Error("Payment has already been processed for this session");
      }
    }

    const now = Date.now();
    const paymentId = uuidv4();
    const transactionId = `tx_${Math.random().toString(36).substring(2, 15)}`;

    // Create payment record
    const newPayment = {
      id: paymentId,
      sessionId: sessionId,
      mentorId: session.mentorId,
      menteeId: session.menteeId,
      amount: amount,
      status: "completed" as const, // In a real app, this would start as "pending" and be updated after gateway response
      date: new Date().toISOString().split("T")[0],
      transactionId: transactionId,
      createdAt: now,
      updatedAt: now,
    };

    console.log("Creating payment record:", newPayment);

    // Insert the payment
    await db.payments.insert(newPayment);

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
 * Refund a payment
 */
export const refundPayment = async (paymentId: string): Promise<Payment> => {
  try {
    const db = await getDatabase();

    // Check if payment exists
    const paymentDoc = await db.payments.findOne(paymentId).exec();
    if (!paymentDoc) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const payment = paymentDoc.toJSON() as PaymentDocument;

    // Check if payment can be refunded
    if (payment.status !== "completed") {
      throw new Error("Only completed payments can be refunded");
    }

    const now = Date.now();

    // Update payment status
    await paymentDoc.update({
      $set: {
        status: "refunded",
        updatedAt: now,
      },
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
    const db = await getDatabase();

    // Find payments where user is either the mentor or mentee
    const mentorPayments = await db.payments
      .find({
        selector: {
          mentorId: userId,
        },
      })
      .exec();

    const menteePayments = await db.payments
      .find({
        selector: {
          menteeId: userId,
        },
      })
      .exec();

    // Combine and deduplicate payments
    const allPayments = [...mentorPayments, ...menteePayments];
    const uniquePaymentIds = new Set();
    const uniquePayments = [];

    for (const doc of allPayments) {
      const payment = doc.toJSON() as PaymentDocument;
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
    const db = await getDatabase();
    const paymentDoc = await db.payments.findOne(id).exec();

    if (!paymentDoc) {
      return null;
    }

    const payment = paymentDoc.toJSON() as PaymentDocument;
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
    const db = await getDatabase();
    const paymentDocs = await db.payments
      .find({
        selector: {
          sessionId: sessionId,
        },
      })
      .exec();

    if (paymentDocs.length === 0) {
      return null;
    }

    const payment = paymentDocs[0].toJSON() as PaymentDocument;
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
