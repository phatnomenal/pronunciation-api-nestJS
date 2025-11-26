export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: any[];
}

export interface PhoneticDetail {
  word: string;
  transcribed: string;
  reference_ipa: string;
  transcribed_ipa: string;
  similarity: number;
  correct: boolean;
  feedback?: string;
}

export interface GradeInfo {
  score: number;
  grade: string;
  level: string;
  color: string;
  percentage: number;
}

export interface AnalysisResult {
  transcribed_text: string;
  reference_text: string;
  score: number;
  feedback: string;
  grade: GradeInfo;
  phonetic_details: PhoneticDetail[];
  pronunciation_guide: string;
  duration?: number;
}

export interface RecordingMetadata {
  recording_id: string;
  reference_text: string;
  transcribed_text: string;
  score: number;
  user_id: string;
  timestamp?: any;
  created_at: string;
  api_version: string;
  has_audio_file: boolean;
  feedback?: string;
  phonetic_details?: PhoneticDetail[];
  pronunciation_guide?: string;
  grade?: string;
  grade_level?: string;
  duration?: number;
  file_size?: number;
  file_type?: string;
}

export interface Statistics {
  total_recordings: number;
  average_score: number;
  total_users: number;
  score_distribution?: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  api_version: string;
}

export interface UserStatistics {
  total_recordings: number;
  average_score: number;
  best_score: number;
  worst_score: number;
  improvement_trend?: number;
  recent_recordings?: RecordingMetadata[];
}

export interface IPAAnalysis {
  text: string;
  ipa: string;
  words: string[];
  word_ipa: string[];
  stress_guide: string;
}

export interface Phrase {
  id: number;
  text: string;
  difficulty: string;
  category: string;
}

export interface Voice {
  id: string;
  name: string;
  description: string;
}