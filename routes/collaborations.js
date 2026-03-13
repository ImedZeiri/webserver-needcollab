const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/collaborations:
 *   get:
 *     summary: Récupérer toutes les collaborations
 *     responses:
 *       200:
 *         description: Liste des collaborations
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('collaborations', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/collaborations:
 *   post:
 *     summary: Créer une nouvelle collaboration
 *     responses:
 *       201:
 *         description: Collaboration créée
 */
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('collaborations', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/collaborations:
 *   put:
 *     summary: Mettre à jour une collaboration
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Collaboration mise à jour
 */
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('collaborations', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/collaborations:
 *   delete:
 *     summary: Supprimer une collaboration
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Collaboration supprimée
 */
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('collaborations', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
