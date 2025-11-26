import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PronunciationModule } from './modules/pronunciation/pronunciation.module';
import { OpenaiModule } from './modules/openai/openai.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { PhoneticsModule } from './modules/phonetics/phonetics.module';
import { ScoringModule } from './modules/scoring/scoring.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PronunciationModule,
    OpenaiModule,
    FirebaseModule,
    PhoneticsModule,
    ScoringModule,
  ],
})
export class AppModule {}