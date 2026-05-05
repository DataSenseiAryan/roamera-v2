const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Serve built frontend in production
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Health check — Render pings this to keep the service alive
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/journals', require('./routes/journals'));
app.use('/api', require('./routes/social'));
app.use('/api/users', require('./routes/users'));
app.use('/api/search', require('./routes/search'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/hotels', require('./routes/hotels'));
app.use('/api/flights', require('./routes/flights'));
app.use('/api/meetways', require('./routes/meetways'));
app.use('/api/ai-planner', require('./routes/aiPlanner'));
app.use('/api/journals/:journalId/budget', require('./routes/budget'));
app.use('/api/journals/:journalId/packing', require('./routes/packing'));
app.use('/api/justsplit', require('./routes/justsplit'));

// All other routes → serve React app (client-side routing)
app.get('/*path', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
