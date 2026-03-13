const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Prefer, apikey, x-client-info');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/needs', require('./routes/needs'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api/profiles', require('./routes/profiles'));
app.use('/api/collaborations', require('./routes/collaborations'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/votes', require('./routes/votes'));
app.use('/api', require('./routes/auth'));
app.use('/api', require('./routes/utils'));

app.get('/', (req, res) => {
  res.json({ message: 'Server is running', docs: '/api-docs' });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'NeedCollab API',
    version: '1.0.0',
    docs: '/api-docs',
    endpoints: {
      needs: '/api/needs',
      offers: '/api/offers',
      profiles: '/api/profiles',
      collaborations: '/api/collaborations',
      messages: '/api/messages',
      notifications: '/api/notifications',
      votes: '/api/votes',
      auth: ['/api/send-auth-email', '/api/otp_codes']
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

module.exports = app;
