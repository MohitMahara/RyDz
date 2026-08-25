import dotenv from "dotenv";
import z from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number),
  DATABASE_URL: z.url(),
  REDIS_URL: z.url(),
  RECAPTCHA_SECRET: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  NODE_ENV: z.enum(["development", "production"]).default("development"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", z.treeifyError(parsedEnv.error));
  process.exit(1);
}

const env = parsedEnv.data;

export default env;