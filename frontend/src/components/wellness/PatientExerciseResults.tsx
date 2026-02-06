/**
 * Patient Exercise Results
 * View exercise history and progress
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Calendar, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { ExerciseEvaluation, ExerciseStats } from '@/types/exercise.types';

export function PatientExerciseResults() {
  const { t } = useTranslation();
  const [evaluations, setEvaluations] = useState<ExerciseEvaluation[]>([]);
  const [stats, setStats] = useState<ExerciseStats[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [evalsRes, statsRes, progressRes] = await Promise.all([
        api.get('/exercises/evaluations/my?limit=10'),
        api.get('/exercises/stats/my'),
        api.get('/exercises/progress/my')
      ]);

      setEvaluations(evalsRes.data.data);
      setStats(statsRes.data.data);
      setProgress(progressRes.data.data);
    } catch (error) {
      console.error('Failed to load exercise data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTrendIndicator = (trend: number) => {
    if (trend > 5) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-semibold">+{trend}%</span>
        </div>
      );
    }
    if (trend < -5) {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <TrendingDown className="h-4 w-4" />
          <span className="text-sm font-semibold">{trend}%</span>
        </div>
      );
    }
    return <span className="text-sm text-muted-foreground">{t('Stable')}</span>;
  };

  // Prepare chart data
  const chartData = evaluations.slice(0, 7).reverse().map((evaluation, idx) => ({
    date: new Date(evaluation.session_date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    score: evaluation.score,
    accuracy: evaluation.accuracy
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('Loading...')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('My Exercise Progress')}</h1>
        <p className="text-muted-foreground">{t('Track your rehabilitation journey')}</p>
      </div>

      {/* Overall Progress Summary */}
      {progress && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Total Sessions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{progress.total_sessions}</span>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Average Score')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{progress.average_score}</span>
                <span className="text-muted-foreground">/100</span>
              </div>
              <Progress value={progress.average_score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Improvement')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {progress.improvement_trend > 0 ? '+' : ''}
                  {progress.improvement_trend}
                </span>
                {getTrendIndicator(progress.improvement_trend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('Last Session')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {progress.last_session_date
                    ? new Date(progress.last_session_date).toLocaleDateString()
                    : t('Never')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Score Trend Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Score Trend')}</CardTitle>
            <CardDescription>{t('Your performance over the last 7 sessions')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name={t('Score')}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name={t('Accuracy')}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Exercise Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.exercise_id}>
            <CardHeader>
              <CardTitle className="text-lg">{stat.exercise_name}</CardTitle>
              <CardDescription>
                {stat.total_sessions} {t('sessions completed')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{t('Average Score')}</span>
                  <span className="font-semibold">{stat.average_score}</span>
                </div>
                <Progress value={stat.average_score} className="h-2" />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Accuracy')}</span>
                  <span className="font-medium">{stat.average_accuracy}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Completion Rate')}</span>
                  <span className="font-medium">{stat.completion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Trend')}</span>
                  {getTrendIndicator(stat.improvement_trend)}
                </div>
              </div>

              {stat.alerts_count > 0 && (
                <Badge variant="destructive" className="w-full justify-center">
                  {stat.alerts_count} {t('alert(s)')}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('Recent Sessions')}</CardTitle>
          <CardDescription>{t('Your latest exercise evaluations')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <div
                key={evaluation.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold">{evaluation.exercise_name}</p>
                    {evaluation.doctor_reviewed && (
                      <Badge variant="outline" className="text-xs">
                        {t('Reviewed')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(evaluation.session_date).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('Score')}</p>
                    <p className="text-2xl font-bold">{evaluation.score}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{t('Reps')}</p>
                    <p className="text-sm font-medium">
                      {evaluation.reps_completed}/{evaluation.reps_expected}
                    </p>
                  </div>

                  <div className={`w-3 h-3 rounded-full ${getScoreColor(evaluation.score)}`} />
                </div>
              </div>
            ))}

            {evaluations.length === 0 && (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('No exercise sessions yet')}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('Start your first exercise to see your progress here')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Doctor Reviews */}
      {evaluations.some((e) => e.doctor_reviewed) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('Doctor Reviews')}</CardTitle>
            <CardDescription>{t('Feedback from your doctor')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluations
                .filter((e) => e.doctor_reviewed)
                .map((evaluation) => (
                  <div key={evaluation.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{evaluation.exercise_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(evaluation.reviewed_at!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-blue-600">{t('Score')}: {evaluation.score}</Badge>
                    </div>
                    <p className="text-sm mt-2">{evaluation.doctor_notes}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
