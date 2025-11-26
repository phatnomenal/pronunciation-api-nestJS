import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PronunciationController } from './pronunciation.controller';
import { PronunciationService } from './pronunciation.service';
import { OpenaiModule } from '../openai/openai.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { ScoringModule } from '../scoring/scoring.module';
import { PhoneticsModule } from '../phonetics/phonetics.module';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './temp',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `audio-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
      },
    }),
    OpenaiModule,
    FirebaseModule,
    ScoringModule,
    PhoneticsModule,
  ],
  controllers: [PronunciationController],
  providers: [PronunciationService],
})
export class PronunciationModule {}