import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
  MONGODB: Joi.required(),
  PORT: Joi.number().default(3000),
  DEFAULT_LIMIT: Joi.number().default(10),
  NODE_ENV: Joi.string().valid('dev', 'test', 'prod').default('dev'),
  KEYCLOAK_BASE_URL: Joi.string(),
  KEYCLOAK_REALM: Joi.string(),
  KEYCLOAK_CLIENT_ID: Joi.string(),
  KEYCLOAK_CLIENT_SECRET: Joi.string(),
});
