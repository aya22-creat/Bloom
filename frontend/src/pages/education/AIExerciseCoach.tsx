import React, { useRef, useState, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, RefreshCw, AlertCircle, CheckCircle2, Activity, Zap } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AIExerciseCoach = () => {
  const navigate = useNavigate();
  const { userType } = useParams();
  const [searchParams] = useSearchParams();
  const exerciseName = searchParams.get("exercise") || "Arm Raises";
  
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [feedback, setFeedback] = useState("Loading AI Model...");
  const [repCount, setRepCount] = useState(0);
  const [isCorrectForm, setIsCorrectForm] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [poseDetected, setPoseDetected] = useState(false);
  const [detectionQuality, setDetectionQuality] = useState(0);
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number>(0);
  const lastRepState = useRef<"up" | "down">("down");
  const frameCountRef = useRef(0);
  const detectionCountRef = useRef(0);

  const { toast } = useToast();

  useEffect(() => {
    const loadModel = async () => {
      try {
        setFeedback("Initializing TensorFlow...");
        await tf.ready();
        
        setFeedback("Loading pose detection model...");
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        
        detectorRef.current = detector;
        setIsModelLoading(false);
        setFeedback("Ready! Position yourself in the camera");
        
        // Start detection after a short delay to ensure camera is ready
        setTimeout(() => {
          runDetection();
        }, 500);
      } catch (err) {
        console.error("Failed to load MoveNet:", err);
        setFeedback("Model error. Please refresh and allow camera access.");
        setCameraError(true);
      }
    };

    loadModel();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      tf.dispose();
    };
  }, []);

  const runDetection = async () => {
    try {
      if (
        detectorRef.current &&
        webcamRef.current &&
        webcamRef.current.video
      ) {
        const video = webcamRef.current.video;
        
        // Check if video is ready
        if (video.readyState === 4) {
          setCameraActive(true);
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;

          // Set canvas dimensions
          if (canvasRef.current) {
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;
          }

          try {
            const poses = await detectorRef.current.estimatePoses(video);

            frameCountRef.current++;
            
            if (poses.length > 0 && poses[0].keypoints.length > 0) {
              detectionCountRef.current++;
              drawCanvas(poses[0], videoWidth, videoHeight);
              analyzePose(poses[0]);
              setPoseDetected(true);
              
              // Calculate detection quality (0-100%)
              const quality = Math.min(100, Math.round((detectionCountRef.current / Math.max(frameCountRef.current, 1)) * 100));
              setDetectionQuality(quality);
            } else {
              setPoseDetected(false);
              setFeedback("No person detected. Move into the frame.");
            }
          } catch (detectionErr) {
            console.warn("Pose estimation error:", detectionErr);
            setPoseDetected(false);
          }
        }
      }
    } catch (err) {
      console.error("Detection loop error:", err);
    }

    requestRef.current = requestAnimationFrame(runDetection);
  };

  const drawCanvas = (pose: poseDetection.Pose, width: number, height: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    
    // Draw keypoints
    pose.keypoints.forEach((keypoint) => {
      if ((keypoint.score || 0) > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = isCorrectForm ? "#10b981" : "#f43f5e"; // Green if correct, Red if wrong
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw skeleton connections
    const adjacentPairs = poseDetection.util.getAdjacentPairs(poseDetection.SupportedModels.MoveNet);
    adjacentPairs.forEach(([i, j]) => {
      const kp1 = pose.keypoints[i];
      const kp2 = pose.keypoints[j];

      if ((kp1.score || 0) > 0.3 && (kp2.score || 0) > 0.3) {
        ctx.beginPath();
        ctx.moveTo(kp1.x, kp1.y);
        ctx.lineTo(kp2.x, kp2.y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });
  };

  const analyzePose = (pose: poseDetection.Pose) => {
    // Get required keypoints with quality checks
    const leftShoulder = pose.keypoints.find((k) => k.name === "left_shoulder");
    const leftElbow = pose.keypoints.find((k) => k.name === "left_elbow");
    const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");
    const rightShoulder = pose.keypoints.find((k) => k.name === "right_shoulder");
    const rightElbow = pose.keypoints.find((k) => k.name === "right_elbow");
    const rightWrist = pose.keypoints.find((k) => k.name === "right_wrist");

    const minConfidence = 0.3;
    const leftArmValid = 
      leftShoulder && leftElbow && leftWrist &&
      (leftShoulder.score || 0) > minConfidence &&
      (leftElbow.score || 0) > minConfidence &&
      (leftWrist.score || 0) > minConfidence;
    
    const rightArmValid = 
      rightShoulder && rightElbow && rightWrist &&
      (rightShoulder.score || 0) > minConfidence &&
      (rightElbow.score || 0) > minConfidence &&
      (rightWrist.score || 0) > minConfidence;

    if (leftArmValid || rightArmValid) {
      // Use whichever arm has better detection
      const arm = rightArmValid && (!leftArmValid || (rightWrist!.score || 0) > (leftWrist!.score || 0)) 
        ? { shoulder: rightShoulder!, elbow: rightElbow!, wrist: rightWrist! }
        : { shoulder: leftShoulder!, elbow: leftElbow!, wrist: leftWrist! };
      
      const wristAboveShoulder = arm.wrist.y < arm.shoulder.y;
      const armExtended = Math.abs(arm.wrist.x - arm.shoulder.x) > (Math.abs(arm.wrist.y - arm.shoulder.y) * 0.5);
      
      if (wristAboveShoulder && armExtended) {
        setFeedback("✓ Great form! Hold it!");
        setIsCorrectForm(true);
        if (lastRepState.current === "down") {
          lastRepState.current = "up";
        }
      } else if (!wristAboveShoulder) {
        setFeedback("↑ Raise your arms higher");
        setIsCorrectForm(false);
        if (lastRepState.current === "up") {
          setRepCount((prev) => prev + 1);
          lastRepState.current = "down";
          toast({
            title: "Rep Completed! 🎉",
            description: "Excellent form!",
            duration: 1500,
          });
        }
      } else {
        setFeedback("← Extend your arms more");
        setIsCorrectForm(false);
      }
    } else {
      setFeedback("Position upper body in frame");
      setIsCorrectForm(false);
    }
  };

  const calculateAngle = (p1: any, p2: any, p3: any) => {
    try {
      const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
      let angle = Math.abs((radians * 180.0) / Math.PI);
      if (angle > 180.0) angle = 360 - angle;
      return angle;
    } catch {
      return 0;
    }
  };

  const calculateDistance = (p1: any, p2: any) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="p-4 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-white" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{exerciseName}</h1>
            <p className="text-sm text-zinc-400">AI Coach Active</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-800 px-4 py-2 rounded-full">
            <span className="text-zinc-400 text-xs uppercase font-bold mr-2">Reps</span>
            <span className="text-2xl font-bold text-primary">{repCount}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black">
        {isModelLoading && (
          <div className="absolute z-20 flex flex-col items-center gap-4 bg-black/80 backdrop-blur-lg px-8 py-6 rounded-2xl">
            <RefreshCw className="w-12 h-12 animate-spin text-primary" />
            <p className="text-lg font-semibold">Loading AI Vision Model...</p>
            <p className="text-sm text-zinc-400">This may take a moment</p>
          </div>
        )}

        {cameraError ? (
          <div className="text-center p-8 max-w-md bg-black/80 backdrop-blur-lg rounded-2xl border border-red-500/20">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
            <p className="text-zinc-400 mb-2">Permission denied or camera not available</p>
            <p className="text-sm text-zinc-500 mb-6">Please check your browser settings and allow camera access to continue.</p>
            <Button onClick={() => window.location.reload()} className="w-full">Try Again</Button>
          </div>
        ) : (
          <div className="relative w-full max-w-2xl aspect-video bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
            <Webcam
              ref={webcamRef}
              className="absolute inset-0 w-full h-full object-cover"
              mirrored
              onUserMediaError={() => setCameraError(true)}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover z-10"
            />
            
            {/* Status Indicators */}
            <div className="absolute top-6 right-6 flex gap-3 z-20">
              <div className={`px-4 py-2 rounded-full backdrop-blur-md ${
                cameraActive ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
              }`}>
                <span className={`text-sm font-semibold flex items-center gap-2 ${
                  cameraActive ? 'text-green-300' : 'text-red-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    cameraActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`} />
                  {cameraActive ? 'Camera Live' : 'No Camera'}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-full backdrop-blur-md ${
                poseDetected ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-gray-500/20 border border-gray-500/50'
              }`}>
                <span className={`text-sm font-semibold flex items-center gap-2 ${
                  poseDetected ? 'text-blue-300' : 'text-gray-300'
                }`}>
                  <Zap className="w-4 h-4" />
                  Quality: {detectionQuality}%
                </span>
              </div>
            </div>

            {/* Feedback Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 z-20 border border-white/20">
              {isCorrectForm ? (
                <CheckCircle2 className="w-6 h-6 text-green-500 animate-pulse" />
              ) : (
                <Activity className="w-6 h-6 text-amber-500" />
              )}
              <span className={`font-semibold text-lg ${
                isCorrectForm ? 'text-green-400' : 'text-white'
              }`}>
                {feedback}
              </span>
            </div>
          </div>
        )}
      </main>
      
      <div className="p-6 bg-zinc-900 border-t border-zinc-800 space-y-3">
        <div className="grid grid-cols-3 gap-4 text-xs text-zinc-400">
          <div className="text-center">
            <p className="font-semibold text-white mb-1">Lighting</p>
            <p>Face a light source</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-white mb-1">Distance</p>
            <p>Sit 2-3 feet away</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-white mb-1">Visibility</p>
            <p>Full upper body visible</p>
          </div>
        </div>
        <p className="text-center text-zinc-500 text-xs">
          💡 Ensure good lighting and position yourself centrally in the frame for best results.
        </p>
      </div>
    </div>
  );
};

export default AIExerciseCoach;
