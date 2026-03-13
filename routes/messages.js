const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Récupérer tous les messages
 *     responses:
 *       200:
 *         description: Liste des messages
 */
router.get('/', (req, res) => {
  res.json({ message: 'GET messages' });
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
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST messages' });
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
router.put('/', (req, res) => {
  res.json({ message: 'PUT messages', id: req.query.id });
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
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE messages', id: req.query.id });
});

module.exports = router;
