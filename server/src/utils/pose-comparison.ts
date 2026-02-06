/**
 * Pose Comparison Engine
 * Core logic for comparing patient poses against reference poses
 * Handles normalization, angle calculation, and similarity scoring
 */

import { PoseLandmark, PoseFrame, PoseComparisonResult } from '../dtos/exercise.dto';
import { PoseLandmarkIndex } from '../types/mediapipe.types';

/**
 * Calculate angle between three points (in degrees)
 * Used for measuring joint angles
 */
export function calculateAngle(
  point1: PoseLandmark,
  point2: PoseLandmark, // Vertex (joint)
  point3: PoseLandmark
): number {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}

/**
 * Calculate shoulder angle (arm abduction/flexion)
 * Angle between hip-shoulder-elbow
 */
export function calculateShoulderAngle(
  landmarks: PoseLandmark[],
  side: 'left' | 'right'
): number | null {
  const hipIdx = side === 'left' ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP;
  const shoulderIdx = side === 'left' ? PoseLandmarkIndex.LEFT_SHOULDER : PoseLandmarkIndex.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? PoseLandmarkIndex.LEFT_ELBOW : PoseLandmarkIndex.RIGHT_ELBOW;
  
  const hip = landmarks[hipIdx];
  const shoulder = landmarks[shoulderIdx];
  const elbow = landmarks[elbowIdx];
  
  // Check visibility
  if (hip.visibility < 0.5 || shoulder.visibility < 0.5 || elbow.visibility < 0.5) {
    return null;
  }
  
  return calculateAngle(hip, shoulder, elbow);
}

/**
 * Calculate elbow angle
 * Angle between shoulder-elbow-wrist
 */
export function calculateElbowAngle(
  landmarks: PoseLandmark[],
  side: 'left' | 'right'
): number | null {
  const shoulderIdx = side === 'left' ? PoseLandmarkIndex.LEFT_SHOULDER : PoseLandmarkIndex.RIGHT_SHOULDER;
  const elbowIdx = side === 'left' ? PoseLandmarkIndex.LEFT_ELBOW : PoseLandmarkIndex.RIGHT_ELBOW;
  const wristIdx = side === 'left' ? PoseLandmarkIndex.LEFT_WRIST : PoseLandmarkIndex.RIGHT_WRIST;
  
  const shoulder = landmarks[shoulderIdx];
  const elbow = landmarks[elbowIdx];
  const wrist = landmarks[wristIdx];
  
  if (shoulder.visibility < 0.5 || elbow.visibility < 0.5 || wrist.visibility < 0.5) {
    return null;
  }
  
  return calculateAngle(shoulder, elbow, wrist);
}

/**
 * Calculate knee angle
 * Angle between hip-knee-ankle
 */
export function calculateKneeAngle(
  landmarks: PoseLandmark[],
  side: 'left' | 'right'
): number | null {
  const hipIdx = side === 'left' ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP;
  const kneeIdx = side === 'left' ? PoseLandmarkIndex.LEFT_KNEE : PoseLandmarkIndex.RIGHT_KNEE;
  const ankleIdx = side === 'left' ? PoseLandmarkIndex.LEFT_ANKLE : PoseLandmarkIndex.RIGHT_ANKLE;
  
  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  const ankle = landmarks[ankleIdx];
  
  if (hip.visibility < 0.5 || knee.visibility < 0.5 || ankle.visibility < 0.5) {
    return null;
  }
  
  return calculateAngle(hip, knee, ankle);
}

/**
 * Calculate hip angle
 * Angle between shoulder-hip-knee
 */
export function calculateHipAngle(
  landmarks: PoseLandmark[],
  side: 'left' | 'right'
): number | null {
  const shoulderIdx = side === 'left' ? PoseLandmarkIndex.LEFT_SHOULDER : PoseLandmarkIndex.RIGHT_SHOULDER;
  const hipIdx = side === 'left' ? PoseLandmarkIndex.LEFT_HIP : PoseLandmarkIndex.RIGHT_HIP;
  const kneeIdx = side === 'left' ? PoseLandmarkIndex.LEFT_KNEE : PoseLandmarkIndex.RIGHT_KNEE;
  
  const shoulder = landmarks[shoulderIdx];
  const hip = landmarks[hipIdx];
  const knee = landmarks[kneeIdx];
  
  if (shoulder.visibility < 0.5 || hip.visibility < 0.5 || knee.visibility < 0.5) {
    return null;
  }
  
  return calculateAngle(shoulder, hip, knee);
}

