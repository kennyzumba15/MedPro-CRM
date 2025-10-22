require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const cron = require('node-cron');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function pollCarrier(carrier) {
  const policies = await pool.query('SELECT * FROM policies WHERE carrier_id=$1', [carrier.id]);
  for (const p of policies.rows) {
    try {
      const url = `${carrier.api_base_url}/policies/${encodeURIComponent(p.carrier_policy_id)}/status`;
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${carrier.api_key}` }, timeout: 15000 });
      const new_status = resp.data.status;
      if (new_status && new_status !== p.current_status) {
        await pool.query('UPDATE policies SET current_status=$1, updated_at=now() WHERE id=$2', [new_status, p.id]);
        await pool.query('INSERT INTO policy_status_history (policy_id, old_status, new_status, source, payload) VALUES ($1,$2,$3,$4,$5)', [p.id, p.current_status, new_status, 'poll', resp.data]);
        console.log(`Updated ${p.id} -> ${new_status}`);
      }
    } catch (err) {
      console.error('poll error for', p.id, err.message);
    }
  }
}

async function run() {
  const carriers = await pool.query('SELECT * FROM carriers');
  for (const c of carriers.rows) {
    if (c.api_base_url && c.api_key) await pollCarrier(c);
  }
}

cron.schedule('*/10 * * * *', () => {
  console.log('Poller starting at', new Date());
  run();
});

run();
