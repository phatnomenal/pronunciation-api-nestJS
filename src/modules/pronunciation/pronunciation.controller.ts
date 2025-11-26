import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  Headers,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { PronunciationService } from './pronunciation.service';
import { FirebaseService } from '../firebase/firebase.service';
import { AnalyzeDto, TranscribeDto, GradeDto, IpaDto, TtsDto, TtsSlowDto } from './dto';

@ApiTags('pronunciation')
@Controller()
export class PronunciationController {
  constructor(
    private pronunciationService: PronunciationService,
    private firebaseService: FirebaseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'API root endpoint' })
  getRoot() {
    return {
      message: 'Pronunciation Trainer API (NestJS Version - Firebase Database)',
      version: '2.0.0',
      status: 'running',
      storage: 'metadata_only',
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  healthCheck() {
    return {
      status: 'healthy',
      api_version: 'nestjs',
      database: 'firebase_firestore',
      storage: 'none',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('transcribe')
  @ApiOperation({ summary: 'Transcribe audio file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  async transcribe(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TranscribeDto,
  ) {
    if (!file) {
      throw new HttpException('No audio file provided', HttpStatus.BAD_REQUEST);
    }

    try {
      const result = await this.pronunciationService.transcribeAudio(
        file.path,
        dto.language || 'en',
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Transcription failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('analyze')
  @ApiOperation({ summary: 'Analyze pronunciation with full feedback' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('audio'))
  async analyze(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: AnalyzeDto,
    @Headers('x-user-id') userId?: string,
  ) {
    if (!file) {
      throw new HttpException('No audio file provided', HttpStatus.BAD_REQUEST);
    }

    if (!dto.reference_text) {
      throw new HttpException('Reference text is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const saveToDb = dto.save_to_database !== false;
      const result = await this.pronunciationService.analyzePronounciation(
        file.path,
        dto.reference_text,
        userId || dto.user_id,
        saveToDb,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Analysis failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('grade')
  @ApiOperation({ summary: 'Grade pronunciation without audio file' })
  async grade(@Body() dto: GradeDto) {
    try {
      const result = await this.pronunciationService.gradePronounciation(
        dto.reference_text,
        dto.transcribed_text,
      );
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Grading failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('ipa')
  @ApiOperation({ summary: 'Get IPA transcription for text' })
  async getIpa(@Body() dto: IpaDto) {
    try {
      const result = await this.pronunciationService.getIpaAnalysis(dto.text);
      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'IPA analysis failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('tts')
  @ApiOperation({ summary: 'Generate speech from text' })
  async textToSpeech(@Body() dto: TtsDto, @Res() res: Response) {
    try {
      if (dto.speed && (dto.speed < 0.25 || dto.speed > 4.0)) {
        throw new HttpException(
          'Speed must be between 0.25 and 4.0',
          HttpStatus.BAD_REQUEST,
        );
      }

      const audioBuffer = await this.pronunciationService.generateSpeech(
        dto.text,
        dto.voice,
        dto.speed || 1.0,
      );

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename=speech.mp3',
      });

      res.send(audioBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'TTS generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('tts/slow')
  @ApiOperation({ summary: 'Generate slow speech for learning' })
  async slowTextToSpeech(@Body() dto: TtsSlowDto, @Res() res: Response) {
    try {
      const audioBuffer = await this.pronunciationService.generateSlowSpeech(
        dto.text,
        dto.voice,
      );

      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename=speech_slow.mp3',
      });

      res.send(audioBuffer);
    } catch (error) {
      throw new HttpException(
        error.message || 'TTS generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recordings')
  @ApiOperation({ summary: 'Get recordings from database' })
  async getRecordings(
    @Query('user_id') userId?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const limitNum = limit ? parseInt(limit.toString()) : 100;
      let recordings;

      if (userId) {
        recordings = await this.firebaseService.getRecordingsByUser(userId, limitNum);
      } else {
        recordings = await this.firebaseService.getAllRecordings(limitNum);
      }

      return {
        recordings,
        count: recordings.length,
        note: 'Only metadata available - audio files not stored',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get recordings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recordings/search')
  @ApiOperation({ summary: 'Search recordings by text' })
  async searchRecordings(@Query('query') query: string, @Query('limit') limit?: number) {
    try {
      const limitNum = limit ? parseInt(limit.toString()) : 50;
      const recordings = await this.firebaseService.searchRecordingsByText(query, limitNum);

      return {
        recordings,
        count: recordings.length,
        query,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Search failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recordings/score-range')
  @ApiOperation({ summary: 'Get recordings within score range' })
  async getRecordingsByScore(
    @Query('min_score') minScore: number = 0,
    @Query('max_score') maxScore: number = 100,
    @Query('limit') limit?: number,
  ) {
    try {
      const limitNum = limit ? parseInt(limit.toString()) : 50;
      const recordings = await this.firebaseService.getRecordingsByScoreRange(
        Number(minScore),
        Number(maxScore),
        limitNum,
      );

      return {
        recordings,
        count: recordings.length,
        score_range: `${minScore}-${maxScore}`,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get recordings by score',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recordings/:id')
  @ApiOperation({ summary: 'Get specific recording by ID' })
  async getRecording(@Param('id') id: string) {
    try {
      const recording = await this.firebaseService.getRecordingById(id);

      if (!recording) {
        throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
      }

      return recording;
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to get recording',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('recordings/:id')
  @ApiOperation({ summary: 'Update recording metadata' })
  async updateRecording(@Param('id') id: string, @Body() updates: any) {
    try {
      const success = await this.firebaseService.updateRecording(id, updates);

      if (!success) {
        throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
      }

      return { message: 'Recording updated successfully' };
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to update recording',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('recordings/:id')
  @ApiOperation({ summary: 'Delete recording' })
  async deleteRecording(@Param('id') id: string) {
    try {
      const success = await this.firebaseService.deleteRecording(id);

      if (!success) {
        throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
      }

      return { message: 'Recording deleted successfully' };
    } catch (error) {
      if (error.status === 404) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to delete recording',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get overall statistics' })
  async getStatistics() {
    try {
      const stats = await this.firebaseService.getStatistics();
      return stats;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('statistics/user/:userId')
  @ApiOperation({ summary: 'Get user-specific statistics' })
  async getUserStatistics(@Param('userId') userId: string) {
    try {
      const stats = await this.firebaseService.getUserStatistics(userId);
      return stats;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get user statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('phrases')
  @ApiOperation({ summary: 'Get practice phrases' })
  getPhrases() {
    return { phrases: this.pronunciationService.getPhrases() };
  }

  @Get('voices')
  @ApiOperation({ summary: 'Get available TTS voices' })
  getVoices() {
    return { voices: this.pronunciationService.getVoices() };
  }
}