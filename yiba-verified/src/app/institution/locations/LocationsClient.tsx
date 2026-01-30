"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddLocationForm } from "@/components/institution/AddLocationForm";
import { EmptyState } from "@/components/shared/EmptyState";
import type { InstitutionDisplay } from "@/lib/currentInstitution";

type MineResponse = {
  currentInstitutionId: string | null;
  institutionIds: string[];
  institutions: InstitutionDisplay[];
  canAdd?: boolean;
};

function institutionLabel(inst: InstitutionDisplay): string {
  if (inst.branch_code) {
    return `${inst.legal_name} (${inst.branch_code})`;
  }
  return inst.legal_name;
}

export function LocationsClient() {
  const [data, setData] = useState<MineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchMine = async () => {
    try {
      const res = await fetch("/api/institutions/mine");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMine();
  }, []);

  const handleAddSuccess = (institutionId: string) => {
    setModalOpen(false);
    fetchMine();
    // Optionally switch context to the new location
    fetch("/api/institution/context", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institution_id: institutionId }),
    }).then((r) => {
      if (r.ok) window.location.reload();
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const institutions = data?.institutions ?? [];
  const canAdd = data?.canAdd ?? false;
  const currentId = data?.currentInstitutionId ?? null;

  return (
    <div className="space-y-6">
      {canAdd && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent
            overlayClassName="bg-black/40 backdrop-blur-md"
            className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/80 bg-card shadow-xl p-6"
          >
            <DialogHeader>
              <DialogTitle>Add a new location</DialogTitle>
              <DialogDescription>
                Add another institution or branch. You can switch to it from the header after saving.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <AddLocationForm
                key={String(modalOpen)}
                onSuccess={handleAddSuccess}
                onCancel={() => setModalOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Locations</h1>
          <p className="text-muted-foreground mt-1">
            Manage your institutions and branches. Switch context in the header to work with a different location.
          </p>
        </div>
        {canAdd && (
          <Button
            onClick={() => setModalOpen(true)}
            className="rounded-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add location
          </Button>
        )}
      </div>

      {institutions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
              title="No locations yet"
              description={
                canAdd
                  ? "Add your first institution or branch to get started."
                  : "You don't have any institutions linked. Contact your admin."
              }
            />
            {canAdd && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => setModalOpen(true)} className="rounded-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add location
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {institutions.map((inst) => (
            <Card
              key={inst.institution_id}
              className={currentId === inst.institution_id ? "ring-2 ring-primary" : undefined}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium">
                    {institutionLabel(inst)}
                  </CardTitle>
                  {currentId === inst.institution_id && (
                    <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      Current
                    </span>
                  )}
                </div>
                <CardDescription className="text-xs">
                  Reg: {inst.registration_number}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Switch to this location using the dropdown in the header to view and manage its data.
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
