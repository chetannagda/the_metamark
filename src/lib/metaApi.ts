import { config } from "./config";

const GRAPH = `https://graph.facebook.com/${config.meta.graphVersion}`;

export type CreatedIds = {
	campaignId: string;
	adsetId: string;
	creativeId: string;
	adId: string;
};

async function graph(path: string, init?: RequestInit): Promise<any> {
	const url = `${GRAPH}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(config.meta.accessToken)}`;
	const res = await fetch(url, init);
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Meta API ${res.status}: ${text}`);
	}
	return res.json();
}

export async function uploadImage(file: File): Promise<string> {
	const form = new FormData();
	form.append("source", file);
	const data = await graph(`/act_${config.meta.adAccountId}/adimages`, { method: "POST", body: form });
	return data?.images?.[0]?.hash || data?.hash;
}

export async function uploadVideo(file: File): Promise<string> {
	const form = new FormData();
	form.append("source", file);
	const data = await graph(`/act_${config.meta.adAccountId}/advideos`, { method: "POST", body: form });
	return data?.id;
}

export async function createCampaign(name: string, objective: string, status: "PAUSED" | "ACTIVE" = "PAUSED"): Promise<string> {
	const body = new URLSearchParams({
		name,
		objective,
		status,
		buying_type: "AUCTION",
		// Required by Meta Marketing API; use NONE unless you actually fall under special categories
		special_ad_categories: "[\"NONE\"]",
	});
	const data = await graph(`/act_${config.meta.adAccountId}/campaigns`, { method: "POST", body });
	return data.id;
}

function mapToOutcomeObjective(inputObjective: string): string {
  switch (inputObjective) {
    case "LEAD_GENERATION":
      return "OUTCOME_LEADS";
    case "ENGAGEMENT":
      return "OUTCOME_ENGAGEMENT";
    case "LINK_CLICKS":
      return "OUTCOME_TRAFFIC";
    case "AWARENESS":
      return "OUTCOME_AWARENESS";
    default:
      return inputObjective; // assume already an OUTCOME_* value
  }
}

export async function createAdSet(params: {
	campaignId: string;
	name: string;
	budgetDaily: number;
	countries: string[];
	minAge: number;
	maxAge: number;
	optimizationGoal: string;
	billingEvent: string;
	status?: "PAUSED" | "ACTIVE";
}): Promise<string> {
	const targeting: any = {
		geo_locations: { countries: params.countries },
		age_min: params.minAge,
		age_max: params.maxAge,
		targeting_automation: { advantage_audience: 0 },
	};
	const body = new URLSearchParams({
		name: params.name,
		campaign_id: params.campaignId,
		daily_budget: String(Math.round(params.budgetDaily * 100)),
		targeting: JSON.stringify(targeting),
		optimization_goal: params.optimizationGoal,
		billing_event: params.billingEvent,
		// Avoids requirement to pass bid_amount or constraints
		bid_strategy: "LOWEST_COST_WITHOUT_CAP",
		promoted_object: JSON.stringify({ page_id: config.meta.pageId }),
		status: params.status || "PAUSED",
	});
	const data = await graph(`/act_${config.meta.adAccountId}/adsets`, { method: "POST", body });
	return data.id;
}

export async function createCreativeWithLink(params: {
	pageId: string;
	message: string;
	websiteUrl: string;
	imageHash?: string;
	videoId?: string;
}): Promise<string> {
	const objectStorySpec: any = {
		page_id: params.pageId,
		link_data: {
			message: params.message,
			link: params.websiteUrl,
		},
	};
	if (params.imageHash) objectStorySpec.link_data.image_hash = params.imageHash;
	if (params.videoId) objectStorySpec.video_data = { message: params.message, video_id: params.videoId };
	const body = new URLSearchParams({
		name: `Creative - ${new Date().toISOString()}`,
		object_story_spec: JSON.stringify(objectStorySpec),
	});
	const data = await graph(`/act_${config.meta.adAccountId}/adcreatives`, { method: "POST", body });
	return data.id;
}

export async function createAd(params: { adsetId: string; creativeId: string; name: string; status?: "PAUSED" | "ACTIVE" }): Promise<string> {
	const body = new URLSearchParams({
		name: params.name,
		adset_id: params.adsetId,
		creative: JSON.stringify({ creative_id: params.creativeId }),
		status: params.status || "PAUSED",
	});
	const data = await graph(`/act_${config.meta.adAccountId}/ads`, { method: "POST", body });
	return data.id;
}

export async function fullLaunchSequence(params: {
	campaignName: string;
	objective: string;
	message: string;
	websiteUrl: string;
	budgetDaily: number;
	minAge: number;
	maxAge: number;
	countries: string[];
	media?: { imageHash?: string; videoId?: string };
	activate?: boolean;
}): Promise<CreatedIds> {
	const outcomeObjective = mapToOutcomeObjective(params.objective);
	const campaignId = await createCampaign(params.campaignName, outcomeObjective, params.activate ? "ACTIVE" : "PAUSED");
	const adsetId = await createAdSet({
		campaignId,
		name: `${params.campaignName} - Set`,
		budgetDaily: params.budgetDaily,
		countries: params.countries,
		minAge: params.minAge,
		maxAge: params.maxAge,
		optimizationGoal: params.objective === "LEAD_GENERATION" ? "LEAD_GENERATION" : "LINK_CLICKS",
		billingEvent: params.objective === "LEAD_GENERATION" ? "IMPRESSIONS" : "LINK_CLICKS",
		status: params.activate ? "ACTIVE" : "PAUSED",
	});
	const creativeId = await createCreativeWithLink({
		pageId: config.meta.pageId,
		message: params.message,
		websiteUrl: params.websiteUrl,
		imageHash: params.media?.imageHash,
		videoId: params.media?.videoId,
	});
	const adId = await createAd({ adsetId, creativeId, name: `${params.campaignName} - Ad`, status: params.activate ? "ACTIVE" : "PAUSED" });
	return { campaignId, adsetId, creativeId, adId };
}

export async function setAdStatus(adId: string, status: "ACTIVE" | "PAUSED"): Promise<void> {
	const body = new URLSearchParams({ status });
	await graph(`/${adId}`, { method: "POST", body });
}
