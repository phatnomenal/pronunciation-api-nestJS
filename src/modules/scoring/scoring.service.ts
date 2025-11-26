import { Injectable } from '@nestjs/common';
import { PhoneticsService } from '../phonetics/phonetics.service';
import { GradeInfo, PhoneticDetail } from '../../types';

@Injectable()
export class ScoringService {
  constructor(private phoneticsService: PhoneticsService) {}

  normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[.,!?]/g, '');
  }

  calculatePronunciationScore(
    reference: string,
    transcribed: string,
  ): {
    score: number;
    feedback: string;
    phonetic_details: PhoneticDetail[];
    pronunciation_guide: string;
  } {
    const refNormalized = this.normalizeText(reference);
    const transNormalized = this.normalizeText(transcribed);
    
    const levenshtein = require('fast-levenshtein');
    const distance = levenshtein.get(refNormalized, transNormalized);
    const maxLength = Math.max(refNormalized.length, transNormalized.length);
    const similarity = 1 - distance / maxLength;
    
    const score = Math.round(similarity * 100);
    
    let feedback = '';
    if (score >= 95) {
      feedback = 'Excellent! Your pronunciation is nearly perfect.';
    } else if (score >= 85) {
      feedback = 'Great job! Your pronunciation is very clear with minor differences.';
    } else if (score >= 70) {
      feedback = 'Good effort! There are some pronunciation differences. Keep practicing.';
    } else if (score >= 50) {
      feedback = 'Fair attempt. Focus on clarity and try to match the reference text more closely.';
    } else {
      feedback = 'Keep practicing! Try speaking more slowly and clearly.';
    }
    
    const phoneticDetails = this.phoneticsService.getPhoneticFeedback(reference, transcribed);
    const pronunciationGuide = this.phoneticsService.getStressPatterns(reference);
    
    return {
      score,
      feedback,
      phonetic_details: phoneticDetails,
      pronunciation_guide: pronunciationGuide,
    };
  }

  getGradeBreakdown(score: number): GradeInfo {
    let grade = '';
    let level = '';
    let color = '';
    
    if (score >= 95) {
      grade = 'A+';
      level = 'Excellent';
      color = '#10b981';
    } else if (score >= 90) {
      grade = 'A';
      level = 'Excellent';
      color