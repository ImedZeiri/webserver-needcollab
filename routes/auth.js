const express = require('express');
const router = express.Router();
const { callEdgeFunction } = require('./supabaseClient');

/**
 * @swagger
 * /api/send-auth-email:
 *   post:
 *     summary: Envoyer un email d'authentification
 *     responses:
 *       200:
 *         description: Email envoyé
 */
router.post('/send-auth-email', async (req, res) => {
  const { data, status } = await callEdgeFunction('send-auth-email', 'POST', req.body);
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/otp_codes:
 *   get:
 *     summary: Récupérer les codes OTP
 *     responses:
 *       200:
 *         description: Liste des codes OTP
 */
router.get('/otp_codes', async (req, res) => {
  const { data, status } = await callEdgeFunction('otp_codes', 'GET', null, { id: req.query.id });
  res.status(status).json(data);
});

/**
 * @swagger
 * /api/otp_codes:
 *   post:
 *     summary: Créer un code OTP
 *     responses:
 *       201:
 *         description: Code OTP créé
 */
router.post('/otp_codes', async (req, res) => {
  const { data, status } = await callEdgeFunction('otp_codes', 'POST', req.body);
  res.status(status).json(data);
});

module.exports = router;
