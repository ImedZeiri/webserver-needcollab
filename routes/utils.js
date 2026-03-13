const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/send-notification-email:
 *   post:
 *     summary: Envoyer un email de notification
 *     responses:
 *       200:
 *         description: Email envoyé
 */
router.post('/send-notification-email', (req, res) => {
  res.json({ message: 'POST send-notification-email' });
});

/**
 * @swagger
 * /api/geocode:
 *   post:
 *     summary: Géocoder une adresse
 *     responses:
 *       200:
 *         description: Coordonnées géographiques
 */
router.post('/geocode', (req, res) => {
  res.json({ message: 'POST geocode' });
});

/**
 * @swagger
 * /api/mapbox-token:
 *   get:
 *     summary: Récupérer le token Mapbox
 *     responses:
 *       200:
 *         description: Token Mapbox
 */
router.get('/mapbox-token', (req, res) => {
  res.json({ message: 'GET mapbox-token' });
});

/**
 * @swagger
 * /api/user_roles:
 *   get:
 *     summary: Récupérer les rôles utilisateur
 *     responses:
 *       200:
 *         description: Liste des rôles
 */
router.get('/user_roles', (req, res) => {
  res.json({ message: 'GET user_roles' });
});

/**
 * @swagger
 * /api/user_roles:
 *   post:
 *     summary: Créer un rôle utilisateur
 *     responses:
 *       201:
 *         description: Rôle créé
 */
router.post('/user_roles', (req, res) => {
  res.status(201).json({ message: 'POST user_roles' });
});

/**
 * @swagger
 * /api/backup-runner:
 *   post:
 *     summary: Lancer une sauvegarde
 *     responses:
 *       200:
 *         description: Sauvegarde lancée
 */
router.post('/backup-runner', (req, res) => {
  res.json({ message: 'POST backup-runner' });
});

/**
 * @swagger
 * /api/generate-mock-users:
 *   get:
 *     summary: Générer des utilisateurs de test
 *     parameters:
 *       - in: query
 *         name: secret
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Utilisateurs générés
 */
router.get('/generate-mock-users', (req, res) => {
  res.json({ message: 'GET generate-mock-users', secret: req.query.secret });
});

/**
 * @swagger
 * /api/og-need:
 *   get:
 *     summary: Récupérer les métadonnées Open Graph d'un besoin
 *     parameters:
 *       - in: query
 *         name: needId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Métadonnées Open Graph
 */
router.get('/og-need', (req, res) => {
  res.json({ message: 'GET og-need', needId: req.query.needId });
});

module.exports = router;
