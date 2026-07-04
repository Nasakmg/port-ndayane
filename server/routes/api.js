const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// GET /api/zone → renvoie la zone (Port de Ndayane) en GeoJSON
router.get('/zone', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', jsonb_build_object('id', id, 'nom', nom)
          )
        )
      ) AS geojson
      FROM zone;
    `);
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la zone' });
  }
});

// GET /api/limites → renvoie les limites administratives en GeoJSON
router.get('/limites', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(
          jsonb_build_object(
            'type', 'Feature',
            'geometry', ST_AsGeoJSON(geom)::jsonb,
            'properties', jsonb_build_object('reg', reg)
          )
        )
      ) AS geojson
      FROM limites;
    `);
    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la récupération des limites' });
  }
});

module.exports = router;