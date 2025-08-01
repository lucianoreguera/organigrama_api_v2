import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(private configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('KEYCLOAK_CLIENT_ID'),
      issuer: `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      // Roles del cliente 'organigrama' (ajusta según tu client_id)
      roles: payload.resource_access?.organigrama?.roles || [],
      // También incluir roles del realm
      realmRoles: payload.realm_access?.roles || [],
      // Información adicional
      emailVerified: payload.email_verified,
      fullPayload: payload, // Por si necesitas acceder a todo
    };
  }
}
