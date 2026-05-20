import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    me(user: AuthenticatedUser): Promise<import("../common/types/public-user.type").PublicUser>;
    updateMe(user: AuthenticatedUser, dto: UpdateMeDto): Promise<import("../common/types/public-user.type").PublicUser>;
    changePassword(user: AuthenticatedUser, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
}
