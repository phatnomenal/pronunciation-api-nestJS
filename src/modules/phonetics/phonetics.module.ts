import { Module } from '@nestjs/common';
import { PhoneticsService } from './phonetics.service';

@Module({
  providers: [PhoneticsService],
  exports: [PhoneticsService],
})
export class PhoneticsModule {}