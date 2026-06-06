"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BankingController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const banking_service_1 = require("./banking.service");
const create_link_token_dto_1 = require("./dto/create-link-token.dto");
const exchange_public_token_dto_1 = require("./dto/exchange-public-token.dto");
const finalize_link_token_dto_1 = require("./dto/finalize-link-token.dto");
let BankingController = class BankingController {
    bankingService;
    constructor(bankingService) {
        this.bankingService = bankingService;
    }
    getConnections(user) {
        return this.bankingService.getConnectionsForUser(user.userId);
    }
    createLinkToken(user, dto) {
        return this.bankingService.createLinkTokenForUser(user.userId, dto);
    }
    exchangePublicToken(user, dto) {
        return this.bankingService.exchangePublicTokenForUser(user.userId, dto);
    }
    finalizeLinkToken(user, dto) {
        return this.bankingService.finalizeLinkTokenForUser(user.userId, dto);
    }
    syncConnection(user, id) {
        return this.bankingService.syncConnectionForUser(user.userId, id);
    }
    getRecurringAnalysis(user) {
        return this.bankingService.getRecurringAnalysisForUser(user.userId);
    }
    disconnectConnection(user, id) {
        return this.bankingService.disconnectConnectionForUser(user.userId, id);
    }
};
exports.BankingController = BankingController;
__decorate([
    (0, common_1.Get)('connections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Post)('link-token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_link_token_dto_1.CreateLinkTokenDto]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "createLinkToken", null);
__decorate([
    (0, common_1.Post)('exchange-public-token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, exchange_public_token_dto_1.ExchangePublicTokenDto]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "exchangePublicToken", null);
__decorate([
    (0, common_1.Post)('finalize-link-token'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finalize_link_token_dto_1.FinalizeLinkTokenDto]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "finalizeLinkToken", null);
__decorate([
    (0, common_1.Post)('connections/:id/sync'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "syncConnection", null);
__decorate([
    (0, common_1.Get)('recurring-analysis'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "getRecurringAnalysis", null);
__decorate([
    (0, common_1.Delete)('connections/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BankingController.prototype, "disconnectConnection", null);
exports.BankingController = BankingController = __decorate([
    (0, common_1.Controller)('banking'),
    __metadata("design:paramtypes", [banking_service_1.BankingService])
], BankingController);
//# sourceMappingURL=banking.controller.js.map