import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { ProjectionsController } from './projections.controller';
import { ProjectionsService } from './projections.service';

@Module({
  imports: [AccountsModule],
  controllers: [ProjectionsController],
  providers: [ProjectionsService],
})
export class ProjectionsModule {}
