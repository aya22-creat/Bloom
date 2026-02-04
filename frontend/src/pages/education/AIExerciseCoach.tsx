import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
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
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number>(0);
  const lastRepState = useRef<"up" | "down">("down");

  const { toast } = useToast();

  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.ready();
        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        const detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );
        detectorRef.current = detector;
        setIsModelLoading(false);
        setFeedback("Align your body in the camera view");
        runDetection();
      } catch (err) {
        console.error("Failed to load MoveNet:", err);
        setFeedback("Error loading AI model. Please refresh.");
      }
    };

    loadModel();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const runDetection = async () => {
    if (
      detectorRef.current &&
      webcamRef.current &&
      webcamRef.current.video &&
      webcamRef.current.video.readyState === 4
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // Set canvas dimensions
      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
      }

      const poses = await detectorRef.current.estimatePoses(video);

      if (poses.length > 0) {
        drawCanvas(poses[0], videoWidth, videoHeight);
        analyzePose(poses[0]);
      }
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
    // Basic Arm Raise Logic (Shoulder - Elbow - Wrist)
    const leftShoulder = pose.keypoints.find((k) => k.name === "left_shoulder");
    const leftElbow = pose.keypoints.find((k) => k.name === "left_elbow");
    const leftWrist = pose.keypoints.find((k) => k.name === "left_wrist");

    if (
      leftShoulder && leftElbow && leftWrist &&
      (leftShoulder.score || 0) > 0.3 &&
      (leftElbow.score || 0) > 0.3 &&
      (leftWrist.score || 0) > 0.3
    ) {
      // Calculate angle
      const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);
      
      // Logic for Arm Raise
      // Arm is down (angle near 180 or > 150 relative to body, but simplified here)
      // Actually let's check wrist height vs shoulder height
      
      const wristAboveShoulder = leftWrist.y < leftShoulder.y;
      
      if (wristAboveShoulder) {
        setFeedback("Hold... Good extension!");
        setIsCorrectForm(true);
        if (lastRepState.current === "down") {
          lastRepState.current = "up";
        }
      } else {
        setFeedback("Raise your arms higher!");
        setIsCorrectForm(false);
        if (lastRepState.current === "up") {
          setRepCount((prev) => prev + 1);
          lastRepState.current = "down";
          toast({
            title: "Rep Completed! 🎉",
            description: "Good form. Keep going!",
            duration: 1500,
          });
        }
      }
    } else {
      setFeedback("Make sure your upper body is visible");
      setIsCorrectForm(false);
    }
  };

  const calculateAngle = (p1: any, p2: any, p3: any) => {
    const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
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

      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {isModelLoading && (
          <div className="absolute z-20 flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 animate-spin text-primary" />
            <p>Loading AI Vision Model...</p>
          </div>
        )}

        {cameraError ? (
          <div className="text-center p-8 max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Camera Error</h3>
            <p className="text-zinc-400 mb-4">We couldn't access your camera. Please ensure you've granted permission.</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
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
            
            {/* Feedback Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full flex items-center gap-3 z-20 border border-white/10">
              {isCorrectForm ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Activity className="w-6 h-6 text-amber-500" />
              )}
              <span className={`font-semibold ${isCorrectForm ? 'text-green-400' : 'text-white'}`}>
                {feedback}
              </span>
            </div>
          </div>
        )}
      </main>
      
      <div className="p-6 bg-zinc-900 border-t border-zinc-800">
         <p className="text-center text-zinc-500 text-sm">
           Ensure you are in a well-lit room and your full upper body is visible.
         </p>
      </div>
    </div>
  );
};

export default AIExerciseCoach;
