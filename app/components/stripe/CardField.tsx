import { FC } from 'react';
import { CardElement } from '@stripe/react-stripe-js';

export const CardField: FC<{
  handleSubmitForm: () => void;
}> = ({ handleSubmitForm }) => {
  return (
    <CardElement
      className="my-4 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      options={{
        hidePostalCode: true,
      }}
      onChange={(e) => {
        console.log(e);
        if (!e.complete || e.error) {
          return;
        }
        handleSubmitForm();
      }}
    />
  );
};
