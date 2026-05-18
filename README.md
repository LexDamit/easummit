# European Athletics Coaching Summit

Premium MVP event registration website for a coaching event built with React, Vite, Netlify Functions, Firebase, SumUp Hosted Checkout, and Resend.

## Project purpose

This project supports a live registration journey with Firebase-backed admin tooling, SumUp hosted checkout, and post-payment confirmation emails.

- Browse a premium landing page for the fictional summit
- Select one of three registration packages
- Complete attendee details in a checkout form
- Call a Netlify Function that creates a SumUp checkout
- Redirect the attendee to SumUp's hosted payment UI
- Return to success or cancel states using URL query parameters
- Persist registrations in Firestore
- Confirm paid registrations through the SumUp webhook
- Send the official confirmation email and ticket through Resend once payment is confirmed

## Install

```bash
npm install
```

## Local dev

Start the Vite app:

```bash
npm run dev
```

For local functions plus frontend together, use Netlify Dev:

```bash
netlify dev
```

Required environment variables:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `SUMUP_API_KEY`
- `SUMUP_MERCHANT_CODE`
- `APP_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO` (optional)

Example:

```env
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

SUMUP_API_KEY=your_sumup_secret_key
SUMUP_MERCHANT_CODE=your_merchant_code
APP_URL=http://localhost:8888

RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=EA Coaching Summit <noreply@yourdomain.com>
RESEND_REPLY_TO=events@yourdomain.com
```

## Netlify deployment

1. Push the repository to a Git provider connected to Netlify.
2. Create a Netlify site from the repository.
3. Confirm build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Add the required environment variables in Netlify.
5. Deploy.

## Environment variables in Netlify

Set these in Site configuration > Environment variables:

- `SUMUP_API_KEY`
- `SUMUP_MERCHANT_CODE`
- `APP_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO` (optional)
- Firebase frontend and server-side variables listed above

`APP_URL` should be the public base URL of the deployed application, such as `https://your-site.netlify.app`.

Never expose `SUMUP_API_KEY` in frontend code, client bundles, or public environment variables. It must remain server-side only.
Never expose `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, or `RESEND_API_KEY` in frontend code.

## Hosted checkout flow

1. User selects a package
2. Frontend calls Netlify Function
3. Netlify Function creates SumUp checkout
4. User is redirected to SumUp hosted payment page
5. SumUp redirects back to app
6. SumUp calls the webhook to confirm the real payment status
7. Once the webhook marks the registration as paid, the app sends the official confirmation email with the QR ticket attachment through Resend

Important: SumUp Hosted Checkout renders and hosts the payment UI externally.

## Database status

The app uses Firebase / Firestore for:

- registration catalog and package definitions
- attendee registrations
- payment tracking
- hotel assignment and admin follow-up

The source of truth for a paid registration is the webhook-confirmed Firestore record, not the browser redirect alone.

## SumUp verification checklist

Before going live, verify these against current SumUp docs and your merchant account behavior:

- The exact API endpoint for hosted checkout creation
- The exact response field that contains the hosted checkout URL
- Whether `redirect_url` is enough or if a dedicated cancel redirect is supported
- Which customer fields are accepted on checkout creation
- Webhook signature verification requirements
