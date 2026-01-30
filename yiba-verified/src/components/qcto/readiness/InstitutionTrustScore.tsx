"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Loader2, Info, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InstitutionTrustScoreProps {
  institutionId: string;
}

interface TrustScoreData {
  score: number;
  trend: "UP" | "DOWN" | "STABLE";
  explanation: string;
  factors: {
    submission_completeness_avg: number;
    approval_success_rate: number;
    return_frequency: number;
    avg_reviewer_confidence: number | null;
  };
}

/**
 * Institution Trust Score Component
 * 
 * Displays QCTO-only trust score with:
 * - Score (0-100) with visual indicator
 * - Trend indicator (↑ ↓ →)
 * - Short explanation
 * - Tooltip showing scoring factors
 */
export function InstitutionTrustScore({ institutionId }: InstitutionTrustScoreProps) {
  const [trustScore, setTrustScore] = useState<TrustScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrustScore() {
      try {
        setLoading(true);
        const response = await fetch(`/api/qcto/institutions/${institutionId}/trust-score`);
        if (!response.ok) {
          throw new Error("Failed to fetch trust score");
        }
        const data = await response.json();
        setTrustScore(data);
      } catch (err: any) {
        setError(err.message || "Failed to load trust score");
      } finally {
        setLoading(false);
      }
    }

    fetchTrustScore();
  }, [institutionId]);

  if (loading) {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardHeader className="bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-transparent border-b">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !trustScore) {
    return (
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="bg-gradient-to-r from-red-50/60 to-white dark:from-red-950/30 dark:to-transparent border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Trust Score</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Error loading score</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50/50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-900 dark:text-red-300">
              {error || "Unable to load trust score. Please try refreshing the page."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getTrendIcon = () => {
    switch (trustScore.trend) {
      case "UP":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DOWN":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getTrendColor = () => {
    switch (trustScore.trend) {
      case "UP":
        return "text-green-600";
      case "DOWN":
        return "text-red-600";
      default:
        return "text-slate-500 dark:text-slate-400";
    }
  };

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardHeader className="bg-gradient-to-r from-emerald-50/60 to-white dark:from-emerald-950/30 dark:to-transparent border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
            <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Trust Score</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">QCTO internal scoring</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</span>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(trustScore.score)}`}>
                  {trustScore.score}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/ 100</span>
                <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                  {getTrendIcon()}
                  <span className="text-xs font-medium capitalize">{trustScore.trend.toLowerCase()}</span>
                </div>
              </div>
            </div>
            <Progress value={trustScore.score} className="h-2" />
          </div>

          <div>
            <p className="text-sm text-slate-700 dark:text-slate-300">{trustScore.explanation}</p>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 underline">
                  View scoring factors
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium">Submission Completeness:</span>{" "}
                    {trustScore.factors.submission_completeness_avg}%
                  </div>
                  <div>
                    <span className="font-medium">Approval Success Rate:</span>{" "}
                    {trustScore.factors.approval_success_rate}%
                  </div>
                  <div>
                    <span className="font-medium">Return Frequency:</span>{" "}
                    {trustScore.factors.return_frequency}%
                  </div>
                  {trustScore.factors.avg_reviewer_confidence !== null && (
                    <div>
                      <span className="font-medium">Avg Reviewer Confidence:</span>{" "}
                      {trustScore.factors.avg_reviewer_confidence}%
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