/**
 * Extract all relevant angles from pose landmarks
 */
export function extractAngles(landmarks: PoseLandmark[]): {
  left_shoulder?: number;
  right_shoulder?: number;
  left_elbow?: number;
  right_elbow?: number;
  left_hip?: number;
  right_hip?: number;
  left_knee?: number;
  right_knee?: number;
} {
  return {
    left_shoulder: calculateShoulderAngle(landmarks, 'left') ?? undefined,
    right_shoulder: calculateShoulderAngle(landmarks, 'right') ?? undefined,
    left_elbow: calculateElbowAngle(landmarks, 'left') ?? undefined,
    right_elbow: calculateElbowAngle(landmarks, 'right') ?? undefined,
    left_hip: calculateHipAngle(landmarks, 'left') ?? undefined,
    right_hip: calculateHipAngle(landmarks, 'right') ?? undefined,
    left_knee: calculateKneeAngle(landmarks, 'left') ?? undefined,
    right_knee: calculateKneeAngle(landmarks, 'right') ?? undefined
  };
}

/**
 * Normalize pose landmarks
 * Centers pose at origin and scales to unit size
 * Makes poses comparable regardless of distance from camera
 */
export function normalizePose(landmarks: PoseLandmark[]): PoseLandmark[] {
  // Use hips as reference point (center of body)
  const leftHip = landmarks[PoseLandmarkIndex.LEFT_HIP];
  const rightHip = landmarks[PoseLandmarkIndex.RIGHT_HIP];
  
  const centerX = (leftHip.x + rightHip.x) / 2;
  const centerY = (leftHip.y + rightHip.y) / 2;
  const centerZ = (leftHip.z + rightHip.z) / 2;
  
  // Calculate torso length for scaling
  const leftShoulder = landmarks[PoseLandmarkIndex.LEFT_SHOULDER];
  const rightShoulder = landmarks[PoseLandmarkIndex.RIGHT_SHOULDER];
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  
  const torsoLength = Math.sqrt(
    Math.pow(shoulderMidX - centerX, 2) +
    Math.pow(shoulderMidY - centerY, 2)
  );
  
  const scale = torsoLength > 0 ? 1 / torsoLength : 1;
  
  // Normalize each landmark
  return landmarks.map(landmark => ({
    x: (landmark.x - centerX) * scale,
    y: (landmark.y - centerY) * scale,
    z: (landmark.z - centerZ) * scale,
    visibility: landmark.visibility
  }));
}

/**
 * Compare two angle values with tolerance
 */
export function compareAngles(
  referenceAngle: number,
  patientAngle: number,
  tolerance: number
): {
  match: boolean;
  difference: number;
  score: number; // 0-100
} {
  const difference = Math.abs(referenceAngle - patientAngle);
  const match = difference <= tolerance;
  
  // Score decreases as difference increases
  const score = Math.max(0, 100 - (difference / tolerance) * 100);
  
  return { match, difference, score };
}

/**
 * Compare two pose frames
 * Returns similarity score and detailed comparison
 */
export function comparePoseFrames(
  referenceFrame: PoseFrame,
  patientFrame: PoseFrame,
  tolerance: number = 15
): PoseComparisonResult {
  const refAngles = referenceFrame.angles || extractAngles(referenceFrame.landmarks);
  const patAngles = patientFrame.angles || extractAngles(patientFrame.landmarks);
  
  const angle_differences: PoseComparisonResult['angle_differences'] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  let totalScore = 0;
  let validComparisons = 0;
  
  // Compare each joint angle
  const joints: Array<keyof typeof refAngles> = [
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee'
  ];
  
  for (const joint of joints) {
    const refAngle = refAngles[joint];
    const patAngle = patAngles[joint];
    
    if (refAngle !== undefined && patAngle !== undefined) {
      const comparison = compareAngles(refAngle, patAngle, tolerance);
      
      angle_differences.push({
        joint,
        reference_angle: refAngle,
        patient_angle: patAngle,
        difference: comparison.difference
      });
      
      totalScore += comparison.score;
      validComparisons++;
      
      // Generate warnings for large deviations
      if (comparison.difference > tolerance * 1.5) {
        warnings.push(`${joint.replace('_', ' ')}_deviation`);
        
        // Generate specific recommendations
        if (joint.includes('shoulder')) {
          if (patAngle < refAngle) {
            recommendations.push('raise_arm_higher');
          } else {
            recommendations.push('lower_arm_slightly');
          }
        } else if (joint.includes('elbow')) {
          if (patAngle < refAngle) {
            recommendations.push('straighten_arm');
          } else {
            recommendations.push('bend_elbow_more');
          }
        } else if (joint.includes('knee')) {
          if (patAngle < refAngle) {
            recommendations.push('bend_knee_more');
          } else {
            recommendations.push('straighten_leg');
          }
        }
      }
    }
  }
  
  const similarity = validComparisons > 0 ? totalScore / validComparisons : 0;
  
  return {
    similarity,
    angle_differences,
    warnings,
    recommendations
  };
}

