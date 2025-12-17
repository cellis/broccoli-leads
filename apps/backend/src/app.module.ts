import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TemporalService } from './temporal.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, TemporalService],
})
export class AppModule {}
