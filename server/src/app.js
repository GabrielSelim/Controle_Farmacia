import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import shiftsRoutes from './routes/shifts.js';
import medsRoutes from './routes/meds.js';
import recordsRoutes from './routes/records.js';
import notifyRoutes from './routes/notify.js';
import absencesRoutes from './routes/absences.js';
import swapsRoutes from './routes/swaps.js';
import activityRoutes from './routes/activity.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/meds', medsRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/absences', absencesRoutes);
app.use('/api/swaps', swapsRoutes);
app.use('/api/activity', activityRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

export default app;
