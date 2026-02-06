/**
 * Pose Extraction and Processing Utilities
 * Client-side utilities for processing pose data
 */

import { PoseLandmark, PoseFrame } from '../types/exercise.types';

/**
 * Calculate angle between three points (in degrees)
 */
export function calculateAngle(
  point1: PoseLandmark,
  point2: PoseLandmark, // Vertex
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
 * Extract key angles from pose landmarks
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
  const angles: any = {};

  try {
    // Shoulder angles (hip-shoulder-elbow)
    if (landmarks[23] && landmarks[11] && landmarks[13]) {
      angles.left_shoulder = calculateAngle(landmarks[23], landmarks[11], landmarks[13]);
    }
    if (landmarks[24] && landmarks[12] && landmarks[14]) {
      angles.right_shoulder = calculateAngle(landmarks[24], landmarks[12], landmarks[14]);
    }

    // Elbow angles (shoulder-elbow-wrist)
    if (landmarks[11] && landmarks[13] && landmarks[15]) {
      angles.left_elbow = calculateAngle(landmarks[11], landmarks[13], landmarks[15]);
    }
    if (landmarks[12] && landmarks[14] && landmarks[16]) {
      angles.right_elbow = calculateAngle(landmarks[12], landmarks[14], landmarks[16]);
    }

    // Hip angles (shoulder-hip-knee)
    if (landmarks[11] && landmarks[23] && landmarks[25]) {
      angles.left_hip = calculateAngle(landmarks[11], landmarks[23], landmarks[25]);
    }
    if (landmarks[12] && landmarks[24] && landmarks[26]) {
      angles.right_hip = calculateAngle(landmarks[12], landmarks[24], landmarks[26]);
    }

    // Knee angles (hip-knee-ankle)
    if (landmarks[23] && landmarks[25] && landmarks[27]) {
      angles.left_knee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
    }
    if (landmarks[24] && landmarks[26] && landmarks[28]) {
      angles.right_knee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
    }
  } catch (error) {
    console.error('Error extracting angles:', error);
  }

  return angles;
}

/**
 * Add angles to pose frames
 */
export function addAnglesToFrames(frames: PoseFrame[]): PoseFrame[] {
  return frames.map(frame => ({
    ...frame,
    angles: extractAngles(frame.landmarks)
  }));
}

/**
 * Downsample frames to reduce data size
 * Keeps every nth frame
 */
export function downsampleFrames(frames: PoseFrame[], targetFps: number, originalFps: number): PoseFrame[] {
  if (targetFps >= originalFps) return frames;
  
  const step = Math.round(originalFps / targetFps);
  return frames.filter((_, index) => index % step === 0);
}

/**
 * Detect key frames (important positions)
 * Identifies frames with significant angle changes
 */
export function detectKeyFrames(frames: PoseFrame[], threshold: number = 15): number[] {
  if (frames.length === 0) return [];

  const keyFrames = [0]; // Always include first frame

  for (let i = 1; i < frames.length - 1; i++) {
    const prevAngles = frames[i - 1].angles;
    const currAngles = frames[i].angles;

    if (!prevAngles || !currAngles) continue;

    // Check if any angle has changed significantly
    let maxChange = 0;
    for (const joint of Object.keys(currAngles) as Array<keyof typeof currAngles>) {
      const prev = prevAngles[joint];
      const curr = currAngles[joint];
      if (prev !== undefined && curr !== undefined) {
        maxChange = Math.max(maxChange, Math.abs(curr - prev));
      }
    }

    if (maxChange > threshold) {
      keyFrames.push(i);
    }
  }

  // Always include last frame
  keyFrames.push(frames.length - 1);

  return keyFrames;
}

/**
 * Generate real-time feedback based on angle comparison
 */
