"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingTable } from "@/components/shared/LoadingTable";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
// Using native Date formatting instead of date-fns

interface AnalyticsData {
  metrics: {
    total: number;
    queued: number;
    sending: number;
    sent: number;
    delivered: number;
    opened: number;
    accepted: number;
    failed: number;
    retrying: number;
    expired: number;
  };
  rates: {
    openRate: number;
    acceptanceRate: number;
    failureRate: number;
  };
  statusCounts: Array<{ status: string; count: number }>;
  charts: {
    deliveryOverTime: Array<{ date: string; count: number }>;
    openRateOverTime: Array<{ date: string; opened: number; sent: number; rate: number }>;
    acceptanceRateOverTime: Array<{ date: string; accepted: number; sent: number; rate: number }>;
  };
  failureReasons: Array<{ reason: string; count: number }>;
}

export default function InviteAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    institution_id: "",
    role: "",
    start_date: "",
    end_date: "",
    status: "",
  });

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch("/api/platform-admin/institutions?limit=100");
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.institution_id) params.set("institution_id", filters.institution_id);
      if (filters.role) params.set("role", filters.role);
      if (filters.start_date) params.set("start_date", filters.start_date);
      if (filters.end_date) params.set("end_date", filters.end_date);
      if (filters.status) params.set("status", filters.status);

      const response = await fetch(`/api/platform-admin/invites/analytics?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const SimpleBarChart = ({
    data,
    labelKey,
    valueKey,
    title,
  }: {
    data: Array<Record<string, any>>;
    labelKey: string;
    valueKey: string;
    title: string;
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map((d) => d[valueKey] || 0));

    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="space-y-2">
          {data.map((item, idx) => {
            const value = item[valueKey] || 0;
            const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">
                    {item[labelKey]
                      ? new Date(item[labelKey]).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SimpleLineChart = ({
    data,
    labelKey,
    valueKey,
    title,
    formatValue,
  }: {
    data: Array<Record<string, any>>;
    labelKey: string;
    valueKey: string;
    title: string;
    formatValue?: (value: number) => string;
  }) => {
    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available
        </div>
      );
    }

    const maxValue = Math.max(...data.map((d) => d[valueKey] || 0));
    const minValue = Math.min(...data.map((d) => d[valueKey] || 0));
    const range = maxValue - minValue || 1;

    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="relative h-48">
          <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={data
                .map(
                  (item, idx) =>
                    `${(idx / (data.length - 1 || 1)) * 400},${
                      200 - ((item[valueKey] || 0) - minValue) / range * 200
                    }`
                )
                .join(" ")}
            />
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {data.length > 0 && (
              <>
                <span>
                  {new Date(data[0][labelKey]).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>
                  {new Date(data[data.length - 1][labelKey]).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Min: {formatValue ? formatValue(minValue) : minValue}</span>
          <span className="text-gray-600">Max: {formatValue ? formatValue(maxValue) : maxValue}</span>
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return <LoadingTable />;
  }

  if (error && !data) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="No analytics data"
        description="Analytics will appear here once invites are created"
        icon={<Mail className="h-12 w-12 text-gray-400" />}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invite Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track invite delivery, opens, and acceptance rates
          </p>
        </div>
        <Button variant="outline" onClick={fetchAnalytics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Institution</Label>
              <Select
                value={filters.institution_id}
                onChange={(e) =>
                  setFilters({ ...filters, institution_id: e.target.value })
                }
              >
                <option value="">All Institutions</option>
                {institutions.map((inst) => (
                  <option key={inst.institution_id} value={inst.institution_id}>
                    {inst.trading_name || inst.legal_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="">All Roles</option>
                <option value="PLATFORM_ADMIN">Platform Admin</option>
                <option value="QCTO_USER">QCTO User</option>
                <option value="INSTITUTION_ADMIN">Institution Admin</option>
                <option value="INSTITUTION_STAFF">Institution Staff</option>
                <option value="STUDENT">Student</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="QUEUED">Queued</option>
                <option value="SENT">Sent</option>
                <option value="OPENED">Opened</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="FAILED">Failed</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites</CardTitle>
            <Mail className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.metrics.queued} queued, {data.metrics.sending} sending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Send className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.sent}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.metrics.delivered} delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opened</CardTitle>
            <Eye className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.opened}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.rates.openRate.toFixed(1)}% open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.metrics.accepted}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.rates.acceptanceRate.toFixed(1)}% acceptance rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {data.statusCounts.map((item) => (
              <Badge key={item.status} variant="outline" className="text-sm">
                {item.status}: {item.count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Over Time</CardTitle>
            <CardDescription>Invites created per day</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={data.charts.deliveryOverTime}
              labelKey="date"
              valueKey="count"
              title=""
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Open Rate Over Time</CardTitle>
            <CardDescription>Percentage of sent invites opened</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={data.charts.openRateOverTime}
              labelKey="date"
              valueKey="rate"
              title=""
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance Rate Over Time</CardTitle>
            <CardDescription>Percentage of sent invites accepted</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={data.charts.acceptanceRateOverTime}
              labelKey="date"
              valueKey="rate"
              title=""
              formatValue={(v) => `${v.toFixed(1)}%`}
            />
          </CardContent>
        </Card>

        {data.failureReasons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Failure Reasons</CardTitle>
              <CardDescription>Top failure reasons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.failureReasons.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm text-gray-700 truncate flex-1">{item.reason}</span>
                    <Badge variant="destructive">{item.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
