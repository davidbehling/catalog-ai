// import 'dotenv/config';
// import { z } from 'zod';
// 
// const schema = z.object({
//   PORT: z.coerce.number().default(3001),
//   MONGODB_URI: z.string().min(1),
//   JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
//   JWT_EXPIRES_IN: z.string().default('1d'),
//   OPENAI_API_KEY: z.string().optional(),
//   OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
//   CLIENT_ORIGIN: z.string().default('http://localhost:5173')
// });
// 
// export const env = schema.parse(process.env);



import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3001),

  MONGODB_URI: z.string().min(1),

  JWT_SECRET: z.string().min(
    32,
    'JWT_SECRET deve ter ao menos 32 caracteres'
  ),

  JWT_EXPIRES_IN: z.string().default('1d'),

  // Provedor de inteligência artificial selecionado.
  AI_PROVIDER: z.enum(['openai', 'openrouter']).default('openai'),

  // Credenciais dos provedores.
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // Modelos configuráveis por provedor.
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4.1-mini'),

  // Origem autorizada para chamadas do frontend.
  CLIENT_ORIGIN: z.string().default('http://localhost:5173')
});

export const env = schema.parse(process.env);

