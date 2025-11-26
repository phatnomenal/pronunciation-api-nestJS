import { Injectable } from '@nestjs/common';
import { OpenaiService } from '../openai/openai.service';
import { FirebaseService } from '../firebase/firebase.service';
import { ScoringService } from '../scoring/scoring.service';
import { PhoneticsService } from '../phonetics/phonetics.service';
import { AnalysisResult, Phrase, Voice } from '../../types';
import * as fs from 'fs';

@Injectable()
export class PronunciationService {
  constructor(
    private openaiService: OpenaiService,
    private firebaseService: FirebaseService,
    private scoringService: ScoringService,
    private phoneticsService: PhoneticsService,
  ) {}

  async transcribeAudio(audioPath: string, language: string = 'en') {
    const result = await this.openaiService.transcribeAudio(audioPath, language);
    
    // Clean up temp file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    return result;
  }

  async analyzePronounciation(
    audioPath: string,
    referenceText: string,
    userId?: string,
    saveToDatabase: boolean = true,
  ): Promise<AnalysisResult & { database_save?: any; note?: string }> {
    try {
      // Get file size before processing
      const fileStats = fs.statSync(audioPath);
      const fileSize = fileStats.size;
      const fileType = audioPath.split('.').pop();

      // Transcribe audio
      const transcriptionResult = await this.openaiService.transcribeAudio(audioPath);
      const transcribedText = transcriptionResult.text;

      // Calculate score and feedback
      const scoreResult = this.scoringService.calculatePronunciationScore(
        referenceText,
        transcribedText,
      );

      // Get grade breakdown
      const gradeInfo = this.scoringService.getGradeBreakdown(scoreResult.score);

      // Save to database if requested
      let databaseResult = null;
      if (saveToDatabase) {
        databaseResult = await this.firebaseService.saveRecordingMetadata(
          referenceText,
          transcribedText,
          scoreResult.score,
          userId,
          {
            feedback: scoreResult.feedback,
            phonetic_details: scoreResult.phonetic_details,
            pronunciation_guide: scoreResult.pronunciation_guide,
            grade: gradeInfo.grade,
            grade_level: gradeInfo.level,
            duration: transcriptionResult.duration,
            file_size: fileSize,
            file_type: fileType,
          },
        );
      }

      // Clean up temp file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }

      const response: AnalysisResult & { database_save?: any; note?: string } = {
        transcribed_text: transcribedText,
        reference_text: referenceText,
        score: scoreResult.score,
        feedback: scoreResult.feedback,
        grade: gradeInfo,
        phonetic_details: scoreResult.phonetic_details,
        pronunciation_guide: scoreResult.pronunciation_guide,
        duration: transcriptionResult.duration,
      };

      if (databaseResult) {
        response.database_save = databaseResult;
        response.note = 'Audio file processed temporarily - only metadata saved to database';
      }

      return response;
    } catch (error) {
      // Clean up temp file on error
      if (fs.existsSync(audioPath)) {
        try {
          fs.unlinkSync(audioPath);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
      }
      throw error;
    }
  }

  async gradePronounciation(referenceText: string, transcribedText: string) {
    const scoreResult = this.scoringService.calculatePronunciationScore(
      referenceText,
      transcribedText,
    );

    const gradeInfo = this.scoringService.getGradeBreakdown(scoreResult.score);

    return {
      score: scoreResult.score,
      feedback: scoreResult.feedback,
      grade: gradeInfo,
      phonetic_details: scoreResult.phonetic_details,
      pronunciation_guide: scoreResult.pronunciation_guide,
    };
  }

  async getIpaAnalysis(text: string) {
    return this.phoneticsService.getFullIPAAnalysis(text);
  }

  async generateSpeech(text: string, voice?: string, speed: number = 1.0) {
    return this.openaiService.generateSpeech(text, voice, speed);
  }

  async generateSlowSpeech(text: string, voice?: string) {
    return this.openaiService.generateSlowSpeech(text, voice);
  }

  getPhrases(): Phrase[] {
    return [
      {
        id: 1,
        text: 'The quick brown fox jumps over the lazy dog',
        difficulty: 'beginner',
        category: 'tongue_twister',
      },
      {
        id: 2,
        text: 'She sells seashells by the seashore',
        difficulty: 'beginner',
        category: 'tongue_twister',
      },
      {
        id: 3,
        text: 'How much wood would a woodchuck chuck',
        difficulty: 'beginner',
        category: 'tongue_twister',
      },
      {
        id: 4,
        text: 'Peter Piper picked a peck of pickled peppers',
        difficulty: 'intermediate',
        category: 'tongue_twister',
      },
      {
        id: 5,
        text: 'I scream, you scream, we all scream for ice cream',
        difficulty: 'beginner',
        category: 'tongue_twister',
      },
      {
        id: 6,
        text: "The sixth sick sheikh's sixth sheep's sick",
        difficulty: 'advanced',
        category: 'tongue_twister',
      },
      {
        id: 7,
        text: 'Hello, how are you doing today?',
        difficulty: 'beginner',
        category: 'conversation',
      },
      {
        id: 8,
        text: 'Could you please tell me where the nearest station is?',
        difficulty: 'intermediate',
        category: 'conversation',
      },
      {
        id: 9,
        text: 'I would like to schedule an appointment for next week',
        difficulty: 'intermediate',
        category: 'business',
      },
      {
        id: 10,
        text: 'The weather forecast predicts thunderstorms throughout the weekend',
        difficulty: 'advanced',
        category: 'news',
      },
    ];
  }

  getVoices(): Voice[] {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
      { id: 'echo', name: 'Echo', description: 'Male, clear voice' },
      { id: 'fable', name: 'Fable', description: 'British accent, expressive' },
      { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
      { id: 'nova', name: 'Nova', description: 'Female, warm voice' },
      { id: 'shimmer', name: 'Shimmer', description: 'Soft, friendly voice' },
    ];
  }
}