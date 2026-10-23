import { ZodError } from "zod";

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return Response.json({ error: { code: "VALIDATION_ERROR", message: "Check the submitted fields.", fields: error.flatten().fieldErrors } }, { status: 400 });
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : message === "Not found" ? 404 : 400;
  return Response.json({ error: { code: "REQUEST_FAILED", message } }, { status });
}