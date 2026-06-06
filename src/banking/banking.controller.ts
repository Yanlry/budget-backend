import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { BankingService } from './banking.service';
import { CreateLinkTokenDto } from './dto/create-link-token.dto';
import { ExchangePublicTokenDto } from './dto/exchange-public-token.dto';
import { FinalizeLinkTokenDto } from './dto/finalize-link-token.dto';

@Controller('banking')
export class BankingController {
  constructor(private readonly bankingService: BankingService) {}

  @Get('connections')
  getConnections(@CurrentUser() user: AuthenticatedUser) {
    return this.bankingService.getConnectionsForUser(user.userId);
  }

  @Post('link-token')
  createLinkToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLinkTokenDto,
  ) {
    return this.bankingService.createLinkTokenForUser(user.userId, dto);
  }

  @Post('exchange-public-token')
  exchangePublicToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExchangePublicTokenDto,
  ) {
    return this.bankingService.exchangePublicTokenForUser(user.userId, dto);
  }

  @Post('finalize-link-token')
  finalizeLinkToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: FinalizeLinkTokenDto,
  ) {
    return this.bankingService.finalizeLinkTokenForUser(user.userId, dto);
  }

  @Post('connections/:id/sync')
  syncConnection(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.bankingService.syncConnectionForUser(user.userId, id);
  }

  @Get('recurring-analysis')
  getRecurringAnalysis(@CurrentUser() user: AuthenticatedUser) {
    return this.bankingService.getRecurringAnalysisForUser(user.userId);
  }

  @Delete('connections/:id')
  disconnectConnection(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.bankingService.disconnectConnectionForUser(user.userId, id);
  }
}
