import { z } from 'zod';

const envSchema = z.object({
  POSTGRES_URL: z.string().min(1, 'POSTGRES_URL is required'),
  BLOB_READ_WRITE_TOKEN: z.string().min(1, 'BLOB_READ_WRITE_TOKEN is required')
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse({
      POSTGRES_URL: process.env.POSTGRES_URL,
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN
    });
  }

  return cachedEnv;
}

