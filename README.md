# European Athletics Coaching Summit

Premium MVP event registration website for a fictional coaching event built with React, Vite, Netlify Functions, and SumUp Hosted Checkout.

## Project purpose

This MVP proves the registration and hosted checkout journey without adding a database, authentication, or admin tooling yet.

- Browse a premium landing page for the fictional summit
- Select one of three registration packages
- Complete attendee details in a checkout form
- Call a Netlify Function that creates a SumUp checkout
- Redirect the attendee to SumUp's hosted payment UI
- Return to success or cancel states using URL query parameters

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

- `SUMUP_API_KEY`
- `SUMUP_MERCHANT_CODE`
- `APP_URL`

Example:

```env
SUMUP_API_KEY=your_sumup_secret_key
SUMUP_MERCHANT_CODE=your_merchant_code
APP_URL=http://localhost:8888
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

`APP_URL` should be the public base URL of the deployed application, such as `https://your-site.netlify.app`.

Never expose `SUMUP_API_KEY` in frontend code, client bundles, or public environment variables. It must remain server-side only.

## Hosted checkout flow

1. User selects a package
2. Frontend calls Netlify Function
3. Netlify Function creates SumUp checkout
4. User is redirected to SumUp hosted payment page
5. SumUp redirects back to app
6. Webhook can later be used as the source of truth for payment status

Important: SumUp Hosted Checkout renders and hosts the payment UI externally.

## Database status

This MVP has no database yet.

- Package definitions are stored in code
- Attendee records are not persisted
- Success and cancel pages reflect redirect state only
- A future webhook plus database flow should become the definitive payment confirmation layer

## SumUp verification checklist

Before going live, verify these against current SumUp docs and your merchant account behavior:

- The exact API endpoint for hosted checkout creation
- The exact response field that contains the hosted checkout URL
- Whether `redirect_url` is enough or if a dedicated cancel redirect is supported
- Which customer fields are accepted on checkout creation
- Webhook signature verification requirements
