# MedPro CRM — Starter (zip-ready)

This is a ready-to-deploy starter project (backend + frontend + DB schema) for MedPro CRM, white-labeled and with basic policy-tracking automation (poller + webhook handler).

## Quick start (upload to Render + Supabase)

1. Create a Supabase project and run `database/schema.sql` to create tables.
2. Create a new GitHub repo and upload these files (or upload this ZIP directly to Render).
3. On Render create a **Web Service** for the backend (connect to repo or upload):
   - Build command: `npm install`
   - Start command: `npm start`
   - Add environment variable `DATABASE_URL` with your Supabase connection string
4. Create a **Static Site** on Render for the frontend (or serve frontend from backend).
5. Add carriers via POST `/api/carriers` (include webhook_secret and api_key for those that support polling).
6. For carriers that support webhooks, register webhook URL:
   `https://<your-backend-host>/webhook/carrier?carrier_id=<carrier_uuid>`

## Notes
- This starter stores a placeholder DATABASE_URL in `backend/.env.example`. Do NOT commit real secrets; instead set them in Render's environment variables.
- The poller runs every 10 minutes and will call `carrier.api_base_url` endpoints—adapt poller to each carrier's API format.
- Add authentication, RBAC, and encryption before using with real client data.
