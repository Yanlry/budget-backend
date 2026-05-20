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
exports.ProjectionsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const get_month_projection_dto_1 = require("./dto/get-month-projection.dto");
const get_year_projection_dto_1 = require("./dto/get-year-projection.dto");
const projections_service_1 = require("./projections.service");
let ProjectionsController = class ProjectionsController {
    projectionsService;
    constructor(projectionsService) {
        this.projectionsService = projectionsService;
    }
    getYearProjection(user, query) {
        const year = query.year ?? new Date().getFullYear();
        return this.projectionsService.getYearProjection(user.userId, year, query.accountId);
    }
    getMonthProjection(user, query) {
        const currentDate = new Date();
        const year = query.year ?? currentDate.getFullYear();
        const month = query.month ?? currentDate.getMonth() + 1;
        return this.projectionsService.getMonthProjection(user.userId, year, month, query.accountId);
    }
};
exports.ProjectionsController = ProjectionsController;
__decorate([
    (0, common_1.Get)('year'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_year_projection_dto_1.GetYearProjectionDto]),
    __metadata("design:returntype", void 0)
], ProjectionsController.prototype, "getYearProjection", null);
__decorate([
    (0, common_1.Get)('month'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, get_month_projection_dto_1.GetMonthProjectionDto]),
    __metadata("design:returntype", void 0)
], ProjectionsController.prototype, "getMonthProjection", null);
exports.ProjectionsController = ProjectionsController = __decorate([
    (0, common_1.Controller)('projections'),
    __metadata("design:paramtypes", [projections_service_1.ProjectionsService])
], ProjectionsController);
//# sourceMappingURL=projections.controller.js.map