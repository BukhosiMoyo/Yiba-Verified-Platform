"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmailSettingsSection } from "@/components/settings/EmailSettingsSection";

export function EmailTemplatesPageContent({
    templatesTable
}: {
    templatesTable: React.ReactNode
}) {
    const [activeTab, setActiveTab] = useState("templates");

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="templates" className="space-y-4">
                {templatesTable}
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
                <EmailSettingsSection />
            </TabsContent>
        </Tabs>
    );
}
