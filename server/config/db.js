require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // nécessaire pour se connecter à Render depuis l'extérieur
  }
});

pool.on('connect', () => {
  console.log('✅ Connecté à la base PostgreSQL (Render)');
});

pool.on('error', (err) => {
  console.error('❌ Erreur inattendue sur le client PostgreSQL', err);
});

module.exports = pool;