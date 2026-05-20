import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { GetMonthProjectionDto } from './dto/get-month-projection.dto';
import { GetYearProjectionDto } from './dto/get-year-projection.dto';
import { ProjectionsService } from './projections.service';

@Controller('projections')
export class ProjectionsController {
  constructor(private readonly projectionsService: ProjectionsService) {}

  @Get('year')
  getYearProjection(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetYearProjectionDto,
  ) {
    const year = query.year ?? new Date().getFullYear();
    return this.projectionsService.getYearProjection(
      user.userId,
      year,
      query.accountId,
    );
  }

  @Get('month')
  getMonthProjection(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GetMonthProjectionDto,
  ) {
    const currentDate = new Date();
    const year = query.year ?? currentDate.getFullYear();
    const month = query.month ?? currentDate.getMonth() + 1;
    return this.projectionsService.getMonthProjection(
      user.userId,
      year,
      month,
      query.accountId,
    );
  }
}
