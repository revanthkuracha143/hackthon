const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const projectRoutes = require('./routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// API Routes
app.use('/api/projects', projectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'API Doctor Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[UNHANDLED BACKEND ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🩺 API Doctor Backend running on port ${PORT}`);
    console.log(`=================================`);
  });
}

module.exports = app;
