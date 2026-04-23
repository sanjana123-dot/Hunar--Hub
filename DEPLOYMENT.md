# Deploying HunarHub (Vercel + Railway)

## Vercel (frontend)

1. Create a project from this repository.
2. Set **Root Directory** to `frontend` (the folder that contains `package.json` for the React app).
3. Under **Environment Variables**, add:
   - **`REACT_APP_API_URL`** — your Railway service **public HTTPS URL** only (no trailing slash, no `/api` suffix). Example: `https://your-service.up.railway.app`  
   Create React App reads this at **build** time; change it only if the API URL changes, then trigger a new deployment.
4. Build command: `npm run build` (default). Output directory: `build`.
5. SPA routing is handled by [`frontend/vercel.json`](frontend/vercel.json) (rewrites to `index.html`).

## Railway (backend)

1. Create a **Web** service from this repo (root contains `pom.xml` and `Dockerfile`). [`railway.toml`](railway.toml) uses the Dockerfile builder.
2. Add a **PostgreSQL** plugin and link it to the service so variables like `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` are available (or set a full JDBC URL yourself).
3. Set these variables on the **backend** service:

- `JWT_SECRET`: long random string for signing JWTs (required).
- `FRONTEND_URL`: your live site origin, e.g. `https://your-app.vercel.app` (used with CORS; `https://*.vercel.app` is also allowed in code).
- Database (Supabase or Railway Postgres):
  - `SPRING_DATASOURCE_URL`: full JDBC URL.  
    For your Supabase setup use:  
    `jdbc:postgresql://aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require`
  - `PGUSER`:  
    `postgres.vcdmhspdidwjeqfwshan`
  - `PGPASSWORD`: set your Supabase DB password in Railway variable UI (do not commit it in source files).

`PORT` is set by Railway; Spring uses `server.port=${PORT:8080}`.

4. After deploy, copy the service **public URL** and set **`REACT_APP_API_URL`** on Vercel to that same origin (HTTPS), then redeploy the frontend.

## Smoke test

Open the deployed site, DevTools → Network, register a user: `POST .../api/auth/register` should go to the Railway host, return `200`, and include `token`. If the browser reports a CORS error, confirm `FRONTEND_URL` matches your Vercel URL and that the API URL uses HTTPS.
