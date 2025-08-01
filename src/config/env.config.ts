export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  mongodb: process.env.MONGODB,
  port: process.env.PORT || 3000,
  defaultLimit: +process.env.DEFAULT_LIMIT!,
  keycloakBaseUrl: process.env.KEYCLOAK_BASE_URL,
  keycloakRealm: process.env.KEYCLOAK_REALM,
  keycloakClientID: process.env.KEYCLOAK_CLIENT_ID,
  keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
});
