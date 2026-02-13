/**
 * MediaPipe Pose Detection Hook
 * Provides pose detection from camera or video
 * 
 * Installation required:
 * npm install @mediapipe/tasks-vision
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseFrame, PoseLandmark } from '../types/exercise.types';
import { extractAngles } from '@/lib/pose-utils';

// MediaPipe will be loaded dynamically
let PoseLandmarker: any = null;
let FilesetResolver: any = null;

/**
 * usePoseDetection Hook
 * Detects human pose from video element or camera stream
 */
export function usePoseDetection() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const poseLandmarkerRef = useRef<any>(null);
  const frameCountRef = useRef(0);

  // Initialize MediaPipe Pose Landmarker
  useEffect(() => {
    const initPoseLandmarker = async () => {
      try {
        // Load MediaPipe library dynamically
        if (!PoseLandmarker) {
          const vision = await import('@mediapipe/tasks-vision');
          PoseLandmarker = vision.PoseLandmarker;
          FilesetResolver = vision.FilesetResolver;
        }

        // Create the PoseLandmarker
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minPosePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5
          }
        );

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize MediaPipe Pose:', err);
        setError('Failed to load pose detection model');
        setIsLoading(false);
      }
    };

    initPoseLandmarker();

    return () => {
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []);

  /**
   * Detect pose from a single video frame
   */
  const detectPose = useCallback(
    async (
      videoElement: HTMLVideoElement,
      timestamp?: number
    ): Promise<PoseFrame | null> => {
      if (!poseLandmarkerRef.current || isLoading) {
        return null;
      }

      try {
        const startTimeMs = timestamp || performance.now();
        const results = poseLandmarkerRef.current.detectForVideo(
          videoElement,
          startTimeMs
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks: PoseLandmark[] = results.landmarks[0].map((lm: any) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility || 1
          }));

          frameCountRef.current++;

          return {
            frame: frameCountRef.current,
            landmarks,
            angles: extractAngles(landmarks)
          };
        }

        return null;
      } catch (err) {
        console.error('Pose detection error:', err);
        return null;
      }
    },
    [isLoading]
  );

  /**
   * Extract poses from entire video
   */
  const extractPosesFromVideo = useCallback(
    async (
      videoElement: HTMLVideoElement,
      onProgress?: (progress: number) => void
    ): Promise<PoseFrame[]> => {
      return new Promise((resolve, reject) => {
        if (!poseLandmarkerRef.current) {
          reject(new Error('Pose detector not initialized'));
          return;
        }

        const poses: PoseFrame[] = [];
        const duration = videoElement.duration;
        const fps = 30; // Sample at 30 fps
        const frameInterval = 1 / fps;
        
        frameCountRef.current = 0;
        let currentTime = 0;

        const processFrame = async () => {
          if (currentTime >= duration) {
            resolve(poses);
            return;
          }

          videoElement.currentTime = currentTime;

          await new Promise<void>((resolveSeek) => {
            videoElement.onseeked = async () => {
              const pose = await detectPose(videoElement, currentTime * 1000);
              if (pose) {
                poses.push(pose);
              }

              const progress = (currentTime / duration) * 100;
              onProgress?.(progress);

              currentTime += frameInterval;
              resolveSeek();
              processFrame();
            };
          });
        };

        processFrame();
      });
    },
    [detectPose]
  );

  /**
   * Start continuous pose detection from camera
   */
  const startContinuousDetection = useCallback(
    (
      videoElement: HTMLVideoElement,
      onPoseDetected: (pose: PoseFrame) => void
    ) => {
      if (!poseLandmarkerRef.current || isDetecting) {
        return;
      }

      setIsDetecting(true);
      frameCountRef.current = 0;

      let animationFrameId: number;

      const detectLoop = async () => {
        if (!isDetecting) return;

        const pose = await detectPose(videoElement);
        if (pose) {
          onPoseDetected(pose);
        }

        animationFrameId = requestAnimationFrame(detectLoop);
      };

      detectLoop();

      return () => {
        setIsDetecting(false);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    },
    [detectPose, isDetecting]
  );

  /**
   * Stop continuous detection
   */
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    frameCountRef.current = 0;
  }, []);

  return {
    isLoading,
    error,
    isDetecting,
    detectPose,
    extractPosesFromVideo,
    startContinuousDetection,
    stopDetection
  };
}

/**
 * Draw pose skeleton on canvas
 */
export function drawPoseSkeleton(
  canvas: HTMLCanvasElement,
  landmarks: PoseLandmark[],
  videoWidth: number,
  videoHeight: number,
  color: string = '#00FF00'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw connections
  const connections = [
    [11, 12], [11, 23], [12, 24], [23, 24], // Torso
    [11, 13], [13, 15], // Left arm
    [12, 14], [14, 16], // Right arm
    [23, 25], [25, 27], // Left leg
    [24, 26], [26, 28]  // Right leg
  ];

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  connections.forEach(([start, end]) => {
    const startLm = landmarks[start];
    const endLm = landmarks[end];

    if (startLm.visibility > 0.5 && endLm.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startLm.x * videoWidth, startLm.y * videoHeight);
      ctx.lineTo(endLm.x * videoWidth, endLm.y * videoHeight);
      ctx.stroke();
    }
  });

  // Draw landmarks
  ctx.fillStyle = color;
  landmarks.forEach((lm) => {
    if (lm.visibility > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * videoWidth, lm.y * videoHeight, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}
