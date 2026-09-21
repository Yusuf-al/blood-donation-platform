import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  SubscriptionStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

import config from "../../config";
import AppError from "../../errors/AppError";
import { stripe } from "../../lib/stripe";
import { Stripe } from "stripe";
import { getBkashIdToken } from "../../lib/bkash";
import { success } from "zod";
import { generateInvoiceNumber } from "../../utils/generateInvNum";

const startedAt = new Date();
const expiresAt = new Date(startedAt);
expiresAt.setFullYear(expiresAt.getFullYear() + 1);

const paymentSession = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  if (user?.isPremiumUser) {
    throw AppError.badRequest("You are a Premium User");
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    phone: user.phone ?? undefined,
    metadata: {
      userId: user.id,
    },
  });

  const stripeCustomerId = customer.id;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: "price_1UHHvsDF7Z6kiBooD5kPEuEA",
        quantity: 1,
      },
    ],

    mode: "subscription",

    payment_method_types: ["card"],

    customer: stripeCustomerId,

    metadata: {
      userId: user.id,
      provider: PaymentProvider.STRIPE,
    },

    success_url: `http://localhost:6000/payment?success=true`,

    cancel_url: `http://localhost:6000/payment?success=false`,
  });

  return session.url;
};

const handlePaymentWebhook = async (payload: Buffer, signature: string) => {
  const endpointSecret = config.stripe_webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
  } catch (err) {
    throw AppError.badRequest(
      `Webhook signature verification failed: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      console.log("✅ checkout.session.completed received:", event.id);

      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const provider = session.metadata?.provider;

      // FIXED: provider must be checked with !
      if (!userId || !provider) {
        throw AppError.badRequest(
          `Checkout session missing required metadata. Session ID: ${session.id}`,
        );
      }

      if (provider !== PaymentProvider.STRIPE) {
        throw AppError.badRequest(`Unsupported payment provider: ${provider}`);
      }

      if (session.payment_status !== "paid") {
        throw AppError.badRequest(
          `Checkout session ${session.id} is not paid.`,
        );
      }

      const today = new Date();

      const transactionId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? session.id);

      const existingPayment = await prisma.payment.findFirst({
        where: {
          transactionId,
        },
      });

      if (existingPayment) {
        throw AppError.conflict(
          `Payment already exists for transaction: ${transactionId}`,
        );
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        throw AppError.notFound(`User not found: ${userId}`);
      }

      const amount = (session.amount_total ?? 0) / 100;

      await prisma.$transaction(async (tx) => {
        const subscription = await tx.subscription.create({
          data: {
            userId,
            status: SubscriptionStatus.ACTIVE,
            startedAt,
            expiresAt,
          },
        });
        await tx.payment.create({
          data: {
            userId,
            subscriptionId: subscription.id,
            transactionId,
            provider: PaymentProvider.STRIPE,
            paymentMethod: PaymentMethod.CARD,
            amount,
            status: PaymentStatus.PAID,
            paidAt: new Date(),
          },
        });

        await tx.user.update({
          where: {
            id: userId,
          },
          data: {
            isPremiumUser: true,
          },
        });
      });

      console.log(`✅ User ${userId} upgraded to premium`);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      if (!paymentIntent.payment_details?.order_reference) {
        throw AppError.notFound("Payment not found");
      }

      await prisma.payment.update({
        where: {
          transactionId: paymentIntent.payment_details?.order_reference,
        },
        data: {
          transactionId: paymentIntent.id,
        },
      });

      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;

      if (!userId) {
        throw AppError.conflict(
          `Async payment succeeded but userId is missing. Session: ${session.id}`,
        );
      }

      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isPremiumUser: true,
        },
      });

      console.log(`✅ Async payment succeeded for user: ${userId}`);

      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;

      console.warn(
        `Async payment failed. User: ${userId ?? "unknown"}, Session: ${session.id}`,
      );

      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      console.warn(`PaymentIntent failed: ${paymentIntent.id}`);

      console.warn(
        `Reason: ${
          paymentIntent.last_payment_error?.message ?? "Unknown reason"
        }`,
      );

      break;
    }

    default: {
      console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  return {
    received: true,
  };
};

const bkashPaymentService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  if (user.isPremiumUser) {
    throw AppError.badRequest("You are already a Premium User");
  }

  const bkashIdToken = await getBkashIdToken();
  if (!bkashIdToken) {
    throw AppError.badRequest("No access token found");
  }

  const inv = generateInvoiceNumber();

  // 1. Perform external API call OUTSIDE the database transaction
  const bkashCreatePayment = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: bkashIdToken,
        "X-App-Key": config.bkash_app_key,
      },
      body: JSON.stringify({
        agreementID: "TokenizedMerchant01L3IKB6H1565072174986",
        mode: "0011",
        payerReference: user.id,
        callbackURL: `${config.bkash_callback_url}/subscription/bkash/callback`,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: "149",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: inv,
      }),
    },
  );

  const bkashPaymentResult = await bkashCreatePayment.json();

  // Validate bKash creation response status code
  if (bkashPaymentResult.statusCode !== "0000") {
    throw AppError.badRequest(
      bkashPaymentResult.statusMessage || "Failed to create bKash payment",
    );
  }

  // 2. Perform DB operation inside transaction using the 'tx' client
  const transactionResult = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        userId,
        status: SubscriptionStatus.PENDING,
      },
    });
    const payment = await tx.payment.create({
      data: {
        userId: user.id,
        subscriptionId: subscription.id,
        paymentId: bkashPaymentResult.paymentID,
        paymentMethod: PaymentMethod.MOBILE_BANKING,
        transactionId: inv,
        amount: parseFloat(bkashPaymentResult.amount),
        provider: PaymentProvider.BKASH,
        status: PaymentStatus.PENDING,
      },
    });
    return { bkashPaymentResult, payment, subscription };
  });

  return transactionResult;
};

const bkashPaymentCallback = async (query: Record<string, any>) => {
  const paymentId = query.paymentID;
  if (!paymentId) {
    throw AppError.notFound("Payment ID is missing");
  }

  const status = query.status;
  if (!status) {
    throw AppError.notFound("Payment status is missing"); // Fixed typo in error message
  }

  const payment = await prisma.payment.findUnique({
    where: { paymentId },
    include: { subscription: true },
  });

  if (!payment) {
    throw AppError.notFound("Payment record not found");
  }

  if (payment.status === PaymentStatus.PAID) {
    return {
      bkashPaymentExecuteResponse: null,
      redirectUrl: `${config.bkash_callback_url}/home?status=success`,
    };
  }

  // Handle failure or cancel states without calling execute API
  if (status === "failure" || status === "cancel") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { paymentId },
      });

      await tx.subscription.delete({
        where: { id: payment.subscriptionId },
      });
    });

    return {
      bkashPaymentExecuteResponse: null,
      redirectUrl: `${config.bkash_callback_url}/home?status=${status}`,
    };
  }

  // Handle success state
  if (status === "success") {
    const bkashIdToken = await getBkashIdToken();
    if (!bkashIdToken) {
      throw AppError.badRequest("No access token found");
    }

    // Call execute API OUTSIDE the transaction
    const bkashPaymentExecute = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: bkashIdToken,
          "X-App-Key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: paymentId,
        }),
      },
    );

    if (!bkashPaymentExecute.ok) {
      throw AppError.badRequest(
        `bKash execute API returned HTTP ${bkashPaymentExecute.status}`,
      );
    }

    const bkashPaymentExecuteResponse = await bkashPaymentExecute.json();

    if (bkashPaymentExecuteResponse.statusCode !== "0000") {
      throw AppError.badRequest(
        bkashPaymentExecuteResponse.statusMessage || "Payment execution failed",
      );
    }

    const trxID = bkashPaymentExecuteResponse.trxID;
    if (!trxID) {
      throw AppError.badRequest("bKash transaction ID is missing");
    }

    // Perform database updates atomically using the 'tx' client
    const transactionCallBack = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: {
          paymentId: paymentId,
        },
        data: {
          transactionId: bkashPaymentExecuteResponse.trxID,
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
        include: {
          subscription: true,
        },
      });

      await tx.subscription.update({
        where: { id: updatedPayment.subscriptionId },
        data: {
          status: SubscriptionStatus.ACTIVE,
          startedAt,
          expiresAt,
        },
      });

      await tx.user.update({
        where: {
          id: updatedPayment.userId,
        },
        data: {
          isPremiumUser: true,
        },
      });
      return {
        bkashPaymentExecuteResponse,
        redirectUrl: `${config.bkash_callback_url}/home?status=success`,
      };
    });

    return transactionCallBack;
  }

  return {
    bkashPaymentExecuteResponse: null,
    redirectUrl: `${config.bkash_callback_url}/home?status=cancel`,
  };
};
export const paymentServices = {
  paymentSession,
  handlePaymentWebhook,
  bkashPaymentService,
  bkashPaymentCallback,
};
