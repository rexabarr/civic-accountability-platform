import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './utils/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import authRouter from './routes/auth.js';
import geocodingRouter from './routes/geocoding.js';
import complaintsRouter from './routes/complaints.js';
import leaderboardRouter from './routes/leaderboard.js';
import staffRouter from './routes/staff.js';
import adminRouter from './routes/admin.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api', geocodingRouter);
app.use('/api', complaintsRouter);
app.use('/api', leaderboardRouter);
app.use('/api', staffRouter);
app.use('/api/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
});

export default app;
