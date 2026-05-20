"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const accounts_service_1 = require("../accounts/accounts.service");
const serializers_1 = require("../common/types/serializers");
const categories_service_1 = require("../categories/categories.service");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    usersService;
    categoriesService;
    accountsService;
    jwtService;
    constructor(usersService, categoriesService, accountsService, jwtService) {
        this.usersService = usersService;
        this.categoriesService = categoriesService;
        this.accountsService = accountsService;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException('Un compte existe deja avec cet email.');
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const user = await this.usersService.create({
            email: dto.email,
            passwordHash,
            name: dto.name,
            currentBalance: dto.currentBalance,
            goalAmount: dto.goalAmount,
        });
        await this.accountsService.ensureDefaultAccount(user.id, Number(user.currentBalance));
        await this.categoriesService.createDefaultCategoriesForUser(user.id);
        return {
            accessToken: await this.signToken(user.id, user.email),
            user: (0, serializers_1.serializeUser)(user),
        };
    }
    async login(dto) {
        const user = await this.usersService.findByEmail(dto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Identifiants invalides.');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Identifiants invalides.');
        }
        return {
            accessToken: await this.signToken(user.id, user.email),
            user: (0, serializers_1.serializeUser)(user),
        };
    }
    async me(userId) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur introuvable.');
        }
        return (0, serializers_1.serializeUser)(user);
    }
    async updateMe(userId, dto) {
        await this.usersService.updateById(userId, {
            name: dto.name,
            goalAmount: dto.goalAmount,
        });
        if (dto.currentBalance !== undefined) {
            await this.accountsService.setDefaultAccountBalance(userId, dto.currentBalance);
        }
        const refreshed = await this.usersService.findById(userId);
        if (!refreshed) {
            throw new common_1.UnauthorizedException('Utilisateur introuvable.');
        }
        return (0, serializers_1.serializeUser)(refreshed);
    }
    async changePassword(userId, dto) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException('Utilisateur introuvable.');
        }
        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isCurrentPasswordValid) {
            throw new common_1.UnauthorizedException('Mot de passe actuel incorrect.');
        }
        const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new common_1.ConflictException('Le nouveau mot de passe doit etre different de l ancien.');
        }
        const nextPasswordHash = await bcrypt.hash(dto.newPassword, 10);
        await this.usersService.updatePasswordHashById(userId, nextPasswordHash);
        return { success: true };
    }
    signToken(userId, email) {
        return this.jwtService.signAsync({
            sub: userId,
            email,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        categories_service_1.CategoriesService,
        accounts_service_1.AccountsService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map