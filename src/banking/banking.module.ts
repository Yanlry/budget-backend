import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { BankingController } from './banking.controller';
import { BankingService } from './banking.service';

@Module({
  imports: [AccountsModule],
  controllers: [BankingController],
  providers: [BankingService],
})
export class BankingModule {}
