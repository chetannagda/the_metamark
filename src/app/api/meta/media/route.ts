import { NextRequest, NextResponse } from "next/server";
import { uploadImage, uploadVideo } from "@/lib/metaApi";
import { assertConfig } from "@/lib/config";

export async function POST(req: NextRequest) {
	assertConfig();
	const form = await req.formData();
	const file = form.get("file");
    const kind = form.get("kind"); // optional, fallback to file.type detection
	if (!(file instanceof File)) {
		return NextResponse.json({ error: "Missing file" }, { status: 400 });
	}
	try {
        const mime = file.type || "";
        const isVideo = kind === "video" || mime.startsWith("video/");
        if (isVideo) {
			const id = await uploadVideo(file);
            return NextResponse.json({ media: { videoId: id } });
		}
        const hash = await uploadImage(file);
        return NextResponse.json({ media: { imageHash: hash } });
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : "Upload failed";
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
