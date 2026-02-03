
import { CVEditor } from "../_components/CVEditor";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create CV | Yiba Verified",
};

export default function NewCVPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <CVEditor isNew={true} />
        </div>
    );
}
