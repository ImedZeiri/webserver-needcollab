const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/votes:
 *   get:
 *     summary: Récupérer tous les votes
 *     responses:
 *       200:
 *         description: Liste des votes
 */
router.get('/', (req, res) => {
  res.json({ message: 'GET votes' });
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
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST votes' });
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
router.put('/', (req, res) => {
  res.json({ message: 'PUT votes', id: req.query.id });
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
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE votes', id: req.query.id });
});

module.exports = router;
