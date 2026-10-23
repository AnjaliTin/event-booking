import { clearSession, requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/http";

export async function POST() {
  try {
    await requireUser();
    await clearSession();
    return Response.json({ data: { signedOut: true } });
  } catch (error) {
    return errorResponse(error);
  }
}