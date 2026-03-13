const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Récupérer toutes les notifications
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('notifications', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Créer une nouvelle notification
 *     responses:
 *       201:
 *         description: Notification créée
 */
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('notifications', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/notifications:
 *   put:
 *     summary: Mettre à jour une notification
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification mise à jour
 */
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('notifications', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     summary: Supprimer une notification
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification supprimée
 */
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('notifications', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
