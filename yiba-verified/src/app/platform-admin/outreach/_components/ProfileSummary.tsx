import { InstitutionOutreachProfile } from "@/lib/outreach/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge } from "./StageBadge";
import { StatusIcon } from "./StatusIcon";
import { EngagementScoreGauge } from "../../invites/_components/EngagementScoreGauge";
import { Mail, Phone, Globe, MapPin, Calendar, Clock, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ProfileSummaryProps {
    institution: InstitutionOutreachProfile;
}

export function ProfileSummary({ institution }: ProfileSummaryProps) {
    return (
        <Card className="h-full">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg">{institution.institution_name}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Globe className="mr-1 h-3 w-3" />
                            <a
                                href={`https://${institution.domain}`}
                                target="_blank"
                                rel="noreferrer"
                                className="hover:underline"
                            >
                                {institution.domain}
                            </a>
                        </div>
                    </div>
                    <EngagementScoreGauge score={institution.engagement_score} size="sm" showLabel={false} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Status
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <StageBadge stage={institution.engagement_stage} />
                            <div className="flex items-center space-x-2">
                                <StatusIcon status={institution.status_flags} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Location
                        </div>
                        <div className="flex items-center text-sm">
                            <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                            {institution.province}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                            Timing
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center">
                                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                Last active: {new Date(institution.last_activity).toLocaleDateString()}
                            </div>
                            {institution.next_scheduled_step && (
                                <div className="flex items-center text-blue-600 dark:text-blue-400">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Next step: {new Date(institution.next_scheduled_step).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <div className="mb-3 text-xs font-medium uppercase text-muted-foreground">
                        Contacts ({institution.contacts.length})
                    </div>
                    <div className="space-y-4">
                        {institution.contacts.map((contact) => (
                            <div key={contact.contact_id} className="flex items-start space-x-3 text-sm">
                                <div className="mt-0.5 rounded-full bg-muted p-1">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                </div>
                                <div>
                                    <div className="font-medium">
                                        {contact.first_name} {contact.last_name}
                                        {contact.primary && (
                                            <span className="ml-2 text-xs text-muted-foreground">(Primary)</span>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">{contact.role}</div>
                                    <div className="mt-1 flex items-center text-xs text-muted-foreground">
                                        <Mail className="mr-1 h-3 w-3" />
                                        {contact.email}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
