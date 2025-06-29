import { Module } from '@nestjs/common';
import { TicketsService } from './services/tickets.service';
import { TicketsController } from './controllers/tickets.controller';
import { StripeModule } from '../stripe/stripe.module';
import { TicketsHistoryService } from './services/tickets-history.service';
import { TicketsHistoryController } from './controllers/tickets-history.controller';

@Module({
  imports: [StripeModule],
  controllers: [TicketsController, TicketsHistoryController],
  providers: [TicketsService, TicketsHistoryService],
})
export class TicketsModule {}