/**
 * Detect rep completion based on angle changes
 * Returns rep count and quality scores
 */
export function detectReps(
  frames: PoseFrame[],
  targetJoint: keyof PoseFrame['angles'],
  peakAngle: number,
  restAngle: number,
  tolerance: number = 15
): {
  reps: number;
  quality: number; // 0-100
  timestamps: number[];
} {
  const reps: number[] = [];
  let inRep = false;
  let repStartFrame = 0;
  
  for (let i = 0; i < frames.length; i++) {
    const angles = frames[i].angles || extractAngles(frames[i].landmarks);
    const currentAngle = angles[targetJoint];
    
    if (currentAngle === undefined) continue;
    
    // Peak detection (e.g., arm raised)
    if (!inRep && Math.abs(currentAngle - peakAngle) <= tolerance) {
      inRep = true;
      repStartFrame = frames[i].frame;
    }
    
    // Rest detection (e.g., arm lowered) - completes rep
    if (inRep && Math.abs(currentAngle - restAngle) <= tolerance) {
      reps.push(repStartFrame);
      inRep = false;
    }
  }
  
  const quality = reps.length > 0 ? 100 : 0; // Simplified for now
  
  return {
    reps: reps.length,
    quality,
    timestamps: reps
  };
}

/**
 * Calculate stability score
 * Measures smoothness of movement (less jitter = better)
 */
export function calculateStability(frames: PoseFrame[]): number {
  if (frames.length < 3) return 100;
  
  let totalJitter = 0;
  let comparisons = 0;
  
  // Compare consecutive frames
  for (let i = 1; i < frames.length - 1; i++) {
    const prev = frames[i - 1].landmarks;
    const curr = frames[i].landmarks;
    const next = frames[i + 1].landmarks;
    
    // Calculate average position change (simplified)
    let frameJitter = 0;
    for (let j = 0; j < Math.min(prev.length, curr.length, next.length); j++) {
      if (curr[j].visibility > 0.5) {
        const velocity1 = Math.abs(curr[j].x - prev[j].x) + Math.abs(curr[j].y - prev[j].y);
        const velocity2 = Math.abs(next[j].x - curr[j].x) + Math.abs(next[j].y - curr[j].y);
        frameJitter += Math.abs(velocity2 - velocity1);
      }
    }
    
    totalJitter += frameJitter;
    comparisons++;
  }
  
  const avgJitter = comparisons > 0 ? totalJitter / comparisons : 0;
  
  // Convert to 0-100 score (lower jitter = higher score)
  const stabilityScore = Math.max(0, 100 - (avgJitter * 100));
  
  return stabilityScore;
}

/**
 * Calculate overall exercise score
 * Combines angle accuracy, rep count, stability, and completion
 */
export function calculateExerciseScore(
  angleAccuracy: number, // 0-100
  repsCompleted: number,
  repsExpected: number,
  stabilityScore: number, // 0-100
  hasCompleted: boolean
): {
  total: number;
  breakdown: {
    angle_score: number;
    rep_score: number;
    stability_score: number;
    completion_score: number;
  };
} {
  // Angle score: 0-40 points
  const angle_score = (angleAccuracy / 100) * 40;
  
  // Rep score: 0-30 points
  const repCompletion = Math.min(repsCompleted / repsExpected, 1);
  const rep_score = repCompletion * 30;
  
  // Stability score: 0-20 points
  const stability_score_points = (stabilityScore / 100) * 20;
  
  // Completion score: 0-10 points
  const completion_score = hasCompleted ? 10 : 0;
  
  const total = Math.round(angle_score + rep_score + stability_score_points + completion_score);
  
  return {
    total: Math.min(total, 100),
    breakdown: {
      angle_score: Math.round(angle_score),
      rep_score: Math.round(rep_score),
      stability_score: Math.round(stability_score_points),
      completion_score
    }
  };
}
