import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TemporalService } from './temporal.service';
import { LeadsService } from './leads.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, TemporalService, LeadsService],
})
export class AppModule {}
