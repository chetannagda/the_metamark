"use client";
import { useState, useMemo } from "react";
import { Sparkles, Send, Rocket, Pause, Play, Upload, Globe, IndianRupee } from "lucide-react";

type Plan = {
  campaignName: string;
  objective: "LEAD_GENERATION" | "ENGAGEMENT" | "LINK_CLICKS" | "AWARENESS";
  message: string;
  websiteUrl?: string;
  budgetDaily: number;
  minAge: number;
  maxAge: number;
  countries: string[];
};

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [imageHash, setImageHash] = useState<string | undefined>();
  const [videoId, setVideoId] = useState<string | undefined>();
  const [activate, setActivate] = useState(false);
  const [created, setCreated] = useState<{ campaignId?: string; adsetId?: string; creativeId?: string; adId?: string }>({});

  const objectiveOptions = useMemo(
    () => [
      { label: "Leads", value: "LEAD_GENERATION" },
      { label: "Engagement", value: "ENGAGEMENT" },
      { label: "Traffic", value: "LINK_CLICKS" },
      { label: "Awareness", value: "AWARENESS" },
    ],
    [],
  );

  async function handlePlan() {
    setLoading(true);
    try {
      const res = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      if (res.ok) {
        setPlan(data.plan);
        setWebsiteUrl("");
      } else {
        alert(data.error || "Failed to plan");
      }
    } finally {
      setLoading(false);
    }
  }

  async function upload(kind: "image" | "video") {
    const file = kind === "image" ? imageFile : videoFile;
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      // no need to pass kind; backend auto-detects, but keep for backward-compat
      form.append("kind", kind);
      const res = await fetch("/api/meta/media", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "Upload failed");
      if (data.media?.imageHash) setImageHash(data.media.imageHash);
      if (data.media?.videoId) setVideoId(data.media.videoId);
      // reset chosen file after successful upload
      setImageFile(null);
      setVideoFile(null);
      setFileInputKey((k) => k + 1);
    } finally {
      setUploading(false);
    }
  }

  async function launch() {
    if (!plan) return;
    setLaunching(true);
    const res = await fetch("/api/meta/launch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaignName: plan.campaignName,
        objective: plan.objective,
        message: plan.message,
        websiteUrl: websiteUrl || plan.websiteUrl || "https://facebook.com",
        budgetDaily: plan.budgetDaily,
        minAge: plan.minAge,
        maxAge: plan.maxAge,
        countries: plan.countries,
        media: { imageHash, videoId },
        activate,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Launch failed");
    } else {
      setCreated(data.ids);
    }
    setLaunching(false);
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="h-7 w-7 text-indigo-600" /> Meta AI Ads Planner
        </h1>
        <p className="mt-2 text-sm text-zinc-600">Describe your business. We’ll plan an optimal Meta campaign.</p>

        <div className="mt-6 rounded-xl border bg-zinc-50 p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., We are a local yoga studio in Mumbai offering beginner classes..."
            className="w-full rounded-md border bg-white p-3 text-sm focus:outline-none"
            rows={4}
          />
          <button onClick={handlePlan} disabled={loading || !prompt} className="mt-3 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-2 text-white disabled:opacity-50">
            {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" /> : <Send className="h-4 w-4" />} {loading ? "Generating..." : "Generate Plan"}
          </button>
        </div>

        {plan && (
          <div className="mt-8 grid gap-6">
            <div className="rounded-xl border p-4">
              <h2 className="font-medium">Prefilled Campaign</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm">Campaign Name
                  <input value={plan.campaignName} onChange={(e) => setPlan({ ...plan, campaignName: e.target.value })} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
                </label>
                <label className="text-sm">Campaign Objective
                  <select value={plan.objective} onChange={(e) => setPlan({ ...plan, objective: e.target.value as any })} className="mt-1 w-full rounded-md border bg-white p-2 text-sm">
                    {objectiveOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <label className="col-span-1 sm:col-span-2 text-sm">Ad Message
                  <textarea value={plan.message} onChange={(e) => setPlan({ ...plan, message: e.target.value })} rows={3} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
                </label>
                <label className="text-sm">Website URL
                  <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://your-site.com" className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
                </label>
                <label className="text-sm">Daily Budget (INR)
                  <div className="mt-1 flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-zinc-500" />
                    <input type="number" min={100} value={plan.budgetDaily} onChange={(e) => setPlan({ ...plan, budgetDaily: Number(e.target.value) })} className="w-full rounded-md border bg-white p-2 text-sm" />
                  </div>
                </label>
                <label className="text-sm">Age Min
                  <input type="number" value={plan.minAge} onChange={(e) => setPlan({ ...plan, minAge: Number(e.target.value) })} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
                </label>
                <label className="text-sm">Age Max
                  <input type="number" value={plan.maxAge} onChange={(e) => setPlan({ ...plan, maxAge: Number(e.target.value) })} className="mt-1 w-full rounded-md border bg-white p-2 text-sm" />
                </label>
                <label className="text-sm">Target Country
                  <div className="mt-1 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-zinc-500" />
                    <input value={plan.countries[0]} onChange={(e) => setPlan({ ...plan, countries: [e.target.value] })} className="w-full rounded-md border bg-white p-2 text-sm" />
                  </div>
                </label>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h2 className="font-medium">Media</h2>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm">Ad Media (Image or Video)
                  <input
                    id="ad-media-input"
                    type="file"
                    accept="image/*,video/*"
                    key={fileInputKey}
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (!f) { setImageFile(null); setVideoFile(null); return; }
                      if (f.type.startsWith("video/")) { setVideoFile(f); setImageFile(null); }
                      else { setImageFile(f); setVideoFile(null); }
                    }}
                    className="hidden"
                  />
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!imageFile && !videoFile) {
                          (document.getElementById("ad-media-input") as HTMLInputElement | null)?.click();
                        } else {
                          upload(videoFile ? "video" : "image");
                        }
                      }}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                    >
                      {uploading ? <span className="h-4 w-4 animate-spin rounded-full border border-zinc-400 border-t-zinc-700" /> : <Upload className="h-4 w-4" />} {(!imageFile && !videoFile) ? "Choose & Upload" : (uploading ? "Uploading..." : "Upload Selected")}
                    </button>
                  </div>
                  {(imageHash || videoId) && <p className="mt-1 text-xs text-green-600">Uploaded ✓</p>}
                </label>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Actions</h2>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
                  {activate ? (
                    <span className="inline-flex items-center gap-1 text-green-700"><Play className="h-4 w-4" /> Active on launch</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-zinc-600"><Pause className="h-4 w-4" /> Paused on launch</span>
                  )}
                </label>
              </div>
              <button onClick={launch} disabled={launching} className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-white disabled:opacity-50">
                {launching ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" /> : <Rocket className="h-4 w-4" />} {launching ? "Launching..." : "Launch Ad"}
              </button>
            </div>

            {(created.campaignId || created.adsetId || created.adId) && (
              <div className="rounded-xl border p-4">
                <h2 className="font-medium">Created IDs</h2>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
                  {created.campaignId && <div>Campaign ID: <code>{created.campaignId}</code></div>}
                  {created.adsetId && <div>Ad Set ID: <code>{created.adsetId}</code></div>}
                  {created.creativeId && <div>Creative ID: <code>{created.creativeId}</code></div>}
                  {created.adId && <div>Ad ID: <code>{created.adId}</code></div>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
