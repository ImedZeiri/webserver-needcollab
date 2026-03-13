const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
