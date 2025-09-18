import { NextRequest, NextResponse } from "next/server";
import { assertConfig } from "@/lib/config";

export async function GET(req: NextRequest) {
	assertConfig();
	const { searchParams } = new URL(req.url);
	const id = searchParams.get("id");
	if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
	try {
		const res = await fetch(`https://graph.facebook.com/${process.env.META_GRAPH_API_VERSION || "v18.0"}/${id}?fields=id,name,status&access_token=${encodeURIComponent(process.env.META_ACCESS_TOKEN || "")}`);
		const data = await res.json();
		return NextResponse.json({ data });
	} catch (e: any) {
		return NextResponse.json({ error: e.message || "Status fetch failed" }, { status: 500 });
	}
}
