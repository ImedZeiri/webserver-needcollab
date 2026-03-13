const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Récupérer toutes les notifications
 *     responses:
 *       200:
 *         description: Liste des notifications
 */
router.get('/', (req, res) => {
  res.json({ message: 'GET notifications' });
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
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST notifications' });
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
router.put('/', (req, res) => {
  res.json({ message: 'PUT notifications', id: req.query.id });
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
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE notifications', id: req.query.id });
});

module.exports = router;
