require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = express();
app.use(express.json());

// SSE clients
const sseClients = new Set();
app.get('/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.write('\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
});
function broadcast(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(r => r.write(payload));
}

// Basic endpoints
app.post('/api/clients', async (req, res) => {
  const { first_name, last_name, email, phone, dob } = req.body;
  const r = await pool.query(`INSERT INTO clients (first_name,last_name,email,phone,dob) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [first_name, last_name, email, phone, dob]);
  res.json(r.rows[0]);
});

app.post('/api/carriers', async (req, res) => {
  const { name, api_base_url, webhook_secret, api_key } = req.body;
  const r = await pool.query(`INSERT INTO carriers (name, api_base_url, webhook_secret, api_key) VALUES ($1,$2,$3,$4) RETURNING *`, [name, api_base_url, webhook_secret, api_key]);
  res.json(r.rows[0]);
});

app.post('/api/policies', async (req, res) => {
  const { client_id, carrier_id, carrier_policy_id, plan_name, current_status, effective_date } = req.body;
  const r = await pool.query(`INSERT INTO policies (client_id, carrier_id, carrier_policy_id, plan_name, current_status, effective_date) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [client_id, carrier_id, carrier_policy_id, plan_name, current_status || 'submitted', effective_date]);
  res.json(r.rows[0]);
});

app.get('/api/policies', async (req, res) => {
  const r = await pool.query(`SELECT p.*, c.name as carrier_name, cl.first_name || ' ' || cl.last_name as client_name FROM policies p LEFT JOIN carriers c ON p.carrier_id=c.id LEFT JOIN clients cl ON p.client_id=cl.id ORDER BY p.updated_at DESC`);
  res.json(r.rows);
});

// Webhook handler: POST /webhook/carrier?carrier_id=<uuid>
app.post('/webhook/carrier', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const carrierId = req.query.carrier_id;
    if (!carrierId) return res.status(400).send('Missing carrier_id');

    const { rows } = await pool.query('SELECT webhook_secret FROM carriers WHERE id=$1', [carrierId]);
    if (rows.length === 0) return res.status(404).send('Unknown carrier');
    const secret = rows[0].webhook_secret || '';

    const sigHeader = (req.header('x-signature') || '').trim();
    const hmac = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
    if (!sigHeader || !crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(sigHeader))) return res.status(401).send('Invalid signature');

    const json = JSON.parse(req.body.toString('utf8'));
    const { carrier_policy_id, new_status, effective_date } = json;
    if (!carrier_policy_id || !new_status) return res.status(400).send('Missing fields');

    const pRes = await pool.query('SELECT * FROM policies WHERE carrier_policy_id=$1 AND carrier_id=$2', [carrier_policy_id, carrierId]);
    if (pRes.rows.length === 0) return res.status(404).send('Policy not found');
    const policy = pRes.rows[0];
    const oldStatus = policy.current_status;

    await pool.query('UPDATE policies SET current_status=$1, updated_at=now(), effective_date=$2 WHERE id=$3', [new_status, effective_date || policy.effective_date, policy.id]);

    await pool.query('INSERT INTO policy_status_history (policy_id, old_status, new_status, source, payload) VALUES ($1,$2,$3,$4,$5)', [policy.id, oldStatus, new_status, 'webhook', json]);

    broadcast('policy_update', { policy_id: policy.id, carrier_policy_id, oldStatus, new_status });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('server error');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MedPro CRM backend listening on ${PORT}`));
