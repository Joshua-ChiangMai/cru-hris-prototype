import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleCode, UserStatus } from '@prisma/client';
import { compare } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { PermissionsService } from './permissions.service';
import {
  AuthTokensResponse,
  JwtAccessPayload,
  JwtRefreshPayload,
  SessionResponse,
} from './auth.types';

@Injectable()
export class AuthService {
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly permissionsService: PermissionsService,
  ) {
    this.accessTtlSeconds = Number(
      this.configService.get<string>('JWT_ACCESS_TTL_SECONDS', '900'),
    );
    this.refreshTtlSeconds = Number(
      this.configService.get<string>('JWT_REFRESH_TTL_SECONDS', '604800'),
    );
  }

  async login(payload: LoginDto): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: payload.email.toLowerCase().trim(),
        deletedAt: null,
      },
      include: {
        userRoles: {
          where: {
            revokedAt: null,
            OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
          },
          include: { role: true },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await compare(payload.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.userRoles);

    return {
      ...tokens,
      tokenType: 'Bearer',
      expiresIn: this.accessTtlSeconds,
    };
  }

  async refreshToken(
    payload: RefreshTokenDto,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const decoded = await this.jwtService.verifyAsync<JwtRefreshPayload>(
      payload.refreshToken,
    );

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: decoded.sub, deletedAt: null, status: UserStatus.ACTIVE },
      include: {
        userRoles: {
          where: {
            revokedAt: null,
            OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
          },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessPayload = this.buildAccessPayload(
      user.id,
      user.email,
      user.userRoles,
    );
    const accessToken = await this.jwtService.signAsync(accessPayload, {
      expiresIn: this.accessTtlSeconds,
    });

    return {
      accessToken,
      expiresIn: this.accessTtlSeconds,
    };
  }

  async getSession(userId: string): Promise<SessionResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, status: UserStatus.ACTIVE },
      include: {
        userRoles: {
          where: {
            revokedAt: null,
            OR: [{ validTo: null }, { validTo: { gt: new Date() } }],
          },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roleCodes = this.extractRoleCodes(user.userRoles);
    const cityIds = this.extractCityIds(user.userRoles);

    return {
      userId: user.id,
      email: user.email,
      roleCodes,
      permissions: this.permissionsService.resolveForRoles(roleCodes),
      cityIds,
      scopeLevel: this.permissionsService.resolveScopeLevel(roleCodes),
    };
  }

  private async issueTokens(
    userId: string,
    email: string,
    userRoles: Array<{
      role: { code: RoleCode };
      cityId: string | null;
    }>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessPayload = this.buildAccessPayload(userId, email, userRoles);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.accessTtlSeconds,
      }),
      this.jwtService.signAsync(
        { sub: userId, type: 'refresh' } satisfies JwtRefreshPayload,
        { expiresIn: this.refreshTtlSeconds },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private buildAccessPayload(
    userId: string,
    email: string,
    userRoles: Array<{
      role: { code: RoleCode };
      cityId: string | null;
    }>,
  ): JwtAccessPayload {
    const roleCodes = this.extractRoleCodes(userRoles);
    const cityIds = this.extractCityIds(userRoles);

    return {
      sub: userId,
      email,
      roles: roleCodes,
      permissions: this.permissionsService.resolveForRoles(roleCodes),
      cityIds,
      scopeLevel: this.permissionsService.resolveScopeLevel(roleCodes),
    };
  }

  private extractRoleCodes(
    userRoles: Array<{ role: { code: RoleCode } }>,
  ): RoleCode[] {
    return [...new Set(userRoles.map((assignment) => assignment.role.code))];
  }

  private extractCityIds(
    userRoles: Array<{ cityId: string | null }>,
  ): string[] {
    return [
      ...new Set(
        userRoles
          .map((assignment) => assignment.cityId)
          .filter((cityId): cityId is string => Boolean(cityId)),
      ),
    ];
  }
}
