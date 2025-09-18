import { NextRequest, NextResponse } from "next/server";
import { generateAdPlanFromPrompt } from "@/lib/azureOpenAI";
import { assertConfig } from "@/lib/config";

export async function POST(req: NextRequest) {
	assertConfig();
	const { prompt } = await req.json();
	if (!prompt || typeof prompt !== "string") {
		return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
	}
	try {
		const plan = await generateAdPlanFromPrompt(prompt);
		return NextResponse.json({ plan });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "AI plan failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
