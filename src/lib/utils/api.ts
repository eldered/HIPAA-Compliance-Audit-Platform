import { NextResponse } from "next/server";
import type { ApiError } from "@/types/domain";

/** Standard JSON success response. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, init);
}

/** Standard JSON error response. */
export function fail(message: string, status = 400, code?: string): NextResponse<ApiError> {
  return NextResponse.json({ error: message, ...(code ? { code } : {}) }, { status });
}

export const unauthorized = () => fail("Unauthorized", 401, "UNAUTHORIZED");
export const forbidden = () => fail("Forbidden", 403, "FORBIDDEN");
export const notFound = (what = "Resource") => fail(`${what} not found`, 404, "NOT_FOUND");
