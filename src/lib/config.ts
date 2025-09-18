export const config = {
	azure: {
		endpoint: process.env.AZURE_OPENAI_ENDPOINT || "",
		apiKey: process.env.AZURE_OPENAI_API_KEY || "",
		deployment: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
		apiVersion: process.env.AZURE_OPENAI_API_VERSION || "2025-01-01-preview",
	},
	meta: {
		graphVersion: process.env.META_GRAPH_API_VERSION || "v18.0",
		accessToken: process.env.META_ACCESS_TOKEN || "",
		adAccountId: process.env.META_AD_ACCOUNT_ID || "",
		pageId: process.env.META_PAGE_ID || "",
	},
	defaults: {
		country: process.env.DEFAULT_COUNTRY || "IN",
		currency: process.env.DEFAULT_CURRENCY || "INR",
	},
};

export function assertConfig(): void {
	const missing: string[] = [];
	if (!config.azure.endpoint) missing.push("AZURE_OPENAI_ENDPOINT");
	if (!config.azure.apiKey) missing.push("AZURE_OPENAI_API_KEY");
	if (!config.meta.accessToken) missing.push("META_ACCESS_TOKEN");
	if (!config.meta.adAccountId) missing.push("META_AD_ACCOUNT_ID");
	if (!config.meta.pageId) missing.push("META_PAGE_ID");
	if (missing.length) {
		console.warn(
			`Warning: Missing environment variables: ${missing.join(", ")}. Some features may not work until set.`,
		);
	}
}
