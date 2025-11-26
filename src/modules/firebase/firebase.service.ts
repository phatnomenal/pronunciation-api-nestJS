import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { RecordingMetadata, Statistics, UserStatistics } from '../../types';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: admin.firestore.Firestore;

  constructor(private configService: AppConfigService) {}

  onModuleInit() {
    const credentialsPath = this.configService.firebaseCredentialsPath;
    
    try {
      const serviceAccount = require(`../../../${credentialsPath}`);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.db = admin.firestore();
      console.log('✓ Firebase initialized successfully (Database only)');
    } catch (error) {
      console.error('✗ Error initializing Firebase:', error);
      throw error;
    }
  }

  // ... rest of the firebase service methods remain the same ...
  async saveRecordingMetadata(
    referenceText: string,
    transcribedText: string,
    score: number,
    userId?: string,
    metadata?: Partial<RecordingMetadata>,
  ): Promise<{ success: boolean; recording_id?: string; message?: string; error?: string }> {
    try {
      const recordingId = uuidv4();
      
      const recordingData: RecordingMetadata = {
        recording_id: recordingId,
        reference_text: referenceText,
        transcribed_text: transcribedText,
        score: score,
        user_id: userId || 'anonymous',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        created_at: new Date().toISOString(),
        api_version: 'nestjs',
        has_audio_file: false,
        ...metadata,
      };

      await this.db.collection('recordings').doc(recordingId).set(recordingData);
      
      console.log(`Metadata saved successfully. ID: ${recordingId}`);
      
      return {
        success: true,
        recording_id: recordingId,
        message: 'Metadata saved to Firestore',
      };
    } catch (error) {
      console.error('Error saving metadata to Firebase:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getRecordingById(recordingId: string): Promise<RecordingMetadata | null> {
    try {
      const doc = await this.db.collection('recordings').doc(recordingId).get();
      
      if (doc.exists) {
        const data = doc.data() as RecordingMetadata;
        return { ...data, recording_id: doc.id };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting recording:', error);
      return null;
    }
  }

  async getAllRecordings(limit: number = 100): Promise<RecordingMetadata[]> {
    try {
      const snapshot = await this.db
        .collection('recordings')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const recordings: RecordingMetadata[] = [];
      
      snapshot.forEach((doc) => {
        recordings.push({ ...doc.data(), recording_id: doc.id } as RecordingMetadata);
      });
      
      return recordings;
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  }

  async getRecordingsByUser(userId: string, limit: number = 50): Promise<RecordingMetadata[]> {
    try {
      const snapshot = await this.db
        .collection('recordings')
        .where('user_id', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const recordings: RecordingMetadata[] = [];
      
      snapshot.forEach((doc) => {
        recordings.push({ ...doc.data(), recording_id: doc.id } as RecordingMetadata);
      });
      
      return recordings;
    } catch (error) {
      console.error('Error getting user recordings:', error);
      return [];
    }
  }

  async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      const docRef = this.db.collection('recordings').doc(recordingId);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return false;
      }
      
      await docRef.delete();
      console.log(`Recording ${recordingId} deleted successfully`);
      
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }

  async updateRecording(recordingId: string, updates: Partial<RecordingMetadata>): Promise<boolean> {
    try {
      await this.db.collection('recordings').doc(recordingId).update(updates);
      console.log(`Recording ${recordingId} updated successfully`);
      return true;
    } catch (error) {
      console.error('Error updating recording:', error);
      return false;
    }
  }

  async getStatistics(): Promise<Statistics> {
    try {
      const recordings = await this.getAllRecordings(1000);
      
      if (recordings.length === 0) {
        return {
          total_recordings: 0,
          average_score: 0,
          total_users: 0,
          api_version: 'nestjs',
        };
      }
      
      const totalScore = recordings.reduce((sum, r) => sum + (r.score || 0), 0);
      const uniqueUsers = new Set(recordings.map((r) => r.user_id)).size;
      
      const scoreDistribution = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
      };
      
      recordings.forEach((r) => {
        const score = r.score || 0;
        if (score >= 90) scoreDistribution.excellent++;
        else if (score >= 70) scoreDistribution.good++;
        else if (score >= 50) scoreDistribution.fair++;
        else scoreDistribution.poor++;
      });
      
      return {
        total_recordings: recordings.length,
        average_score: Math.round((totalScore / recordings.length) * 100) / 100,
        total_users: uniqueUsers,
        score_distribution: scoreDistribution,
        api_version: 'nestjs',
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {
        total_recordings: 0,
        average_score: 0,
        total_users: 0,
        api_version: 'nestjs',
      };
    }
  }

  async getRecordingsByScoreRange(
    minScore: number,
    maxScore: number,
    limit: number = 50,
  ): Promise<RecordingMetadata[]> {
    try {
      const snapshot = await this.db
        .collection('recordings')
        .where('score', '>=', minScore)
        .where('score', '<=', maxScore)
        .orderBy('score')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      const recordings: RecordingMetadata[] = [];
      
      snapshot.forEach((doc) => {
        recordings.push({ ...doc.data(), recording_id: doc.id } as RecordingMetadata);
      });
      
      return recordings;
    } catch (error) {
      console.error('Error getting recordings by score:', error);
      return [];
    }
  }

  async searchRecordingsByText(query: string, limit: number = 50): Promise<RecordingMetadata[]> {
    try {
      const allRecordings = await this.getAllRecordings(500);
      
      const queryLower = query.toLowerCase();
      const filtered = allRecordings.filter(
        (r) =>
          r.reference_text?.toLowerCase().includes(queryLower) ||
          r.transcribed_text?.toLowerCase().includes(queryLower) ||
          r.feedback?.toLowerCase().includes(queryLower),
      );
      
      return filtered.slice(0, limit);
    } catch (error) {
      console.error('Error searching recordings:', error);
      return [];
    }
  }

  async getUserStatistics(userId: string): Promise<UserStatistics> {
    try {
      const recordings = await this.getRecordingsByUser(userId, 1000);
      
      if (recordings.length === 0) {
        return {
          total_recordings: 0,
          average_score: 0,
          best_score: 0,
          worst_score: 0,
          improvement_trend: null,
        };
      }
      
      const scores = recordings.map((r) => r.score || 0);
      
      let improvementTrend = null;
      if (scores.length >= 10) {
        const recentAvg = scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
        const oldAvg = scores.slice(-5).reduce((a, b) => a + b, 0) / 5;
        improvementTrend = Math.round((recentAvg - oldAvg) * 100) / 100;
      }
      
      return {
        total_recordings: recordings.length,
        average_score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
        best_score: Math.max(...scores),
        worst_score: Math.min(...scores),
        improvement_trend: improvementTrend,
        recent_recordings: recordings.slice(0, 5),
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      return {
        total_recordings: 0,
        average_score: 0,
        best_score: 0,
        worst_score: 0,
      };
    }
  }
}