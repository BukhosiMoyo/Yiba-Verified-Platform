"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitesOverview } from "./_components/InvitesOverview";
import { CampaignsList } from "./_components/CampaignsList";
import { CsvUploadWizard } from "./_components/CsvUploadWizard";
// import { TemplatesTab } from "./_components/TemplatesTab";
// import { EmailTemplatesTableClient } from "../email-templates/EmailTemplatesTableClient";
import { DeliverabilityTab } from "./_components/DeliverabilityTab";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function InvitesPage() {
  const [activeTab, setActiveTab] = useState("overview");

  /* 
   * Note: InvitesOverview now fetches real data internally.
   * Mock data removed to clean up code.
   */

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invites</h1>
          <p className="text-muted-foreground">
            Track performance, send safely, and manage invite campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("upload")}>
            Upload CSV
          </Button>
          <Button onClick={() => setActiveTab("upload")}>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="upload">Upload List</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="deliverability">Deliverability</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <InvitesOverview />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">All Campaigns</h3>
          </div>
          <CampaignsList />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h3 className="text-lg font-medium">Import Recipients</h3>
              <p className="text-sm text-muted-foreground">Upload a CSV file to validate and create a new campaign.</p>
            </div>
            <CsvUploadWizard onSuccess={() => setActiveTab("campaigns")} />
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {/* <EmailTemplatesTableClient /> */}
          <div className="p-4 text-sm text-muted-foreground">Templates temporarily disabled for debugging.</div>
        </TabsContent>

        <TabsContent value="deliverability" className="space-y-4">
          <DeliverabilityTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
