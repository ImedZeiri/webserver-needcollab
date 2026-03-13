const express = require('express');
const router = express.Router();

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
router.get('/', (req, res) => {
  res.json({ message: 'GET needs', id: req.query.id });
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
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST needs' });
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
router.put('/', (req, res) => {
  res.json({ message: 'PUT needs', id: req.query.id });
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
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE needs', id: req.query.id });
});

module.exports = router;
