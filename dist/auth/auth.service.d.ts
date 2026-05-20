import { JwtService } from '@nestjs/jwt';
import { AccountsService } from '../accounts/accounts.service';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateMeDto } from './dto/update-me.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly categoriesService;
    private readonly accountsService;
    private readonly jwtService;
    constructor(usersService: UsersService, categoriesService: CategoriesService, accountsService: AccountsService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: import("../common/types/public-user.type").PublicUser;
    }>;
    me(userId: string): Promise<import("../common/types/public-user.type").PublicUser>;
    updateMe(userId: string, dto: UpdateMeDto): Promise<import("../common/types/public-user.type").PublicUser>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        success: boolean;
    }>;
    private signToken;
}
