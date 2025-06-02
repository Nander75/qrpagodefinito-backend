import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-08-16',
});

app.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
  });
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency, paymentMethodType } = req.body;

    if (!amount || !currency || !paymentMethodType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Definimos métodos de pago válidos para Bizum y SEPA
    const allowedPaymentMethods = ['bizum', 'sepa_debit'];

    if (!allowedPaymentMethods.includes(paymentMethodType)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    // Creamos PaymentIntent con método de pago adecuado
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en la moneda menor (ej. céntimos)
      currency,
      payment_method_types: [paymentMethodType],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
