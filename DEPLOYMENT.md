# Deploying Haven to Vercel

Haven is two programs — a Next.js storefront in `client/` and an Express API in
`server/` — so it deploys as **two Vercel projects from this one repository**.

They do not, however, end up on two addresses. The storefront proxies `/api`
through to the API (`rewrites` in `client/next.config.ts`), so a browser only
ever talks to one origin. That is the whole reason for the arrangement: the
session is an httpOnly cookie, and a cookie sent from the shop to an API on a
different domain is a *third-party* cookie — Safari blocks those outright and
Chrome is removing them. Same origin, first-party cookie, sign-in works
everywhere.

```
                    browser
                       |  everything on one domain
                       v
        +------------------------------+
        |  haven  (Next.js, client/)   |
        |                              |
        |  /            pages          |
        |  /api/*  ---- rewrite -------+--->  haven-api  (Express, server/)
        |  /uploads/* - rewrite -------+--->  MongoDB Atlas
        +------------------------------+
```

---

## 1. Deploy the API first

The storefront needs the API's URL at build time, so this one goes first.

**New Project → import this repository**, then:

| Setting | Value |
| --- | --- |
| Project Name | `haven-api` |
| Root Directory | `server` |
| Framework Preset | **Express** |

Leave the build and output settings alone — `server/vercel.json` covers them.

### Environment variables

Add these under **Settings → Environment Variables**, for *Production*,
*Preview* and *Development*. `server/.env.example` documents every one.

| Name | Value |
| --- | --- |
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random string — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES` | `3d` |
| `CLIENT_URL` | the storefront's URL — you do not have it yet, put `https://haven.vercel.app` and correct it in step 3 |
| `ALLOW_VERCEL_PREVIEWS` | `true` |
| `INTERNAL_PROXY_SECRET` | a long random string — **the same value on both projects** |
| `RESEND_API_KEY` | your Resend key |
| `EMAIL_FROM` | `Haven <onboarding@resend.dev>` |
| `STRIPE_SECRET_KEY` | your Stripe secret key (`sk_test_…` or `sk_live_…`) |
| `STRIPE_WEBHOOK_SECRET` | the signing secret from step 7 |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://<storefront-domain>/api/auth/google/callback` — the **storefront** domain, see step 4 |

Do **not** set `NODE_ENV`. Vercel sets it to `production` itself, and the code
reads that correctly.

Deploy, then open `https://haven-api.vercel.app/api/health`. It should answer:

```json
{ "status": "success", "data": { "database": "connected", "..." : "..." } }
```

A 503 saying the database is unreachable means `MONGO_URI` is wrong or Atlas is
refusing the connection — see step 5.

---

## 2. Deploy the storefront

**New Project → import the same repository again**, then:

| Setting | Value |
| --- | --- |
| Project Name | `haven` |
| Root Directory | `client` |
| Framework Preset | **Next.js** (detected) |

### Environment variables

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `/api` |
| `API_ORIGIN` | `https://haven-api.vercel.app` — the API project's URL, **no trailing slash** |
| `INTERNAL_PROXY_SECRET` | the **same** value you set on `haven-api` |

`API_ORIGIN` is read while the build runs, so changing it later means
redeploying, not just restarting.

The `NEXT_PUBLIC_FIREBASE_*` variables are not needed. Staff sign in against the
Express API with their Haven account; the Firebase helper is left over and
unused.

---

## 3. Point the API back at the storefront

Now that the storefront has a URL, set `CLIENT_URL` on **haven-api** to it
(e.g. `https://haven.vercel.app`, no trailing slash) and redeploy that project.

`CLIENT_URL` is doing three jobs: the CORS allow-list, the links inside
verification and password-reset emails, and where a Google sign-in lands. A
stale value here shows up as reset links that go nowhere.

Using a custom domain as well? `CLIENT_URL` takes a comma-separated list:

```
https://haven.vercel.app,https://shop.yourdomain.com
```

---

## 4. Google sign-in

The callback belongs to the **storefront** domain, not the API. The storefront
proxies it through, which is what puts the session cookie on the origin the
shopper is actually browsing.

In **Google Cloud Console → Credentials → your OAuth client → Authorised
redirect URIs**, add:

```
https://haven.vercel.app/api/auth/google/callback
```

and set `GOOGLE_CALLBACK_URL` on **haven-api** to exactly the same string.
Google compares them character for character.

---

## 5. MongoDB Atlas network access

Vercel functions do not run from a fixed set of addresses. In Atlas under
**Network Access**, allow `0.0.0.0/0`, or attach a Vercel static-IP integration
if you would rather not. Without this every request answers 503.

---

## 6. Make yourself an administrator

