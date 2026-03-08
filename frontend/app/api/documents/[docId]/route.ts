import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function GET(
    _: NextRequest,
    { params }: { params: Promise<{ docId: string }> }
) {
    const { docId } = await params;

    const res = await fetch(`${API_BASE}/documents/${docId}`, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: {
            "content-type": res.headers.get("content-type") || "application/json",
        },
    });
}