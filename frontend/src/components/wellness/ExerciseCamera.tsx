/**
 * Exercise Camera Component (Patient)
 * Real-time pose detection and evaluation during exercise
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, StopCircle, Play, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { usePoseDetection, drawPoseSkeleton } from '@/hooks/usePoseDetection';
import { requestCameraAccess, stopCameraStream, generateFeedback, calculateSimilarity } from '@/lib/pose-utils';
import { api } from '@/lib/api';
import { Exercise, PoseFrame } from '@/types/exercise.types';

interface ExerciseCameraProps {
  exercise: Exercise;
  onComplete?: (evaluation: any) => void;
}

export function ExerciseCamera({ exercise, onComplete }: ExerciseCameraProps) {
  const { t, i18n } = useTranslation();
  const { startContinuousDetection, stopDetection, isDetecting } = usePoseDetection();
  
  const [showConsent, setShowConsent] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isExercising, setIsExercising] = useState(false);
  const [currentRep, setCurrentRep] = useState(0);
  const [feedback, setFeedback] = useState<string>('');
  const [similarityScore, setSimilarityScore] = useState(0);
  const [recordedFrames, setRecordedFrames] = useState<PoseFrame[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [fatigueLevel, setFatigueLevel] = useState(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentFrameIndexRef = useRef(0);
  const frameBufferRef = useRef<PoseFrame[]>([]);

  const startCamera = async () => {
    setIsStarting(true);
    try {
      const stream = await requestCameraAccess();
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setShowConsent(false);
    } catch (error) {
      console.error('Failed to start camera:', error);
      alert(t('Camera access denied. Please enable camera permissions.'));
    } finally {
      setIsStarting(false);
    }
  };

  const startExercise = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsExercising(true);
    setCurrentRep(0);
    frameBufferRef.current = [];
    currentFrameIndexRef.current = 0;

    const cleanup = startContinuousDetection(videoRef.current, (pose) => {
      // Store frame
      frameBufferRef.current.push(pose);

      // Get reference frame for comparison
      const refFrameIndex = Math.min(
        currentFrameIndexRef.current,
        exercise.reference_pose.frames.length - 1
      );
      const refFrame = exercise.reference_pose.frames[refFrameIndex];

      // Calculate similarity
      const similarity = calculateSimilarity(
        refFrame.angles,
        pose.angles,
        exercise.tolerance
      );
      setSimilarityScore(Math.round(similarity));

      // Generate feedback
      const feedbackMessage = generateFeedback(
        refFrame.angles,
        pose.angles,
        exercise.tolerance,
        i18n.language as 'en' | 'ar'
      );
      if (feedbackMessage) {
        setFeedback(feedbackMessage);
      }

      // Draw skeleton
      if (canvasRef.current && videoRef.current) {
        const color = similarity > 70 ? '#00FF00' : similarity > 50 ? '#FFFF00' : '#FF0000';
        drawPoseSkeleton(
          canvasRef.current,
          pose.landmarks,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight,
          color
        );
      }

      // Advance frame counter
      currentFrameIndexRef.current++;

      // Auto-stop after completing expected duration
      const expectedFrames = exercise.reference_pose.frames.length * exercise.expected_reps;
      if (frameBufferRef.current.length >= expectedFrames) {
        stopExercise();
      }
    });

    // Store cleanup function
    return cleanup;
  };

  const stopExercise = () => {
    stopDetection();
    setIsExercising(false);
    setRecordedFrames([...frameBufferRef.current]);
    setShowResults(true);
  };

  const submitEvaluation = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/exercises/evaluate', {
        exercise_name: i18n.language === 'ar' ? exercise.name_ar : exercise.name,
        completed: true,
        pain_level: painLevel,
        fatigue_level: fatigueLevel,
        notes: notes || undefined
      });

      onComplete?.({ completed: true, pain_level: painLevel, fatigue_level: fatigueLevel });
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      alert(t('Failed to save exercise evaluation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const cleanup = () => {
    if (cameraStream) {
      stopCameraStream(cameraStream);
      setCameraStream(null);
    }
    if (isExercising) {
      stopDetection();
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  if (showConsent) {
    return (
      <Dialog open={showConsent} onOpenChange={setShowConsent}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('Camera Permission Required')}</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('We need camera access to detect your pose during exercise')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2 text-sm">
                <p className="font-semibold">{t('Privacy Notice:')}</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>{t('Your video is NOT recorded or stored')}</li>
                  <li>{t('Only pose data (joint positions) is saved')}</li>
                  <li>{t('You can stop the exercise at any time')}</li>
                  <li>{t('This is not a medical diagnosis')}</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={startCamera} disabled={isStarting} className="flex-1">
                  {isStarting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('Starting...')}
                    </>
                  ) : (
                    <>
                      <Camera className="mr-2 h-4 w-4" />
                      {t('Allow Camera')}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowConsent(false)}>
                  {t('Cancel')}
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{t('Exercise Complete!')}</CardTitle>
          <CardDescription>{t('How did you feel?')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">
              {t('You completed')} {recordedFrames.length} {t('frames')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label>{t('Pain Level')} (0-10): {painLevel}</Label>
              <Slider
                value={[painLevel]}
                onValueChange={(value) => setPainLevel(value[0])}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>{t('Fatigue Level')} (0-10): {fatigueLevel}</Label>
              <Slider
                value={[fatigueLevel]}
                onValueChange={(value) => setFatigueLevel(value[0])}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="notes">{t('Notes (Optional)')}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('How did the exercise feel?')}
                className="mt-2"
              />
            </div>
          </div>

          <Button
            onClick={submitEvaluation}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('Submitting...')}
              </>
            ) : (
              t('Submit Evaluation')
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{i18n.language === 'ar' ? exercise.name_ar : exercise.name}</CardTitle>
        <CardDescription>
          {i18n.language === 'ar' ? exercise.instructions_ar : exercise.instructions}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Camera View */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            width={640}
            height={480}
          />

          {/* Overlay UI */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
              <p className="text-sm font-semibold">{t('Rep')}: {currentRep} / {exercise.expected_reps}</p>
            </div>

            <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  similarityScore > 70 ? 'bg-green-500' :
                  similarityScore > 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-white text-sm font-semibold">{similarityScore}%</span>
              </div>
            </div>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div className="absolute bottom-4 left-4 right-4">
              <Alert className="bg-black/70 backdrop-blur-sm border-white/20 text-white">
                <AlertDescription className="text-center font-semibold">
                  {feedback}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('Progress')}</span>
            <span>{Math.round((frameBufferRef.current.length / (exercise.reference_pose.frames.length * exercise.expected_reps)) * 100)}%</span>
          </div>
          <Progress 
            value={(frameBufferRef.current.length / (exercise.reference_pose.frames.length * exercise.expected_reps)) * 100} 
          />
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          {!isExercising ? (
            <Button onClick={startExercise} className="flex-1" size="lg">
              <Play className="mr-2 h-5 w-5" />
              {t('Start Exercise')}
            </Button>
          ) : (
            <Button onClick={stopExercise} variant="destructive" className="flex-1" size="lg">
              <StopCircle className="mr-2 h-5 w-5" />
              {t('Stop Exercise')}
            </Button>
          )}
        </div>

        {/* Safety Warning */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {t('Stop immediately if you feel pain or discomfort. This is not medical advice.')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
