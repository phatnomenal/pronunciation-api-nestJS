import { Injectable } from '@nestjs/common';
import { PhoneticDetail, IPAAnalysis } from '../../types';

// Simple IPA conversion (you can use a better library if available for Node.js)
// For now, this is a placeholder - you might want to use an external API or library
@Injectable()
export class PhoneticsService {
  getIPATranscription(text: string): string {
    // Placeholder - implement actual IPA conversion
    // You might want to use an external service or library here
    return `[IPA: ${text}]`;
  }

  analyzeWordPronunciation(
    referenceWord: string,
    transcribedWord: string,
  ): PhoneticDetail {
    const refIpa = this.getIPATranscription(referenceWord);
    const transIpa = this.getIPATranscription(transcribedWord);
    
    const similarity = this.calculateSimilarity(
      referenceWord.toLowerCase(),
      transcribedWord.toLowerCase(),
    );
    
    const detail: PhoneticDetail = {
      word: referenceWord,
      transcribed: transcribedWord,
      reference_ipa: refIpa,
      transcribed_ipa: transIpa,
      similarity: similarity,
      correct: similarity > 0.8,
    };
    
    if (!detail.correct) {
      detail.feedback = `Try pronouncing '${referenceWord}' as /${refIpa}/`;
    }
    
    return detail;
  }

  getPhoneticFeedback(
    referenceText: string,
    transcribedText: string,
  ): PhoneticDetail[] {
    const refWords = referenceText.toLowerCase().match(/\b\w+\b/g) || [];
    const transWords = transcribedText.toLowerCase().match(/\b\w+\b/g) || [];
    
    const feedback: PhoneticDetail[] = [];
    
    refWords.forEach((refWord, i) => {
      const transWord = transWords[i] || '';
      const analysis = this.analyzeWordPronunciation(refWord, transWord);
      
      if (!analysis.correct) {
        feedback.push(analysis);
      }
    });
    
    return feedback;
  }

  getStressPatterns(text: string): string {
    const ipaText = this.getIPATranscription(text);
    
    let guide = `IPA: ${ipaText}\n\n`;
    guide += 'Stress markers:\n';
    guide += 'ˈ (primary stress) - emphasize this syllable strongly\n';
    guide += 'ˌ (secondary stress) - mild emphasis\n';
    
    return guide;
  }

  getFullIPAAnalysis(text: string): IPAAnalysis {
    const ipaText = this.getIPATranscription(text);
    const words = text.split(' ');
    const wordIpa = words.map((word) => this.getIPATranscription(word));
    
    return {
      text: text,
      ipa: ipaText,
      words: words,
      word_ipa: wordIpa,
      stress_guide: this.getStressPatterns(text),
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation (Levenshtein-based)
    const levenshtein = require('fast-levenshtein');
    const distance = levenshtein.get(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - distance / maxLength;
  }
}