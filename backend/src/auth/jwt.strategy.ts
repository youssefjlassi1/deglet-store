import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'dhaoui-super-secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersService.findByIdOrNull(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Session invalide.');
    }

    return {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };
  }
}