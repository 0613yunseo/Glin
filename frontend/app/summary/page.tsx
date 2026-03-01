import { Suspense } from "react";
import SummaryClient from "./SummaryClient";

export default function Page() {
    return (
        <Suspense fallback={<div className="p-6">Loading...</div>}>
            <SummaryClient />
        </Suspense>
    );
}