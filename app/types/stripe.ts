import Stripe from "stripe";

export type PaymentIntent = Pick<
  Stripe.PaymentIntent,
  'next_action' | 'id' | 'client_secret' | 'payment_method_options'
>;