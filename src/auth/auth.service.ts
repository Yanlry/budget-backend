import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AccountsService } from '../accounts/accounts.service';
import { serializeUser } from '../common/types/serializers';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly categoriesService: CategoriesService,
    private readonly accountsService: AccountsService,
    private readonly jwtService: JwtService,
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

  async me(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur introuvable.');
    }

    return serializeUser(user);
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

  private signToken(userId: string, email: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
    });
  }
}
