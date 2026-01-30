"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const userFlows = {
  institutions: [
    { step: "Register", desc: "Create your institution account and complete verification" },
    { step: "Setup", desc: "Add staff members and configure permissions" },
    { step: "Document", desc: "Complete readiness forms and upload evidence" },
    { step: "Submit", desc: "Submit for QCTO review and track status" },
    { step: "Manage", desc: "Onboard learners and maintain compliance" },
  ],
  qcto: [
    { step: "Access", desc: "Log in to dedicated QCTO reviewer dashboard" },
    { step: "Review", desc: "Evaluate institutional submissions with all evidence" },
    { step: "Decide", desc: "Approve, request revisions, or flag issues" },
    { step: "Monitor", desc: "Track compliance across all institutions" },
    { step: "Report", desc: "Generate insights and compliance reports" },
  ],
  students: [
    { step: "Enroll", desc: "Get registered by your institution on the platform" },
    { step: "Profile", desc: "View and manage your learner profile" },
    { step: "Track", desc: "Monitor your learning progress and milestones" },
    { step: "Evidence", desc: "Access your uploaded evidence and assessments" },
    { step: "Verify", desc: "Obtain verification of your qualifications" },
  ],
} as const;

type TabKey = keyof typeof userFlows;

export function YourJourneySection() {
  const [activeTab, setActiveTab] = useState<TabKey>("institutions");

  return (
    <>
      <div className="mx-auto max-w-2xl text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your Journey on Yiba Verified
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          See how the platform works for your specific role.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as TabKey)}
        className="w-full max-w-4xl mx-auto"
      >
        <TabsList className="grid w-full grid-cols-3 mb-8 h-auto p-1 items-center justify-center">
          <TabsTrigger value="institutions" className="py-3" activeVariant="primary">
            For Institutions
          </TabsTrigger>
          <TabsTrigger value="qcto" className="py-3" activeVariant="primary">
            For QCTO
          </TabsTrigger>
          <TabsTrigger value="students" className="py-3" activeVariant="primary">
            For Students
          </TabsTrigger>
        </TabsList>

        {(Object.entries(userFlows) as [TabKey, (typeof userFlows)[TabKey]][]).map(([key, flows]) => (
          <TabsContent key={key} value={key} className="mt-0">
            <Card className="border-[var(--border-subtle)] bg-card">
              <CardContent className="pt-6">
                <div className="relative">
                  <div
                    className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20 hidden md:block"
                    aria-hidden
                  />
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
                    {flows.map((flow, index) => (
                      <div key={index} className="relative text-center">
                        <div className="flex justify-center mb-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold relative z-10">
                            {index + 1}
                          </div>
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">{flow.step}</h4>
                        <p className="text-sm text-muted-foreground">{flow.desc}</p>
                        {index < flows.length - 1 && (
                          <div className="flex justify-center my-4 md:hidden">
                            <ArrowRight
                              className="h-5 w-5 text-primary/50 rotate-90"
                              aria-hidden
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
