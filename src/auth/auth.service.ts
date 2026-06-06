import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { createRemoteJWKSet, JWTPayload, jwtVerify } from 'jose';
import { AccountsService } from '../accounts/accounts.service';
import { serializeUser } from '../common/types/serializers';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginAppleDto } from './dto/login-apple.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS = createRemoteJWKSet(
  new URL('https://appleid.apple.com/auth/keys'),
);

interface AppleIdentityTokenPayload extends JWTPayload {
  sub: string;
  email?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Un compte existe deja avec cet email.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      currentBalance: dto.currentBalance,
      goalAmount: dto.goalAmount,
    });

    await this.accountsService.ensureDefaultAccount(
      user.id,
      Number(user.currentBalance),
    );
    await this.categoriesService.createDefaultCategoriesForUser(user.id);

    return {
      accessToken: await this.signToken(user.id, user.email),
      user: serializeUser(user),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    return {
      accessToken: await this.signToken(user.id, user.email),
      user: serializeUser(user),
    };
  }

  async loginWithApple(dto: LoginAppleDto) {
    const appleTokenPayload = await this.verifyAppleIdentityToken(
      dto.identityToken,
    );
    const appleUserId = appleTokenPayload.sub;

    let user = await this.usersService.findByAppleUserId(appleUserId);
    const tokenEmail =
      typeof appleTokenPayload.email === 'string'
        ? appleTokenPayload.email.trim().toLowerCase()
        : undefined;
    const fallbackEmail = dto.email?.trim().toLowerCase();
    const candidateEmail = tokenEmail || fallbackEmail;

    if (!user && candidateEmail) {
      const existingByEmail = await this.usersService.findByEmail(candidateEmail);
      if (existingByEmail) {
        if (
          existingByEmail.appleUserId &&
          existingByEmail.appleUserId !== appleUserId
        ) {
          throw new ConflictException(
            'Ce compte est deja lie a un autre identifiant Apple.',
          );
        }

        user = await this.usersService.updateById(existingByEmail.id, {
          appleUserId,
        });
      }
    }

    if (!user) {
      const syntheticEmail = `apple_${appleUserId}@relay.wallety.local`;
      const generatedPasswordHash = await bcrypt.hash(
        `apple:${appleUserId}:${Date.now()}`,
        10,
      );

      user = await this.usersService.create({
        email: candidateEmail || syntheticEmail,
        passwordHash: generatedPasswordHash,
        name: dto.fullName,
        appleUserId,
      });

      await this.accountsService.ensureDefaultAccount(
        user.id,
        Number(user.currentBalance),
      );
      await this.categoriesService.createDefaultCategoriesForUser(user.id);
    }

    return {
      accessToken: await this.signToken(user.id, user.email),
      user: serializeUser(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    return serializeUser(user);
  }

  async exportData(userId: string) {
    const data = await this.usersService.exportDataById(userId);

    if (!data) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    return {
      generatedAt: new Date().toISOString(),
      data,
    };
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    await this.usersService.updateById(userId, {
      name: dto.name,
      goalAmount: dto.goalAmount,
    });

    if (dto.currentBalance !== undefined) {
      await this.accountsService.setDefaultAccountBalance(
        userId,
        dto.currentBalance,
      );
    }

    const refreshed = await this.usersService.findById(userId);

    if (!refreshed) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    return serializeUser(refreshed);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }

    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new ConflictException(
        'Le nouveau mot de passe doit etre different de l ancien.',
      );
    }

    const nextPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePasswordHashById(userId, nextPasswordHash);

    return { success: true };
  }

  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    await this.usersService.setPushTokenById(userId, dto.token);
    return { success: true };
  }

  async deleteAccount(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    await this.usersService.deleteById(userId);
    return { success: true };
  }

  private async verifyAppleIdentityToken(identityToken: string) {
    const clientIdsRaw =
      this.configService.get<string>('APPLE_CLIENT_IDS') ||
      this.configService.get<string>('APPLE_CLIENT_ID');

    const audiences = (clientIdsRaw ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    if (!audiences.length) {
      throw new UnauthorizedException(
        'Connexion Apple indisponible: APPLE_CLIENT_ID(S) manquant.',
      );
    }

    try {
      const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
        issuer: APPLE_ISSUER,
        audience: audiences.length === 1 ? audiences[0] : audiences,
      });

      if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new UnauthorizedException('Identifiant Apple invalide.');
      }

      return payload as AppleIdentityTokenPayload;
    } catch (_error) {
      throw new UnauthorizedException('Token Apple invalide.');
    }
  }

  private signToken(userId: string, email: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }
}
