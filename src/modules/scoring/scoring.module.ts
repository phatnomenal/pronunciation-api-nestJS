import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { PhoneticsModule } from '../phonetics/phonetics.module';

@Module({
  imports: [PhoneticsModule],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}