const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/needs:
 *   get:
 *     summary: Récupérer tous les besoins ou un besoin spécifique
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Liste des besoins
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('needs', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/needs:
 *   post:
 *     summary: Créer un nouveau besoin
 *     responses:
 *       201:
 *         description: Besoin créé
 */
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('needs', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/needs:
 *   put:
 *     summary: Mettre à jour un besoin
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Besoin mis à jour
 */
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('needs', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/needs:
 *   delete:
 *     summary: Supprimer un besoin
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Besoin supprimé
 */
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('needs', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
