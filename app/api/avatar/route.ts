import { NextResponse } from "next/server";
import sharp from "sharp";
import { currentMember, } from "@/lib/session";
import { setAvatar } from "@/lib/members";
import { storage } from "@/lib/firebase";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);

// Accepts a photo, crops/resizes it to a 256x256 PNG, stores it in the public
// Cloud Storage bucket, and points the member's avatar at it.
export async function POST(req: Request) {
  const member = await currentMember();
  if (!member) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a PNG, JPEG, or WebP image." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Image is too large (max 5 MB)." },
      { status: 400 },
    );
  }

  if (!process.env.STORAGE_BUCKET) {
    return NextResponse.json(
      { error: "Photo uploads aren't configured yet." },
      { status: 503 },
    );
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const png = await sharp(input)
      .rotate() // respect EXIF orientation
      .resize(256, 256, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();

    const bucket = storage.bucket();
    const path = `avatars/${member.email}.png`;
    await bucket.file(path).save(png, {
      contentType: "image/png",
      resumable: false,
      metadata: { cacheControl: "public, max-age=86400" },
    });

    // Bucket is configured for public read (allUsers: objectViewer). Add a
    // cache-busting query so the new image shows immediately.
    const url = `https://storage.googleapis.com/${bucket.name}/${path}?v=${Date.now()}`;
    await setAvatar(member.email, { type: "upload", value: url });

    return NextResponse.json({ ok: true, url });
  } catch (err) {
    console.error("Avatar upload failed:", err);
    return NextResponse.json(
      { error: "Couldn't process that image. Try another." },
      { status: 500 },
    );
  }
}
