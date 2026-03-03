// frontend/app/api/documents/route.ts
import { NextResponse } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export async function GET() {
    const res = await fetch(`${API_BASE}/documents/`, {
        method: "GET",
        headers: { accept: "application/json" },
        cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
}

export async function POST(req: Request) {
    const body = await req.text(); // 그대로 전달
    const res = await fetch(`${API_BASE}/documents/`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            accept: "application/json",
        },
        body,
        cache: "no-store",
    });

    const text = await res.text();
    return new NextResponse(text, {
        status: res.status,
        headers: { "content-type": res.headers.get("content-type") || "application/json" },
    });
}