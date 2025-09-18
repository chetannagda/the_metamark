import { NextRequest, NextResponse } from "next/server";
import { fullLaunchSequence } from "@/lib/metaApi";
import { assertConfig } from "@/lib/config";

export async function POST(req: NextRequest) {
	assertConfig();
	const body = await req.json();
	try {
		const ids = await fullLaunchSequence({
			campaignName: body.campaignName,
			objective: body.objective,
			message: body.message,
			websiteUrl: body.websiteUrl,
			budgetDaily: body.budgetDaily,
			minAge: body.minAge,
			maxAge: body.maxAge,
			countries: body.countries,
			media: body.media,
			activate: body.activate,
		});
		return NextResponse.json({ ids });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Launch failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
