const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/votes:
 *   get:
 *     summary: Récupérer tous les votes
 *     responses:
 *       200:
 *         description: Liste des votes
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('votes', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/votes:
 *   post:
 *     summary: Créer un nouveau vote
 *     responses:
 *       201:
 *         description: Vote créé
 */
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('votes', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/votes:
 *   put:
 *     summary: Mettre à jour un vote
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vote mis à jour
 */
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('votes', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/votes:
 *   delete:
 *     summary: Supprimer un vote
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vote supprimé
 */
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('votes', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
