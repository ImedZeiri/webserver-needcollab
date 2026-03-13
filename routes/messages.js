const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Récupérer tous les messages
 *     responses:
 *       200:
 *         description: Liste des messages
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('messages', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Créer un nouveau message
 *     responses:
 *       201:
 *         description: Message créé
 */
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('messages', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/messages:
 *   put:
 *     summary: Mettre à jour un message
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message mis à jour
 */
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('messages', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/messages:
 *   delete:
 *     summary: Supprimer un message
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message supprimé
 */
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('messages', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
