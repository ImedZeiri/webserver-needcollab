const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Récupérer tous les profils
 *     responses:
 *       200:
 *         description: Liste des profils
 */
router.get('/', (req, res) => {
  res.json({ message: 'GET profiles' });
});

/**
 * @swagger
 * /api/profiles:
 *   post:
 *     summary: Créer un nouveau profil
 *     responses:
 *       201:
 *         description: Profil créé
 */
router.post('/', (req, res) => {
  res.status(201).json({ message: 'POST profiles' });
});

/**
 * @swagger
 * /api/profiles:
 *   put:
 *     summary: Mettre à jour un profil
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Profil mis à jour
 */
router.put('/', (req, res) => {
  res.json({ message: 'PUT profiles', id: req.query.id });
});

/**
 * @swagger
 * /api/profiles:
 *   delete:
 *     summary: Supprimer un profil
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Profil supprimé
 */
router.delete('/', (req, res) => {
  res.json({ message: 'DELETE profiles', id: req.query.id });
});

module.exports = router;
