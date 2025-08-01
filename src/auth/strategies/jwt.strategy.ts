import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(private configService: ConfigService) {
//     super({
//       secretOrKeyProvider: passportJwtSecret({
//         cache: true,
//         rateLimit: true,
//         jwksRequestsPerMinute: 5,
//         jwksUri: `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
//       }),
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       audience: 'account', // Importante: usar 'account' como audience
//       issuer: `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}`,
//       algorithms: ['RS256'],
//     });
//   }

//   async validate(payload: any) {
//     console.log('JWT Payload recibido:', payload); // Para debug

//     if (!payload.sub) {
//       throw new UnauthorizedException('Invalid token payload');
//     }

//     return {
//       userId: payload.sub,
//       username: payload.preferred_username,
//       email: payload.email,
//       firstName: payload.given_name,
//       lastName: payload.family_name,
//       roles: payload.resource_access?.organigrama?.roles || [],
//       realmRoles: payload.realm_access?.roles || [],
//       fullPayload: payload,
//     };
//   }
// }
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    console.log('🔥 JWT STRATEGY CONSTRUCTOR EJECUTADO');
    console.log(
      '🔥 JWKS URI:',
      `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
    );

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}/protocol/openid-connect/certs`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: 'account',
      issuer: `${configService.get<string>('KEYCLOAK_BASE_URL')}/realms/${configService.get<string>('KEYCLOAK_REALM')}`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: any) {
    console.log('🔥 JWT VALIDATE EJECUTADO:', payload);
    // console.log('JWT Payload recibido:', payload); // Para debug

    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      userId: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
      roles: payload.resource_access?.organigrama?.roles || [],
      realmRoles: payload.realm_access?.roles || [],
      fullPayload: payload,
    };
  }
}
