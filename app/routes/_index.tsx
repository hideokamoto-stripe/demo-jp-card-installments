import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/cloudflare';
import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useSubmit,
} from '@remix-run/react';
import {
  CardElement,
  Elements,
  ElementsConsumer,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState } from 'react';
import Stripe from 'stripe';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '~/components/ui/select';

const stripePromise = loadStripe(import.meta.env.VITE_PUBLIC_STRIPE_PUB_KEY);

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export const loader = async (props: LoaderFunctionArgs) => {
  const stripe = new Stripe(props.context.cloudflare.env.STRIPE_SECRET_API_KEY);
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
    const confirmData: Stripe.PaymentIntentConfirmParams = {
      return_url: new URL(args.request.url).toString(),
    };
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
    console.log(paymentIntent);
  }

  return json({
    paymentIntent: paymentIntent,
  });
};

export default function Index() {
  const { customerId } = useLoaderData<typeof loader>();
  const data = useActionData<typeof action>();
  const submit = useSubmit();
  const [error, setError] = useState('');
  const [installmentPlan, setInstallmentPlan] = useState<string>('');
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
            <pre>
              <code>{JSON.stringify(error, null, 2)}</code>
            </pre>
          </div>
          <Elements stripe={stripePromise}>
            <ElementsConsumer>
              {({ elements, stripe }) => {
                if (!stripe || !elements) return null;
                if (data && data.paymentIntent) {
                  const paymentIntent = data.paymentIntent;
                  if (
                    paymentIntent.next_action &&
                    paymentIntent.client_secret
                  ) {
                    return (
                      <Form
                        method="POST"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          stripe.handleNextAction({
                            clientSecret: paymentIntent.client_secret,
                          });
                        }}
                      >
                        <Button type="submit" className="w-full">
                          Confirm payment
                        </Button>
                      </Form>
                    );
                  }
                  return (
                    <Form
                      method="POST"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const [count, interval, type] =
                          installmentPlan.split('-');
                        const formData = new FormData();
                        formData.append('payment_intent_id', paymentIntent.id);
                        formData.append(
                          'installments_plan_count',
                          count === '0' ? '' : count
                        );
                        formData.append(
                          'installments_plan_interval',
                          interval === '0' ? '' : interval
                        );
                        formData.append('installments_plan_type', type);
                        formData.append('action_type', 'confirm_payment');
                        submit(formData, {
                          method: 'POST',
                        });
                      }}
                    >
                      <Label>Installments Plan</Label>
                      {data.paymentIntent.payment_method_options?.card
                        ?.installments ? (
                        <Select
                          onValueChange={(value) => {
                            setInstallmentPlan(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="choose plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {data.paymentIntent.payment_method_options?.card?.installments.available_plans?.map(
                              (plan) => {
                                const { count, interval, type } = plan;
                                const key = `${count || 0}-${interval || 0}-${type}`;
                                const value = [
                                  count,
                                  interval,
                                  count && interval ? null : type,
                                ]
                                  .filter(Boolean)
                                  .join(' ');
                                return (
                                  <SelectItem key={`${key}`} value={`${key}`}>
                                    {value}
                                  </SelectItem>
                                );
                              }
                            )}
                          </SelectContent>
                        </Select>
                      ) : null}
                      <Button type="submit" className="w-full">
                        Order
                      </Button>
                    </Form>
                  );
                }
                return (
                  <Form
                    method="POST"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const cardElement = elements?.getElement(CardElement);
                      if (!cardElement) return;
                      const { paymentMethod, error } =
                        await stripe.createPaymentMethod({
                          type: 'card',
                          card: cardElement,
                        });
                      if (error && error.message) {
                        setError(error.message);
                        return;
                      }
                      if (!paymentMethod) return;
                      const formData = new FormData();
                      formData.append('payment_method_id', paymentMethod.id);
                      formData.append('action_type', 'register_card');
                      formData.append('customer_id', customerId);
                      submit(formData, {
                        method: 'POST',
                      });
                    }}
                  >
                    <CardElement
                      className="my-4 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      options={{
                        hidePostalCode: true,
                      }}
                    />
                    <Button type="submit" className="w-full">
                      Register card
                    </Button>
                  </Form>
                );
              }}
            </ElementsConsumer>
          </Elements>
        </div>
      </div>
    </div>
  );
}