export function generateFeedback(
  referenceAngles: PoseFrame['angles'],
  currentAngles: PoseFrame['angles'],
  tolerance: number,
  language: 'en' | 'ar'
): string | null {
  if (!referenceAngles || !currentAngles) return null;

  const messages = {
    en: {
      left_shoulder_low: 'Raise your left arm higher',
      right_shoulder_low: 'Raise your right arm higher',
      left_shoulder_high: 'Lower your left arm slightly',
      right_shoulder_high: 'Lower your right arm slightly',
      left_elbow_bent: 'Straighten your left arm',
      right_elbow_bent: 'Straighten your right arm',
      left_knee_bent: 'Bend your left knee more',
      right_knee_bent: 'Bend your right knee more',
      good: 'Good form! Keep going'
    },
    ar: {
      left_shoulder_low: 'ارفع ذراعك اليسرى أعلى',
      right_shoulder_low: 'ارفع ذراعك اليمنى أعلى',
      left_shoulder_high: 'اخفض ذراعك اليسرى قليلاً',
      right_shoulder_high: 'اخفض ذراعك اليمنى قليلاً',
      left_elbow_bent: 'مد ذراعك اليسرى',
      right_elbow_bent: 'مد ذراعك اليمنى',
      left_knee_bent: 'اثن ركبتك اليسرى أكثر',
      right_knee_bent: 'اثن ركبتك اليمنى أكثر',
      good: 'أداء جيد! استمر'
    }
  };

  const msgs = messages[language];

  // Check shoulders
  if (referenceAngles.left_shoulder && currentAngles.left_shoulder) {
    const diff = currentAngles.left_shoulder - referenceAngles.left_shoulder;
    if (diff < -tolerance) return msgs.left_shoulder_low;
    if (diff > tolerance) return msgs.left_shoulder_high;
  }

  if (referenceAngles.right_shoulder && currentAngles.right_shoulder) {
    const diff = currentAngles.right_shoulder - referenceAngles.right_shoulder;
    if (diff < -tolerance) return msgs.right_shoulder_low;
    if (diff > tolerance) return msgs.right_shoulder_high;
  }

  // Check elbows
  if (referenceAngles.left_elbow && currentAngles.left_elbow) {
    if (currentAngles.left_elbow < referenceAngles.left_elbow - tolerance) {
      return msgs.left_elbow_bent;
    }
  }

  if (referenceAngles.right_elbow && currentAngles.right_elbow) {
    if (currentAngles.right_elbow < referenceAngles.right_elbow - tolerance) {
      return msgs.right_elbow_bent;
    }
  }

  return msgs.good;
}

/**
 * Calculate pose similarity score (0-100)
 */
export function calculateSimilarity(
  referenceAngles: PoseFrame['angles'],
  currentAngles: PoseFrame['angles'],
  tolerance: number
): number {
  if (!referenceAngles || !currentAngles) return 0;

  const joints = ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 
                  'left_knee', 'right_knee'] as const;
  
  let totalScore = 0;
  let validJoints = 0;

  for (const joint of joints) {
    const refAngle = referenceAngles[joint];
    const currAngle = currentAngles[joint];

    if (refAngle !== undefined && currAngle !== undefined) {
      const diff = Math.abs(refAngle - currAngle);
      const score = Math.max(0, 100 - (diff / tolerance) * 100);
      totalScore += score;
      validJoints++;
    }
  }

  return validJoints > 0 ? totalScore / validJoints : 0;
}

/**
 * Format video file for upload
 * Returns base64 encoded video (for small videos only)
 */
export function formatVideoForUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Load video element from file
 */
export function loadVideoFromFile(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };
    
    video.src = URL.createObjectURL(file);
  });
}

/**
 * Request camera permission and get media stream
 */
export async function requestCameraAccess(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    });
    return stream;
  } catch (error) {
    console.error('Camera access denied:', error);
    throw new Error('Camera permission denied');
  }
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream: MediaStream) {
  stream.getTracks().forEach(track => track.stop());
}
