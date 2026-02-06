/**
 * Unit Tests for Pose Comparison Engine
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculateAngle,
  extractAngles,
  normalizePose,
  compareAngles,
  comparePoseFrames,
  detectReps,
  calculateStability,
  calculateExerciseScore
} from '../utils/pose-comparison';
import { PoseLandmark, PoseFrame } from '../dtos/exercise.dto';

describe('Pose Comparison Engine', () => {
  // Helper to create a landmark
  const createLandmark = (x: number, y: number, z: number = 0, visibility: number = 1): PoseLandmark => ({
    x, y, z, visibility
  });

  describe('calculateAngle', () => {
    it('should calculate 90 degree angle correctly', () => {
      const point1 = createLandmark(0, 0);
      const point2 = createLandmark(1, 0); // vertex
      const point3 = createLandmark(1, 1);

      const angle = calculateAngle(point1, point2, point3);
      expect(angle).toBeCloseTo(90, 1);
    });

    it('should calculate 180 degree angle (straight line)', () => {
      const point1 = createLandmark(0, 0);
      const point2 = createLandmark(1, 0);
      const point3 = createLandmark(2, 0);

      const angle = calculateAngle(point1, point2, point3);
      expect(angle).toBeCloseTo(180, 1);
    });

    it('should calculate 45 degree angle', () => {
      const point1 = createLandmark(0, 0);
      const point2 = createLandmark(1, 0);
      const point3 = createLandmark(1.5, 0.5);

      const angle = calculateAngle(point1, point2, point3);
      expect(angle).toBeGreaterThan(40);
      expect(angle).toBeLessThan(50);
    });
  });

  describe('normalizePose', () => {
    it('should normalize pose landmarks', () => {
      // Create a simple pose with hips and shoulders
      const landmarks = Array(33).fill(null).map(() => createLandmark(0, 0));
      
      // Set hip positions (indices 23, 24)
      landmarks[23] = createLandmark(0.4, 0.6, 0);
      landmarks[24] = createLandmark(0.6, 0.6, 0);
      
      // Set shoulder positions (indices 11, 12)
      landmarks[11] = createLandmark(0.4, 0.4, 0);
      landmarks[12] = createLandmark(0.6, 0.4, 0);

      const normalized = normalizePose(landmarks);

      // Center should be near origin
      const centerX = (normalized[23].x + normalized[24].x) / 2;
      const centerY = (normalized[23].y + normalized[24].y) / 2;

      expect(centerX).toBeCloseTo(0, 1);
      expect(centerY).toBeCloseTo(0, 1);
    });

    it('should preserve landmark count', () => {
      const landmarks = Array(33).fill(null).map((_, i) => createLandmark(i * 0.1, i * 0.1));
      landmarks[23] = createLandmark(0.5, 0.5);
      landmarks[24] = createLandmark(0.5, 0.5);
      landmarks[11] = createLandmark(0.5, 0.3);
      landmarks[12] = createLandmark(0.5, 0.3);

      const normalized = normalizePose(landmarks);

      expect(normalized.length).toBe(33);
    });
  });

  describe('compareAngles', () => {
    it('should match angles within tolerance', () => {
      const result = compareAngles(90, 95, 10);

      expect(result.match).toBe(true);
      expect(result.difference).toBe(5);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should not match angles outside tolerance', () => {
      const result = compareAngles(90, 110, 10);

      expect(result.match).toBe(false);
      expect(result.difference).toBe(20);
    });

    it('should give perfect score for identical angles', () => {
      const result = compareAngles(90, 90, 15);

      expect(result.match).toBe(true);
      expect(result.difference).toBe(0);
      expect(result.score).toBe(100);
    });
  });

  describe('comparePoseFrames', () => {
    it('should compare two similar pose frames', () => {
      const refFrame: PoseFrame = {
        frame: 0,
        landmarks: [],
        angles: {
          left_shoulder: 90,
          right_shoulder: 90,
          left_elbow: 180,
          right_elbow: 180
        }
      };

      const patFrame: PoseFrame = {
        frame: 0,
        landmarks: [],
        angles: {
          left_shoulder: 92,
          right_shoulder: 88,
          left_elbow: 178,
          right_elbow: 182
        }
      };

      const result = comparePoseFrames(refFrame, patFrame, 15);

      expect(result.similarity).toBeGreaterThan(90);
      expect(result.angle_differences.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBe(0);
    });

    it('should detect deviations and generate warnings', () => {
      const refFrame: PoseFrame = {
        frame: 0,
        landmarks: [],
        angles: {
          left_shoulder: 90,
          right_shoulder: 90
        }
      };

      const patFrame: PoseFrame = {
        frame: 0,
        landmarks: [],
        angles: {
          left_shoulder: 60, // 30 degree deviation
          right_shoulder: 65
        }
      };

      const result = comparePoseFrames(refFrame, patFrame, 15);

      expect(result.similarity).toBeLessThan(70);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('calculateExerciseScore', () => {
    it('should calculate perfect score', () => {
      const result = calculateExerciseScore(
        100, // angleAccuracy
        5,   // repsCompleted
        5,   // repsExpected
        100, // stabilityScore
        true // hasCompleted
      );

      expect(result.total).toBe(100);
      expect(result.breakdown.angle_score).toBe(40);
      expect(result.breakdown.rep_score).toBe(30);
      expect(result.breakdown.stability_score).toBe(20);
      expect(result.breakdown.completion_score).toBe(10);
    });

    it('should calculate partial score', () => {
      const result = calculateExerciseScore(
        75,  // angleAccuracy
        3,   // repsCompleted
        5,   // repsExpected
        60,  // stabilityScore
        false // hasCompleted
      );

      expect(result.total).toBeGreaterThan(0);
      expect(result.total).toBeLessThan(100);
      expect(result.breakdown.completion_score).toBe(0);
    });

    it('should never exceed 100 points', () => {
      const result = calculateExerciseScore(
        100,
        10, // More reps than expected
        5,
        100,
        true
      );

      expect(result.total).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateStability', () => {
    it('should give high score for stable movement', () => {
      // Create frames with minimal jitter
      const frames: PoseFrame[] = [];
      for (let i = 0; i < 10; i++) {
        frames.push({
          frame: i,
          landmarks: Array(33).fill(null).map((_, j) => 
            createLandmark(j * 0.01 + i * 0.001, j * 0.01 + i * 0.001)
          )
        });
      }

      const stability = calculateStability(frames);

      expect(stability).toBeGreaterThan(70);
    });

    it('should give low score for jittery movement', () => {
      // Create frames with random jitter
      const frames: PoseFrame[] = [];
      for (let i = 0; i < 10; i++) {
        frames.push({
          frame: i,
          landmarks: Array(33).fill(null).map((_, j) => 
            createLandmark(
              j * 0.01 + Math.random() * 0.1,
              j * 0.01 + Math.random() * 0.1
            )
          )
        });
      }

      const stability = calculateStability(frames);

      expect(stability).toBeLessThan(80);
    });
  });

  describe('detectReps', () => {
    it('should detect completed reps', () => {
      // Create frames simulating 3 reps (arm up and down)
      const frames: PoseFrame[] = [];
      
      // Rep 1
      frames.push({ frame: 0, landmarks: [], angles: { left_shoulder: 30 } }); // Rest
      frames.push({ frame: 1, landmarks: [], angles: { left_shoulder: 90 } }); // Peak
      frames.push({ frame: 2, landmarks: [], angles: { left_shoulder: 30 } }); // Rest
      
      // Rep 2
      frames.push({ frame: 3, landmarks: [], angles: { left_shoulder: 30 } });
      frames.push({ frame: 4, landmarks: [], angles: { left_shoulder: 90 } });
      frames.push({ frame: 5, landmarks: [], angles: { left_shoulder: 30 } });
      
      // Rep 3
      frames.push({ frame: 6, landmarks: [], angles: { left_shoulder: 30 } });
      frames.push({ frame: 7, landmarks: [], angles: { left_shoulder: 90 } });
      frames.push({ frame: 8, landmarks: [], angles: { left_shoulder: 30 } });

      const result = detectReps(frames, 'left_shoulder' as keyof PoseFrame['angles'], 90, 30, 10);

      expect(result.reps).toBeGreaterThanOrEqual(2); // Should detect at least 2 reps
    });

    it('should not count incomplete reps', () => {
      const frames: PoseFrame[] = [
        { frame: 0, landmarks: [], angles: { left_shoulder: 30 } },
        { frame: 1, landmarks: [], angles: { left_shoulder: 60 } }, // Not at peak
        { frame: 2, landmarks: [], angles: { left_shoulder: 30 } }
      ];

      const result = detectReps(frames, 'left_shoulder' as keyof PoseFrame['angles'], 90, 30, 10);

      expect(result.reps).toBe(0);
    });
  });
});
