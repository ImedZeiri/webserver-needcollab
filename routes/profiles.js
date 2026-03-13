const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/profiles:
 *   get:
 *     summary: Récupérer tous les profils
 *     responses:
 *       200:
 *         description: Liste des profils
 */
router.get('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('profiles', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
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
router.post('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('profiles', 'POST', req.body);
  res.status(status).json(data);
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
router.put('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('profiles', 'PUT', req.body, { id: req.query.id });
  res.status(status).json(data);
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
router.delete('/', async (req, res) => {
  const { data, status } = await callEdgeFunction('profiles', 'DELETE', null, { id: req.query.id });
  res.status(status).json(data);
});

module.exports = router;
