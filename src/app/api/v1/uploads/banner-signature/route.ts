import { createHash } from "node:crypto";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

const folder = "sidestage/event-banners";

export async function POST() {
  try {
    await requireUser([UserRole.ORGANIZER]);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return Response.json({ error: { code: "UPLOAD_NOT_CONFIGURED", message: "Event image uploads are not configured yet." } }, { status: 503 });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");
    return Response.json({ data: { cloudName, apiKey, folder, timestamp, signature } });
  } catch (error) {
    return errorResponse(error);
  }
}