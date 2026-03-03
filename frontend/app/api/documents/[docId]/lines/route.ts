// frontend/app/api/documents/[docId]/lines/route.ts
import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function GET(req: Request, { params }: { params: { docId: string } }) {
    const url = new URL(req.url);
    const qs = url.searchParams.toString(); // page=1&limit=500

    const res = await fetch(
        `${API_BASE}/documents/${params.docId}/lines${qs ? `?${qs}` : ""}`,
        {
            method: "GET",
            headers: { accept: "application/json" },
            cache: "no-store",
        }
    );

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
}