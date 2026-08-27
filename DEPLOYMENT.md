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
| `RESEND_API_KEY` | your Resend key |
| `EMAIL_FROM` | `Haven <onboarding@resend.dev>` |
| `STRIPE_SECRET_KEY` | your Stripe key |
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

An empty shop with everything else working almost always means `API_ORIGIN` was
missing when the storefront was built. Set it and redeploy.
