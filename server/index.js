require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { errorHandler } = require('./src/middleware/errorHandler');
const { initDb } = require('./scripts/initDb');

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth',      require('./src/routes/auth'));
app.use('/api/projects',  require('./src/routes/projects'));
app.use('/api/tasks',     require('./src/routes/tasks'));
app.use('/api/dashboard', require('./src/routes/dashboard'));

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'taskforge-api' }));
app.get('/',       (req, res) => res.json({ message: 'TaskForge API is running', docs: '/health' }));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await initDb();
  } catch (err) {
    console.error('❌ Database initialization failed. Aborting startup.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`TaskForge API running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
})();
