# Netlify deployment (preview before git)

Use **Netlify** to deploy a **preview** of the site so you (or the boss) can test it **before** pushing to git. When everything is approved, push to your main repo and production stays on Vercel as usual.

---

## 1. One-time setup

### Option A: Netlify CLI (manual deploys from your machine)

1. Install the CLI (once):
   ```bash
   npm install -g netlify-cli
   ```
   Or with pnpm: `pnpm add -g netlify-cli`

2. Log in and link the site (once):
   ```bash
   netlify login
   cd "c:\Users\attia\OneDrive\Bureau\Paginas web\TestRestaurant-geneva"
   netlify init
   ```
   - Choose **“Create & configure a new site”** (or link an existing Netlify site).
   - Team: your Netlify team.
   - Site name: e.g. `TestRestaurant-geneva-preview`.
   - Build command: leave default (Netlify uses `netlify.toml`: `pnpm run build:client`).
   - Publish directory: leave default (`dist/public`).

After `netlify init`, the project is linked. You can deploy anytime without pushing to git.

### Option B: Netlify + Git (branch deploys)

1. In [Netlify](https://app.netlify.com): **Add new site** → **Import an existing project** → choose your Git provider and the **TestRestaurant-geneva** repo.
2. Build settings (usually read from `netlify.toml`):
   - **Build command:** `pnpm run build:client`
   - **Publish directory:** `dist/public`
3. Under **Site settings** → **Build & deploy** → **Continuous deployment**:
   - **Production branch:** e.g. `main` (or leave empty if you only want previews).
   - **Branch deploys:** enable **“Deploy previews”** for other branches (e.g. `staging` or `preview`).

Then: push a **branch** (e.g. `staging`) to git → Netlify builds and gives you a **preview URL**. When the boss approves, merge to `main` and push (or push to your production host).

---

## 2. Manual push to Netlify (test before git)

From the project root:

```bash
pnpm install
pnpm run deploy:netlify
```

Or step by step: `pnpm run build:client` then `netlify deploy`.

- Netlify will upload the contents of `dist/public` and give you a **draft URL** (e.g. `https://random-name-123.netlify.app`).
- **No git push** is required. Share this link for approval.

When the boss is happy:

```bash
git add -A
git commit -m "Your message"
git push origin main
```

Production (Vercel or your main host) updates from `main` as usual.

---

## 3. Deploy to Netlify production (optional)

If you want the **Netlify** site to be the “live” preview (e.g. `TestRestaurant-preview.netlify.app`):

```bash
netlify deploy --prod
```

Use this only if you want the latest manual build to be the default Netlify URL. Most of the time, `netlify deploy` (draft) is enough for testing.

---

## 4. What runs where

| Environment | Use case | API (booking, newsletter, admin) |
|-------------|----------|-----------------------------------|
| **Netlify (this setup)** | Preview / test UI, CTA, layout | Not available (static site only). Use Vercel or local for API. |
| **Vercel (production)** | Live site | Yes (serverless API) |

So: test **design and layout** (including the sticky CTA on phone) on Netlify; **booking and admin** stay on Vercel or local.

---

## 5. Summary

1. **Test on phone / with boss:** run `pnpm run build:client` then `netlify deploy` → use the draft link.
2. **After approval:** push to git (`git push origin main`) so production (e.g. Vercel) updates.
3. Optional: use a **branch** (e.g. `staging`) and Netlify “Deploy previews” so every push to that branch gets a preview URL.
