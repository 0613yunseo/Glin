import { Suspense } from "react";
import AnalysisClient from "./AnalysisClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading...</div>}>
            <AnalysisClient />
        </Suspense>
    );
}