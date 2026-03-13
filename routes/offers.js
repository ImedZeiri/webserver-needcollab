const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/offers:
 *   get:
 *     summary: Récupérer toutes les offres
 *     responses:
 *       200:
 *         description: Liste des offres
 */
router.get('/', (req, res) => {
  res.json({ message: 'GET offers' });
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
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST offers' });
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
router.put('/', (req, res) => {
  res.json({ message: 'PUT offers', id: req.query.id });
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
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE offers', id: req.query.id });
});

module.exports = router;
