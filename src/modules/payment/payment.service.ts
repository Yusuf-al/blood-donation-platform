import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";

import config from "../../config";
import AppError from "../../errors/AppError";
import { stripe } from "../../lib/stripe";
import { Stripe } from "stripe";
import { getBkashIdToken } from "../../lib/bkash";
import { success } from "zod";

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
        console.error(
          `Checkout session missing required metadata. Session ID: ${session.id}`,
        );
        break;
      }

      if (provider !== PaymentProvider.STRIPE) {
        console.error(`Unsupported payment provider: ${provider}`);
        break;
      }

      if (session.payment_status !== "paid") {
        console.log(`Checkout session ${session.id} is not paid.`);
        break;
      }

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
        console.log(`Payment already exists for transaction: ${transactionId}`);
        break;
      }

      await prisma.$transaction([
        prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            isPremiumUser: true,
          },
        }),

        prisma.payment.create({
          data: {
            userId,

            transactionId,

            status: PaymentStatus.PAID,

            amount: (session.amount_total ?? 0) / 100,

            paymentMethod: PaymentMethod.CARD,

            paidAt: new Date(),

            provider: PaymentProvider.STRIPE,
          },
        }),
      ]);

      console.log(`✅ User ${userId} upgraded to premium`);

      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      console.log("PaymentIntent succeeded:", paymentIntent.id);

      console.log("Metadata:", paymentIntent.metadata);

      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;

      if (!userId) {
        console.error(
          `Async payment succeeded but userId is missing. Session: ${session.id}`,
        );
        break;
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

  if (user?.isPremiumUser) {
    throw AppError.badRequest("You are a Premium User");
  }

  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw AppError.badRequest("No access token found");
  }

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
        payerReference: "01723888888",
        callbackURL: `${config.bkash_callback_url}/subscription/bkash/callback`,
        merchantAssociationInfo: "MI05MID54RF09123456One",
        amount: "149",
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: "Inv0124",
      }),
    },
  );

  const bkashPaymentResult = await bkashCreatePayment.json();
  return bkashPaymentResult;
};

const bkashPaymentCallback = async () => {
  return {
    success: true,
  };
};

export const paymentServices = {
  paymentSession,
  handlePaymentWebhook,
  bkashPaymentService,
  bkashPaymentCallback,
};
