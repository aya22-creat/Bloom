/**
 * Doctor Exercise Dashboard
 * View patient exercise results and manage exercises
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, TrendingUp, TrendingDown, Eye, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { ExerciseEvaluation } from '@/types/exercise.types';

export function DoctorExerciseDashboard() {
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState<ExerciseEvaluation[]>([]);
  const [alertEvaluations, setAlertEvaluations] = useState<ExerciseEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<ExerciseEvaluation | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadEvaluations();
    loadAlerts();
  }, []);

  const loadEvaluations = async () => {
    try {
      const response = await api.get('/exercises/evaluations/all');
      setEvaluations(response.data.data);
    } catch (error) {
      console.error('Failed to load evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await api.get('/exercises/evaluations/alerts');
      setAlertEvaluations(response.data.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const submitReview = async () => {
    if (!selectedEvaluation || !reviewNotes) return;

    setIsSubmittingReview(true);
    try {
      await api.post(`/exercises/evaluations/${selectedEvaluation.id}/review`, {
        notes: reviewNotes
      });

      // Refresh data
      await loadEvaluations();
      await loadAlerts();

      setSelectedEvaluation(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(t('Failed to submit review'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('Exercise Evaluations')}</h1>
          <p className="text-muted-foreground">{t('Monitor patient exercise performance')}</p>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts" className="relative">
            {t('Alerts')}
            {alertEvaluations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alertEvaluations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">{t('All Evaluations')}</TabsTrigger>
          <TabsTrigger value="recent">{t('Recent')}</TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alertEvaluations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('No alerts at this time')}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t('Evaluations Requiring Review')}</CardTitle>
                <CardDescription>
                  {t('Patients with low scores or safety concerns')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Patient')}</TableHead>
                      <TableHead>{t('Exercise')}</TableHead>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead>{t('Score')}</TableHead>
                      <TableHead>{t('Warnings')}</TableHead>
                      <TableHead>{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertEvaluations.map((evaluation) => (
                      <TableRow key={evaluation.id} className="bg-red-50">
                        <TableCell className="font-medium">
                          {evaluation.patient_name}
                        </TableCell>
                        <TableCell>{evaluation.exercise_name}</TableCell>
                        <TableCell>
                          {new Date(evaluation.session_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getScoreColor(evaluation.score)}`}>
                            {evaluation.score}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {evaluation.warnings?.slice(0, 2).map((warning, idx) => (
                              <Badge key={idx} variant="destructive" className="text-xs">
                                {warning}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedEvaluation(evaluation)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('Review')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Evaluations Tab */}
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('All Exercise Evaluations')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{t('Loading...')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('Patient')}</TableHead>
                      <TableHead>{t('Exercise')}</TableHead>
                      <TableHead>{t('Date')}</TableHead>
                      <TableHead>{t('Score')}</TableHead>
                      <TableHead>{t('Accuracy')}</TableHead>
                      <TableHead>{t('Reps')}</TableHead>
                      <TableHead>{t('Status')}</TableHead>
                      <TableHead>{t('Actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">
                          {evaluation.patient_name}
                        </TableCell>
                        <TableCell>{evaluation.exercise_name}</TableCell>
                        <TableCell>
                          {new Date(evaluation.session_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${getScoreColor(evaluation.score)}`}>
                            {evaluation.score}
                          </span>
                        </TableCell>
                        <TableCell>{evaluation.accuracy}%</TableCell>
                        <TableCell>
                          {evaluation.reps_completed} / {evaluation.reps_expected}
                        </TableCell>
                        <TableCell>
                          {evaluation.has_alerts ? (
                            <Badge variant="destructive">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              {t('Alert')}
                            </Badge>
                          ) : evaluation.doctor_reviewed ? (
                            <Badge variant="outline">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              {t('Reviewed')}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{t('Pending')}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedEvaluation(evaluation)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('View')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Tab */}
        <TabsContent value="recent" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {evaluations.slice(0, 6).map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{evaluation.patient_name}</CardTitle>
                  <CardDescription>{evaluation.exercise_name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('Score')}</span>
                    <span className={`text-2xl font-bold ${getScoreColor(evaluation.score)}`}>
                      {evaluation.score}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Accuracy')}</span>
                      <span className="font-medium">{evaluation.accuracy}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Reps')}</span>
                      <span className="font-medium">
                        {evaluation.reps_completed}/{evaluation.reps_expected}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('Pain')}</span>
                      <span className="font-medium">{evaluation.pain_level}/10</span>
                    </div>
                  </div>

                  {evaluation.has_alerts && (
                    <Badge variant="destructive" className="w-full justify-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      {t('Requires Review')}
                    </Badge>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedEvaluation(evaluation)}
                  >
                    {t('View Details')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Evaluation Detail Dialog */}
      <Dialog
        open={selectedEvaluation !== null}
        onOpenChange={(open) => !open && setSelectedEvaluation(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Evaluation Details')}</DialogTitle>
          </DialogHeader>

          {selectedEvaluation && (
            <div className="space-y-6">
              {/* Patient & Exercise Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('Patient')}</Label>
                  <p className="font-semibold">{selectedEvaluation.patient_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('Exercise')}</Label>
                  <p className="font-semibold">{selectedEvaluation.exercise_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('Date')}</Label>
                  <p className="font-semibold">
                    {new Date(selectedEvaluation.session_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('Score')}</Label>
                  <p className={`text-2xl font-bold ${getScoreColor(selectedEvaluation.score)}`}>
                    {selectedEvaluation.score}
                  </p>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('Accuracy')}</Label>
                  <p className="font-semibold">{selectedEvaluation.accuracy}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('Reps Completed')}</Label>
                  <p className="font-semibold">
                    {selectedEvaluation.reps_completed} / {selectedEvaluation.reps_expected}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('Pain Level')}</Label>
                  <p className="font-semibold">{selectedEvaluation.pain_level} / 10</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('Fatigue Level')}</Label>
                  <p className="font-semibold">{selectedEvaluation.fatigue_level} / 10</p>
                </div>
              </div>

              {/* Warnings */}
              {selectedEvaluation.warnings && selectedEvaluation.warnings.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">{t('Warnings')}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEvaluation.warnings.map((warning, idx) => (
                      <Badge key={idx} variant="destructive">
                        {warning.replace('_', ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient Notes */}
              {selectedEvaluation.patient_notes && (
                <div>
                  <Label className="text-muted-foreground">{t('Patient Notes')}</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">
                    {selectedEvaluation.patient_notes}
                  </p>
                </div>
              )}

              {/* Doctor Review Section */}
              {!selectedEvaluation.doctor_reviewed ? (
                <div className="space-y-4 border-t pt-4">
                  <Label htmlFor="review">{t('Doctor Review')}</Label>
                  <Textarea
                    id="review"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t('Add your review and recommendations...')}
                    rows={4}
                  />
                  <Button
                    onClick={submitReview}
                    disabled={!reviewNotes || isSubmittingReview}
                    className="w-full"
                  >
                    {isSubmittingReview ? t('Submitting...') : t('Submit Review')}
                  </Button>
                </div>
              ) : (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">{t('Doctor Review')}</Label>
                  <p className="mt-1 p-3 bg-green-50 rounded-md">
                    {selectedEvaluation.doctor_notes}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('Reviewed on')} {new Date(selectedEvaluation.reviewed_at!).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
