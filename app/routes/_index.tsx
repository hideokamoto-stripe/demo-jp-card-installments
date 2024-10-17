import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare';
import { json, useActionData, useLoaderData } from '@remix-run/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import Stripe from 'stripe';
import { CardForm } from '~/components/stripe/CardForm';
import { ConfirmPayment } from '~/components/stripe/ConfirmPayment';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_PUB_KEY);

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export const loader = async (props: LoaderFunctionArgs) => {
  const stripe = new Stripe(props.context.cloudflare.env.STRIPE_SECRET_API_KEY);
  const url = new URL(props.request.url);
  const paymentIntentId = url.searchParams.get('payment_intent');
  if (paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId,
      {
        expand: ['latest_charge'],
      }
    );
    const { customer, amount, currency, status } = paymentIntent;
    let { latest_charge: charge } = paymentIntent;
    if (typeof charge === 'string') {
      charge = await stripe.charges.retrieve(charge);
    }
    const installments =
      charge['payment_method_details']['card']['installments'];
    return {
      customerId: customer,
      orderDetail: {
        amount,
        currency,
        status,
        installments,
      },
    };
  }

  const customer = await stripe.customers.create({
    name: 'Demo for card installments',
  });
  return {
    customerId: customer.id,
  };
};
export const action = async (args: ActionFunctionArgs) => {
  const stripe = new Stripe(args.context.cloudflare.env.STRIPE_SECRET_API_KEY);
  const body = await args.request.formData();
  const actionType = body.get('action_type');
  let paymentIntent: Stripe.PaymentIntent | undefined = undefined;
  const confirmData: Stripe.PaymentIntentConfirmParams = {
    return_url: new URL(args.request.url).toString(),
  };
  if (actionType === 'register_card') {
    const paymentMethodId = body.get('payment_method_id');
    const customerId = body.get('customer_id');
    paymentIntent = await stripe.paymentIntents.create({
      amount: 100000,
      currency: 'jpy',
      customer: customerId?.toString(),
      payment_method: paymentMethodId?.toString(),
      payment_method_options: {
        card: {
          installments: {
            enabled: true,
          },
        },
      },
    });
    /**
     * 分割払いをサポートしていないカードでは、そのまま決済を完了させる
     */
    if (
      !paymentIntent.payment_method_options?.card?.installments ||
      !paymentIntent.payment_method_options?.card?.installments.available_plans ||
      paymentIntent.payment_method_options?.card?.installments.available_plans?.length < 1
    ) {
      paymentIntent = await stripe.paymentIntents.confirm(
        paymentIntent.id,
        confirmData
      );

    }
  }
  if (actionType === 'confirm_payment') {
    const paymentIntentId = body.get('payment_intent_id')?.toString() || '';
    const installmentPlanCount = body
      .get('installments_plan_count')
      ?.toString();
    const installmentPlanInterval = body
      .get('installments_plan_interval')
      ?.toString();
    const installmentPlanType = body.get('installments_plan_type')?.toString();
    if (installmentPlanType) {
      confirmData['payment_method_options'] = {
        card: {
          installments: {
            plan: {
              type: installmentPlanType,
              count: Number(installmentPlanCount),
              interval: installmentPlanInterval,
            } as any,
          },
        },
      };
    }

    paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      confirmData
    );
  }

  return json({
    paymentIntent: paymentIntent,
  });
};

export default function Index() {
  const { customerId, orderDetail } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();
  const [error, setError] = useState('');
  return (
    <div className="w-full lg:grid lg:min-h-[600px] xl:min-h-[800px]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">分割払い決済のデモ</h1>
            <p className="text-balance text-muted-foreground">
              テストカード番号
            </p>
            <ul>
              <li>4000003920000003</li>
              <li>5200003920000008</li>
              <li>3530111333300000</li>
              <li>3600003920000009</li>
              <li>4000003920000029</li>
            </ul>
            {error ? <p>{error}</p> : null}
          </div>
          <Elements stripe={stripePromise}>
            {data && data.paymentIntent ? (
              <ConfirmPayment paymentIntent={data.paymentIntent} />
            ) : (
              <CardForm setError={setError} customerId={customerId} />
            )}
          </Elements>
          {orderDetail ? (
            <Card x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Order detail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {orderDetail.amount.toLocaleString()} {orderDetail.currency}
                </div>
                <p className="text-xs text-muted-foreground">
                  {orderDetail.installments ? (
                    <pre>
                      <code>
                        {JSON.stringify(orderDetail.installments, null, 2)}
                      </code>
                    </pre>
                  ) : (
                    'One time'
                  )}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
