const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/send-auth-email:
 *   post:
 *     summary: Envoyer un email d'authentification
 *     responses:
 *       200:
 *         description: Email envoyé
 */
router.post('/send-auth-email', (req, res) => {
  res.json({ message: 'POST send-auth-email' });
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
router.get('/otp_codes', (req, res) => {
  res.json({ message: 'GET otp_codes' });
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
router.post('/otp_codes', (req, res) => {
  res.status(201).json({ message: 'POST otp_codes' });
});

module.exports = router;
