import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';
import tradesRouter from './routes/trades';
import setupsRouter from './routes/setups';
import tagsRouter from './routes/tags';
import riskRouter from './routes/risk';
import reportsRouter from './routes/reports';
import exportRouter from './routes/export';
import accountsRouter from './routes/accounts';
import { authenticate } from './middleware/auth';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);

app.use(authenticate);
app.use('/trades', tradesRouter);
app.use('/setups', setupsRouter);
app.use('/tags', tagsRouter);
app.use('/risk', riskRouter);
app.use('/reports', reportsRouter);
app.use('/export', exportRouter);
app.use('/accounts', accountsRouter);

export default app;
