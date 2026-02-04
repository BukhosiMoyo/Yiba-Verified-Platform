
import { CohortList } from "@/components/institution/attendance/CohortList";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Cohorts | Attendance",
    description: "Manage attendance cohorts and sessions",
};

export default function CohortsPage() {
    return (
        <div className="space-y-6">
            <CohortList />
        </div>
    );
}
