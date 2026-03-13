const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/collaborations:
 *   get:
 *     summary: Récupérer toutes les collaborations
 *     responses:
 *       200:
 *         description: Liste des collaborations
 */
router.get('/', (req, res) => {
  res.json({ message: 'GET collaborations' });
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
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST collaborations' });
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
router.put('/', (req, res) => {
  res.json({ message: 'PUT collaborations', id: req.query.id });
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
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE collaborations', id: req.query.id });
});

module.exports = router;
