const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/offers:
 *   get:
 *     summary: Récupérer toutes les offres
 *     responses:
 *       200:
 *         description: Liste des offres
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('offers', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/offers:
 *   post:
 *     summary: Créer une nouvelle offre
 *     responses:
 *       201:
 *         description: Offre créée
 */
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('offers', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/offers:
 *   put:
 *     summary: Mettre à jour une offre
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Offre mise à jour
 */
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('offers', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/offers:
 *   delete:
 *     summary: Supprimer une offre
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Offre supprimée
 */
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('offers', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
