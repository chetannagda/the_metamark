import { config } from "./config";

export type AdPlan = {
	campaignName: string;
	objective: "LEAD_GENERATION" | "ENGAGEMENT" | "LINK_CLICKS" | "AWARENESS";
	message: string;
	websiteUrl?: string;
	budgetDaily: number;
	minAge: number;
	maxAge: number;
	countries: string[];
	genders?: ("male" | "female")[];
	interests?: string[];
};

export async function generateAdPlanFromPrompt(prompt: string): Promise<AdPlan> {
	const { endpoint, apiKey, deployment, apiVersion } = config.azure;
	if (!endpoint || !apiKey) {
		throw new Error("Azure OpenAI is not configured");
	}

	const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;
	const system =
		"You are a Meta Ads strategist. Given a short business description, output a concise JSON with fields: campaignName, objective (LEAD_GENERATION|ENGAGEMENT|LINK_CLICKS|AWARENESS), message, budgetDaily (INR), minAge, maxAge, countries (ISO codes array), interests (array), genders (subset of ['male','female']). Keep it realistic for India by default.";
	const body = {
		messages: [
			{ role: "system", content: system },
			{ role: "user", content: prompt },
		],
		temperature: 0.4,
		response_format: { type: "json_object" },
	};
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"api-key": apiKey,
		},
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Azure OpenAI error: ${res.status} ${text}`);
	}
	const data = await res.json();
	const content = data?.choices?.[0]?.message?.content;
	let parsed: AdPlan;
	try {
		parsed = JSON.parse(content);
	} catch {
		throw new Error("Invalid JSON from Azure OpenAI");
	}
	if (!parsed.countries || parsed.countries.length === 0) parsed.countries = [config.defaults.country];
	if (!parsed.budgetDaily || parsed.budgetDaily < 100) parsed.budgetDaily = 500;
	if (!parsed.minAge) parsed.minAge = 21;
	if (!parsed.maxAge) parsed.maxAge = 55;
	return parsed;
}