Signing up always creates a plain customer, so the first admin is made from
outside the app. From your own machine, with `server/.env` filled in:

```bash
cd server
npm run grant-role -- you@example.com admin
npm run grant-role -- them@example.com moderator
```

The role is what opens a console, and each console admits only its own role:

- `/admin-console` — the `admin` role. Full read and write.
- `/moderator-console` — the `moderator` role. Adds products, reads reviews.

Signing in at the wrong one does not fail as a bad password: it says so, and
offers a link to the console that account does own.

---

## 7. Stripe payments

Card details are entered on Stripe's own hosted page, never on the storefront —
no card number reaches this application at any point.

**Point the webhook at the API directly**, not at the storefront:

```
https://haven-api.vercel.app/api/orders/webhook
```

Stripe signs the exact bytes it sends, and verification fails if anything
rewrites them on the way. The storefront proxy has no reason to be in that path,
so it is left out of it.

In **Stripe Dashboard → Developers → Webhooks → Add endpoint**, use that URL and
subscribe to:

| Event | What it does here |
| --- | --- |
| `checkout.session.completed` | the one that matters — marks the order paid, takes stock down, empties the bag, emails the receipt |
| `checkout.session.async_payment_succeeded` | the same, for methods that settle later |
| `checkout.session.async_payment_failed` | marks the order "Payment failed" |
| `checkout.session.expired` | shopper walked away — marks it "Cancelled" |
| `payment_intent.payment_failed` | card refused |

Copy the endpoint's signing secret into `STRIPE_WEBHOOK_SECRET` on **haven-api**
and redeploy. Until that is set, checkout still sends people to Stripe and still
takes their money — but nothing ever comes back to mark the order paid. It is
the single most important value in this section.

### How the flow runs

1. The shopper fills in an address and presses **Continue to payment**.
2. The API reads their bag and the catalogue, works out the totals **itself**,
   writes an order as `Awaiting payment`, and opens a Stripe session. Nothing
   about price, quantity or product comes from the browser — a checkout that
   trusted the browser about what things cost would be a shop anybody could buy
   from for a penny.
3. Stripe collects the card and calls the webhook.
4. On success the shopper lands on `/account?tab=orders`, where a banner
   confirms the reference. On cancel they land on `/checkout/failed`, which says
   plainly that nothing was charged and leaves the bag untouched.

Stock is decremented and the bag emptied **only** in the webhook, so a shopper
who abandons Stripe loses nothing. The webhook is idempotent — Stripe delivers
at least once, not exactly once, and a replayed event will not take stock twice.

### Testing it

Use Stripe test mode and card `4242 4242 4242 4242`, any future expiry, any CVC.
To exercise the webhook locally:

```bash
stripe listen --forward-to localhost:3001/api/orders/webhook
```

That prints a `whsec_…` secret — put it in `server/.env` as
`STRIPE_WEBHOOK_SECRET` while you test.

---

## Uploaded photography

Product images are stored **in MongoDB** and served from `/api/media/<id>`.

This is not a stylistic choice. A Vercel function's filesystem is read-only and
discarded when the invocation ends, so an image written to `server/uploads/`
would be gone before the browser could ask for it, and gone entirely on the
next deployment. The bytes therefore live next to the products that reference
them.

- The URL saved on a product is root-relative, so it survives a domain change.
- Responses are immutable and cached for a year — an edit uploads a new image
  and repoints the product, it never rewrites one in place.
- The console uploads one file per request. A serverless function refuses a
  body over 4.5 MB, and eight photographs in one request would clear that.
- Each image may be up to 4 MB, eight per selection.

Products seeded before this change may still hold `http://localhost:3001/...`
URLs, which will not resolve in production. Re-upload those images from the
admin console, or re-run `npm run seed` locally to reset them to the designed
catalogue.

---

## Hosting the API on Render instead

Render runs a long-lived process rather than importing a handler, so it needs
something listening on a port. `app.js` binds one when it is run directly, and
`server.js` does the same, so either entry point works — but set these anyway:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |

**"Port scan timeout reached, no open ports detected"** means nothing bound a
port. Almost always the Start Command is running a file that only exports the
app, or the Root Directory is not `server` so `npm start` found no
`package.json`. Render provides the port in `PORT`; the server reads it and
listens on every interface, which is what makes it visible from outside the
container.

Environment variables are the same as the Vercel list, plus three that Vercel
did not need:

| Name | Value | Why |
| --- | --- | --- |
| `NODE_ENV` | `production` | without it the session cookie is not marked `Secure`, and a cross-site sign-in silently fails |
| `TRUST_FORWARDED_FOR` | `true` | Vercel is detected automatically; Render is not, and without this every visitor shares one rate-limit bucket |
| `TRUSTED_PROXY_HOPS` | `1` | Render appends the caller's address to `X-Forwarded-For`; this says how far in from the right to read it. Add one per extra proxy — Cloudflare in front, for example |

