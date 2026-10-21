import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { productsRouter } from './routes/products.js';
import { chatRouter } from './routes/chat.js';
import { usersRouter } from './routes/users.js';

const app = express();

app.use(cors({ origin: env.CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/chat', chatRouter);
app.use('/users', usersRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) { 
    res.status(400).json({ error: 'Dados inválidos', details: error.flatten() }); 
    return; 
  }

  console.error(error);

  const message = error instanceof Error ? error.message : 'Erro interno';

  res.status(message === 'OPENAI_API_KEY não configurada' ? 503 : 500).json({ error: message === 'OPENAI_API_KEY não configurada' ? message : 'Erro interno do servidor' });
});

connectDatabase().then(() => app.listen(env.PORT, () => console.log(`API disponível em http://localhost:${env.PORT}`)))
  .catch((error) => { 
    console.error('Falha ao iniciar aplicação', error); process.exit(1); 
  });
