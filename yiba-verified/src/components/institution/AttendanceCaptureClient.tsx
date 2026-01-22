"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

type Status = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";

type Enrolment = {
  enrolment_id: string;
  qualification_title: string;
  learner: { first_name: string; last_name: string } | null;
};

type RecordRow = {
  record_id: string;
  status: string;
  notes: string | null;
  sick_note: { reason: string; has_attachment: boolean } | null;
};

type DraftRow = { status: Status; reason: string };

const STATUSES: Status[] = ["PRESENT", "ABSENT", "EXCUSED", "LATE"];

interface Props {
  date: string;
  enrolments: Enrolment[];
  recordsByEnrolmentId: Record<string, RecordRow>;
}

export function AttendanceCaptureClient({ date, enrolments, recordsByEnrolmentId }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, DraftRow>>(() => {
    const m: Record<string, DraftRow> = {};
    for (const e of enrolments) {
      const r = recordsByEnrolmentId[e.enrolment_id];
      m[e.enrolment_id] = {
        status: (r?.status as Status) || "PRESENT",
        reason: r?.sick_note?.reason || "",
      };
    }
    return m;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setStatus = (enrolmentId: string, status: Status) => {
    setDraft((prev) => ({
      ...prev,
      [enrolmentId]: { ...(prev[enrolmentId] || { status: "PRESENT", reason: "" }), status },
    }));
  };

  const setReason = (enrolmentId: string, reason: string) => {
    setDraft((prev) => ({
      ...prev,
      [enrolmentId]: { ...(prev[enrolmentId] || { status: "PRESENT", reason: "" }), reason },
    }));
  };

  const markAllPresent = () => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const e of enrolments) {
        next[e.enrolment_id] = { ...(next[e.enrolment_id] || { status: "PRESENT", reason: "" }), status: "PRESENT", reason: "" };
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    const bodies = enrolments.map((e) => {
      const d = draft[e.enrolment_id] || { status: "PRESENT" as Status, reason: "" };
      return {
        enrolment_id: e.enrolment_id,
        record_date: date,
        status: d.status,
        sick_note: (d.status === "ABSENT" || d.status === "EXCUSED") && d.reason?.trim() ? { reason: d.reason.trim() } : undefined,
      };
    });

    try {
      const results = await Promise.all(
        bodies.map((b) =>
          fetch("/api/institution/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(b),
          })
        )
      );
      const bad = results.find((r) => !r.ok);
      if (bad) {
        const t = await bad.text();
        setError(t || "Save failed");
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  if (enrolments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>No active enrolments for this date. Enrolments must be ACTIVE and within their start and completion dates.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle>Date: {date}</CardTitle>
            <CardDescription>Change date via URL: /institution/attendance/capture?date=YYYY-MM-DD</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={markAllPresent}>
              Mark all present
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save all"}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <Label htmlFor="date-picker" className="text-sm">Go to date</Label>
          <Input
            id="date-picker"
            type="date"
            value={date}
            onChange={(e) => router.replace(`/institution/attendance/capture?date=${e.target.value}`)}
            className="w-40"
          />
        </div>
        {error && <p className="text-destructive text-sm mt-2">{error}</p>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Learner</th>
                <th className="text-left py-2 px-2">Qualification</th>
                <th className="text-left py-2 px-2 w-36">Status</th>
                <th className="text-left py-2 px-2">Sick note reason (if absent/excused)</th>
              </tr>
            </thead>
            <tbody>
              {enrolments.map((e) => {
                const d = draft[e.enrolment_id] || { status: "PRESENT" as Status, reason: "" };
                const showReason = d.status === "ABSENT" || d.status === "EXCUSED";
                return (
                  <tr key={e.enrolment_id} className="border-b last:border-0">
                    <td className="py-2 px-2">
                      {e.learner ? `${e.learner.first_name} ${e.learner.last_name}` : "—"}
                    </td>
                    <td className="py-2 px-2">{e.qualification_title}</td>
                    <td className="py-2 px-2">
                      <Select
                        value={d.status}
                        onChange={(ev) => setStatus(e.enrolment_id, (ev.target as HTMLSelectElement).value as Status)}
                        className="h-9 w-32"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="py-2 px-2">
                      {showReason ? (
                        <Input
                          placeholder="e.g. Medical – flu"
                          value={d.reason}
                          onChange={(ev) => setReason(e.enrolment_id, ev.target.value)}
                          className="max-w-xs"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
