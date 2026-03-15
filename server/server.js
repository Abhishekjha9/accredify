const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const userRoutes = require('./routes/userRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// --------------- Middleware ---------------
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --------------- Routes ---------------
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Accredify API is running',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);

// --------------- 404 Handler ---------------
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// --------------- Error Handler ---------------
app.use(errorHandler);

// --------------- Database & Server Start ---------------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/accredify';

const startServer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅  MongoDB connected`);

        app.listen(PORT, () => {
            console.log(`🚀  Accredify API running on port ${PORT}`);
            console.log(`📡  Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌  Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();

module.exports = app;
