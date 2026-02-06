/**
 * Exercise Upload Component (Doctor)
 * Allows doctors to upload reference exercise videos
 */

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Video, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { loadVideoFromFile, addAnglesToFrames, downsampleFrames, detectKeyFrames } from '@/lib/pose-utils';
import { api } from '@/lib/api';
import { ReferencePoseData } from '@/types/exercise.types';

export function ExerciseUpload() {
  const { t } = useTranslation();
  const { extractPosesFromVideo, isLoading: isPoseModelLoading } = usePoseDetection();
  
  // Form state
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [instructions, setInstructions] = useState('');
  const [instructionsAr, setInstructionsAr] = useState('');
  const [expectedReps, setExpectedReps] = useState(5);
  const [holdSeconds, setHoldSeconds] = useState(2);
  const [tolerance, setTolerance] = useState(15);
  const [difficultyLevel, setDifficultyLevel] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [targetBodyPart, setTargetBodyPart] = useState('');
  
  // Video processing state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [referencePose, setReferencePose] = useState<ReferencePoseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video file is too large. Maximum size is 50MB');
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setError(null);
    setReferencePose(null);
  };

  const processVideo = async () => {
    if (!videoFile || !videoRef.current) return;

    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);

    try {
      // Load video
      const video = await loadVideoFromFile(videoFile);
      videoRef.current.src = video.src;

      // Wait for video to be ready
      await new Promise((resolve) => {
        videoRef.current!.onloadeddata = resolve;
      });

      // Extract poses from video
      const frames = await extractPosesFromVideo(
        videoRef.current,
        (progress) => setProcessingProgress(progress)
      );

      if (frames.length === 0) {
        throw new Error('No pose detected in video. Please ensure a person is clearly visible');
      }

      // Add angle calculations to frames
      const framesWithAngles = addAnglesToFrames(frames);

      // Downsample to 15 fps to reduce data size
      const downsampledFrames = downsampleFrames(framesWithAngles, 15, 30);

      // Detect key frames
      const keyFrameIndices = detectKeyFrames(downsampledFrames);

      // Create reference pose data
      const refPose: ReferencePoseData = {
        frames: downsampledFrames,
        fps: 15,
        duration: videoRef.current.duration,
        keyFrames: keyFrameIndices
      };

      setReferencePose(refPose);
      setProcessingProgress(100);
    } catch (err: any) {
      console.error('Video processing error:', err);
      setError(err.message || 'Failed to process video');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referencePose) {
      setError('Please process the video first');
      return;
    }

    if (!name || !nameAr) {
      setError('Please provide exercise name in both languages');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await api.post('/exercises', {
        name,
        name_ar: nameAr,
        description: description || undefined,
        description_ar: descriptionAr || undefined,
        instructions: instructions || undefined,
        instructions_ar: instructionsAr || undefined,
        reference_pose: referencePose,
        expected_reps: expectedReps,
        hold_seconds: holdSeconds,
        tolerance,
        difficulty_level: difficultyLevel,
        target_body_part: targetBodyPart || undefined
      });

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        resetForm();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to create exercise:', err);
      setError(err.response?.data?.message || 'Failed to create exercise');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setName('');
    setNameAr('');
    setDescription('');
    setDescriptionAr('');
    setInstructions('');
    setInstructionsAr('');
    setExpectedReps(5);
    setHoldSeconds(2);
    setTolerance(15);
    setDifficultyLevel('medium');
    setTargetBodyPart('');
    setVideoFile(null);
    setVideoPreview(null);
    setReferencePose(null);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t('Create New Exercise')}</CardTitle>
        <CardDescription>
          {t('Upload a reference video showing the correct movement')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Video Upload Section */}
          <div className="space-y-4">
            <Label>{t('Reference Video')}</Label>
            
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              {!videoPreview ? (
                <div>
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-4">
                    {t('Upload a short video (5-15 seconds) showing the exercise')}
                  </p>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="max-w-xs mx-auto"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <video
                    ref={videoRef}
                    src={videoPreview}
                    controls
                    className="w-full max-w-md mx-auto rounded-lg"
                  />
                  
                  {!referencePose && !isProcessing && (
                    <Button
                      type="button"
                      onClick={processVideo}
                      disabled={isPoseModelLoading}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      {t('Process Video')}
                    </Button>
                  )}

                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">{t('Processing video...')}</span>
                      </div>
                      <Progress value={processingProgress} className="w-full max-w-md mx-auto" />
                    </div>
                  )}

                  {referencePose && (
                    <Alert className="max-w-md mx-auto">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('Video processed successfully!')} {referencePose.frames.length} {t('frames detected')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Exercise Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('Exercise Name (English)')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shoulder Abduction"
                required
              />
            </div>

            <div>
              <Label htmlFor="nameAr">{t('Exercise Name (Arabic)')}</Label>
              <Input
                id="nameAr"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="رفع الذراع الجانبي"
                required
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description">{t('Description (English)')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Raise arms sideways..."
              />
            </div>

            <div>
              <Label htmlFor="descriptionAr">{t('Description (Arabic)')}</Label>
              <Textarea
                id="descriptionAr"
                value={descriptionAr}
                onChange={(e) => setDescriptionAr(e.target.value)}
                placeholder="ارفع ذراعيك جانبياً..."
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="instructions">{t('Instructions (English)')}</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Stand straight, raise arms..."
              />
            </div>

            <div>
              <Label htmlFor="instructionsAr">{t('Instructions (Arabic)')}</Label>
              <Textarea
                id="instructionsAr"
                value={instructionsAr}
                onChange={(e) => setInstructionsAr(e.target.value)}
                placeholder="قف بشكل مستقيم، ارفع الذراعين..."
                dir="rtl"
              />
            </div>
          </div>

          {/* Exercise Parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="reps">{t('Expected Reps')}</Label>
              <Input
                id="reps"
                type="number"
                min="1"
                max="50"
                value={expectedReps}
                onChange={(e) => setExpectedReps(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="hold">{t('Hold (seconds)')}</Label>
              <Input
                id="hold"
                type="number"
                min="0"
                max="30"
                value={holdSeconds}
                onChange={(e) => setHoldSeconds(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="tolerance">{t('Tolerance (°)')}</Label>
              <Input
                id="tolerance"
                type="number"
                min="5"
                max="30"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="difficulty">{t('Difficulty')}</Label>
              <Select value={difficultyLevel} onValueChange={(value: any) => setDifficultyLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">{t('Easy')}</SelectItem>
                  <SelectItem value="medium">{t('Medium')}</SelectItem>
                  <SelectItem value="hard">{t('Hard')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="bodyPart">{t('Target Body Part')}</Label>
            <Input
              id="bodyPart"
              value={targetBodyPart}
              onChange={(e) => setTargetBodyPart(e.target.value)}
              placeholder="shoulder, knee, back..."
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{t('Exercise created successfully!')}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!referencePose || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('Creating...')}
                </>
              ) : (
                t('Create Exercise')
              )}
            </Button>

            <Button type="button" variant="outline" onClick={resetForm}>
              {t('Reset')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