Then add Render's outbound addresses under **Atlas → Network Access**. If you
skip it, the API still starts and `/api/health` still answers — it reports the
database as unreachable and every data route returns 503 with the reason, which
is deliberate. A server that killed itself over this would just restart forever
and tell you nothing.

Finally, point `CLIENT_URL` at the storefront and `API_ORIGIN` (on the
storefront) at the Render URL, and send Stripe's webhook to
`https://<your-service>.onrender.com/api/orders/webhook`.

> Free Render instances sleep when idle and take a few seconds to wake. The
> first request after a nap can outlast Stripe's webhook timeout — Stripe
> retries, so payments still land, but expect a delay before an order flips to
> *Processing*.

---

## Rate limiting

Limits are enforced per visitor, with tighter budgets on the routes that either
guess secrets or spend money:

| Route | Budget | Why |
| --- | --- | --- |
| everything under `/api` | 1000 / 15 min | blanket ceiling |
| `POST /auth/login`, `/auth/verify-2fa` | 10 failures / 15 min | credential and code guessing; successes are refunded |
| `/auth/signup`, `/forgot-password`, `/resend-verification`, `/resend-2fa` | 5 / hour per visitor **and** 4 / hour per target address | these send real email — the second key is what stops many sources burying one inbox |
| `/auth/verify-email/:token`, `/auth/reset-password/:token` | 20 / hour | backstop against grinding a link |
| review writes, `/orders/checkout` | 40 / 15 min | spam, and Stripe sessions cost money |
| `POST /products/upload` | 60 / hour **per staff account** | each upload writes megabytes into MongoDB |

Two things make this work rather than merely exist, and both need the
`INTERNAL_PROXY_SECRET` above to be set identically on both projects:

**The counters are shared.** They live in MongoDB, not in process memory. A
per-instance counter is meaningless on Vercel, because the platform answers a
flood by starting more instances — the very thing being counted is the thing
that resets the count.

**The right person is counted.** Browser traffic reaches the API through the
storefront's `/api` proxy, so the connection Express sees belongs to the
storefront, not the shopper. Left alone, that means every visitor on earth
shares one bucket and the limiter throttles the shop instead of the abuser. So
`client/proxy.ts` strips any inbound forwarding headers, reads the visitor's
address from the header Vercel's edge writes (which it refuses to let a caller
supply), and passes it on under the shared secret. The API believes that header
only when the secret checks out — otherwise it falls back to the connection
address and ignores `X-Forwarded-For` entirely, since anyone can write that one
and a fresh value per request would be a fresh budget per request.

If `INTERNAL_PROXY_SECRET` is missing the API still works and still limits — it
just cannot tell your visitors apart, so the limits apply to the storefront as
a whole. Set it.

Server-rendered page fetches carry the secret with no visitor attached, which
marks them as the storefront's own traffic and exempts them; otherwise the shop
would spend its own budget rendering pages.

`RATE_LIMIT_DISABLED=true` turns every limiter into a pass-through. It is for
local work only.

---

## Running it locally

Nothing above changes local development. Two terminals:

```bash
cd server && npm run dev     # http://localhost:3001
cd client && npm run dev     # http://localhost:3000
```

`client/.env` points `NEXT_PUBLIC_API_URL` straight at
`http://localhost:3001/api`, which skips the proxy — `localhost:3000` and
`localhost:3001` are the same site as far as a cookie is concerned, so the
session works without it.

---

## Checks after a deploy

| What | Where | Expect |
| --- | --- | --- |
| API is alive | `https://haven-api.vercel.app/api/health` | `database: "connected"` |
| Proxy is wired | `https://haven.vercel.app/api/health` | the same JSON |
| Catalogue renders | `https://haven.vercel.app/shop` | products, not an empty grid |
| Session survives | sign in, then reload | still signed in |
| Admin console | `/admin-console` as an admin | the dashboard |
| Moderator console | `/moderator-console` as a moderator | the dashboard |
| Wrong console | `/admin-console` as a moderator | "Wrong console", with a link to theirs |
| Uploads | add a product, choose an image | the thumbnail appears, and survives a redeploy |
| Rate limiting | 11 wrong sign-ins in a row | a 429 with `Retry-After`, and other people unaffected |
| Payment | buy something with card `4242 4242 4242 4242` | lands on `/account?tab=orders`, order reads *Processing*, stock down by one |
| Cancelled payment | press back on Stripe's page | lands on `/checkout/failed`, bag still full, nothing charged |

An empty shop with everything else working almost always means `API_ORIGIN` was
missing when the storefront was built. Set it and redeploy.
