const express = require('express');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const exceptionRoutes = require('./routes/exceptions.routes');
const approvalRoutes = require('./routes/approvals.routes');
const notificationRoutes = require('./routes/notifications.routes');
const reportRoutes = require('./routes/reports.routes');
const auditLogRoutes = require('./routes/auditLogs.routes');
const adminRoutes = require('./routes/admin.routes');
const lookupRoutes = require('./routes/lookups.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/exceptions', authMiddleware, exceptionRoutes);
app.use('/api/approvals', authMiddleware, approvalRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/audit-logs', authMiddleware, auditLogRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/lookups', authMiddleware, lookupRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Error handler must be last
app.use(errorHandler);

module.exports = app;
