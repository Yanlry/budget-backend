import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { GetMonthProjectionDto } from './dto/get-month-projection.dto';
import { GetYearProjectionDto } from './dto/get-year-projection.dto';
import { ProjectionsService } from './projections.service';
export declare class ProjectionsController {
    private readonly projectionsService;
    constructor(projectionsService: ProjectionsService);
    getYearProjection(user: AuthenticatedUser, query: GetYearProjectionDto): Promise<{
        year: number;
        currentBalance: number;
        estimatedYearEndBalance: number;
        months: import("./projections.service").MonthProjection[];
        summary: string;
        fixedExpenseRatio: number | null;
        yearlyPotentialSavings: number;
    }>;
    getMonthProjection(user: AuthenticatedUser, query: GetMonthProjectionDto): Promise<{
        summary: string;
        year: number;
        month: number;
        label: string;
        startingBalance: number;
        expectedIncome: number;
        expectedExpenses: number;
        endingBalance: number;
    }>;
}
