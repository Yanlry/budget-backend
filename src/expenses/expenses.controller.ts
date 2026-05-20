import { Controller, Get, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';

@Controller('api/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('label-suggestions')
  getLabelSuggestions(
    @Query('query') query?: string,
    @Query('type') type?: string,
  ) {
    return this.expensesService.getLabelSuggestions(query, type);
  }
}
