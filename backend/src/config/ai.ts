
import OpenAI from 'openai';
import { env } from './env.js';

export function createAIClient(): OpenAI {
  if (env.AI_PROVIDER === 'openai') {
    if (!env.OPENAI_API_KEY?.trim()) {
      throw new Error(
        'OPENAI_API_KEY não configurada'
      );
    }

    return new OpenAI({
      apiKey: env.OPENAI_API_KEY
    });
  }

  if (env.AI_PROVIDER === 'openrouter') {
    if (!env.OPENROUTER_API_KEY?.trim()) {
      throw new Error(
        'OPENROUTER_API_KEY não configurada'
      );
    }

    return new OpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    });
  }

  throw new Error('Provedor de IA não suportado');
}

export function getAIModel(): string {
  return env.AI_PROVIDER === 'openai'
    ? env.OPENAI_MODEL
    : env.OPENROUTER_MODEL;
}
