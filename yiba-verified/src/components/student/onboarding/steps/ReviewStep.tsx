"use client";

import { OnboardingStepWrapper } from "../OnboardingStepWrapper";
import { OnboardingNavigation } from "../OnboardingNavigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pencil, 
  User, 
  MapPin, 
  Users, 
  Info, 
  GraduationCap, 
  Briefcase,
  CheckCircle2,
  Calendar,
  Phone,
  Mail
} from "lucide-react";
import { GENDER_OPTIONS, NATIONALITY_OPTIONS, ETHNICITY_OPTIONS, DISABILITY_STATUS_OPTIONS, NEXT_OF_KIN_RELATIONSHIP_OPTIONS, HOME_LANGUAGE_OPTIONS } from "@/lib/onboarding-constants";
import { PROVINCES } from "@/lib/provinces";

interface ReviewStepProps {
  allData: {
    personalInfo?: any;
    addressInfo?: any;
    nextOfKinInfo?: any;
    additionalInfo?: any;
    popiaConsent?: boolean;
    pastQualifications?: any[];
    priorLearning?: any[];
  };
  onNext: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
}

export function ReviewStep({ allData, onNext, onBack, onEditStep }: ReviewStepProps) {
  const getGenderLabel = (code: string) => GENDER_OPTIONS.find((o) => o.value === code)?.label || code;
  const getNationalityLabel = (code: string) => NATIONALITY_OPTIONS.find((o) => o.value === code)?.label || code;
  const getEthnicityLabel = (code: string) => ETHNICITY_OPTIONS.find((o) => o.value === code)?.label || code;
  const getDisabilityLabel = (code: string) => DISABILITY_STATUS_OPTIONS.find((o) => o.value === code)?.label || code;
  const getRelationshipLabel = (code: string) => NEXT_OF_KIN_RELATIONSHIP_OPTIONS.find((o) => o.value === code)?.label || code;
  const getHomeLanguageLabel = (code: string) => HOME_LANGUAGE_OPTIONS.find((o) => o.value === code)?.label || code;

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    try {
      return new Date(dateString).toLocaleDateString("en-ZA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <OnboardingStepWrapper
      title="Review Your Information"
      description="Please review all the information you've provided. You can edit any section before completing your onboarding."
    >
      <div className="space-y-6">
        {/* Personal Information */}
        <Card className="border-2 border-blue-100/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold">Personal Information</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEditStep(2)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ID Number</div>
                <div className="text-sm font-medium text-foreground">{allData.personalInfo?.national_id || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date of Birth
                </div>
                <div className="text-sm font-medium text-foreground">{formatDate(allData.personalInfo?.birth_date)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </div>
                <div className="text-sm font-medium text-foreground">{allData.personalInfo?.phone || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gender</div>
                <div className="text-sm font-medium text-foreground">
                  {allData.personalInfo?.gender_code ? getGenderLabel(allData.personalInfo.gender_code) : "—"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nationality</div>
                <div className="text-sm font-medium text-foreground">
                  {allData.personalInfo?.nationality_code ? getNationalityLabel(allData.personalInfo.nationality_code) : "—"}
                </div>
              </div>
              {allData.personalInfo?.home_language_code && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Home Language</div>
                  <div className="text-sm font-medium text-foreground">
                    {getHomeLanguageLabel(allData.personalInfo.home_language_code)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-2 border-emerald-100/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                </div>
                <CardTitle className="text-xl font-semibold">Address & Location</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEditStep(3)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Physical Address
                </div>
                <div className="text-sm font-medium text-foreground leading-relaxed">
                  {allData.addressInfo?.address || "—"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Province</div>
                <div>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    {allData.addressInfo?.province || "—"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next of Kin */}
        <Card className="border-2 border-violet-100/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-50">
                  <Users className="h-5 w-5 text-violet-600" />
                </div>
                <CardTitle className="text-xl font-semibold">Next of Kin</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEditStep(4)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</div>
                <div className="text-sm font-medium text-foreground">{allData.nextOfKinInfo?.name || "—"}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Relationship</div>
                <div className="text-sm font-medium text-foreground">
                  {allData.nextOfKinInfo?.relationship ? getRelationshipLabel(allData.nextOfKinInfo.relationship) : "—"}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  Phone Number
                </div>
                <div className="text-sm font-medium text-foreground">{allData.nextOfKinInfo?.phone || "—"}</div>
              </div>
              {allData.nextOfKinInfo?.address && (
                <div className="space-y-1 md:col-span-2">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Address
                  </div>
                  <div className="text-sm font-medium text-foreground leading-relaxed">
                    {allData.nextOfKinInfo.address}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-2 border-amber-100/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <Info className="h-5 w-5 text-amber-600" />
                </div>
                <CardTitle className="text-xl font-semibold">Additional Information</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => onEditStep(5)} className="gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Disability Status</div>
                <div>
                  <Badge 
                    variant={allData.additionalInfo?.disability_status === "YES" ? "default" : "secondary"}
                    className={
                      allData.additionalInfo?.disability_status === "YES" 
                        ? "bg-amber-100 text-amber-800 border-amber-200" 
                        : ""
                    }
                  >
                    {allData.additionalInfo?.disability_status ? getDisabilityLabel(allData.additionalInfo.disability_status) : "—"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ethnicity</div>
                <div>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {allData.additionalInfo?.ethnicity ? getEthnicityLabel(allData.additionalInfo.ethnicity) : "—"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* POPIA Consent */}
        {allData.popiaConsent && (
          <Card className="border-2 border-green-100/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold">POPIA Consent</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEditStep(6)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50/50 border border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-green-900">Consent Provided</div>
                  <div className="text-xs text-green-700 mt-0.5">
                    You have consented to the processing of your personal information in accordance with POPIA.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Past Qualifications */}
        {allData.pastQualifications && allData.pastQualifications.length > 0 && (
          <Card className="border-2 border-purple-100/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Past Qualifications</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEditStep(7)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allData.pastQualifications.map((q: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border border-purple-100 bg-purple-50/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="font-semibold text-foreground">{q.title || "—"}</div>
                        {q.institution && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <GraduationCap className="h-3.5 w-3.5" />
                            {q.institution}
                          </div>
                        )}
                      </div>
                      {q.year_completed && (
                        <Badge variant="outline" className="bg-white text-purple-700 border-purple-200 shrink-0">
                          {q.year_completed}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prior Learning */}
        {allData.priorLearning && allData.priorLearning.length > 0 && (
          <Card className="border-2 border-teal-100/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-teal-50">
                    <Briefcase className="h-5 w-5 text-teal-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold">Prior Learning & Experience</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => onEditStep(8)} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allData.priorLearning.map((l: any, i: number) => {
                  const startYear = l.start_date ? new Date(l.start_date).getFullYear() : null;
                  const endYear = l.end_date ? new Date(l.end_date).getFullYear() : null;
                  const dateRange = startYear 
                    ? `${startYear} - ${l.is_current ? "Present" : endYear || "—"}`
                    : "—";
                  
                  return (
                    <div key={i} className="p-3 rounded-lg border border-teal-100 bg-teal-50/30">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">{l.title || "—"}</div>
                            {l.institution && (
                              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Briefcase className="h-3.5 w-3.5" />
                                {l.institution}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-white text-teal-700 border-teal-200 shrink-0">
                            {dateRange}
                          </Badge>
                        </div>
                        {l.description && (
                          <div className="text-sm text-muted-foreground leading-relaxed pt-1 border-t border-teal-100">
                            {l.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <OnboardingNavigation
        onNext={onNext}
        onBack={onBack}
        canGoBack={true}
        canGoNext={true}
        nextLabel="Complete Onboarding"
      />
    </OnboardingStepWrapper>
  );
}
