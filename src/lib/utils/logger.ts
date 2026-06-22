/* eslint-disable no-console */
/**
 * Minimal structured logger (NFR4.2). Emits JSON lines so log processors can
 * parse them. In production this is where Sentry breadcrumbs / Datadog hooks go.
 */
type Meta = Record<string, unknown>;

function emit(level: "info" | "warn" | "error", message: string, meta?: Meta) {
  const line = JSON.stringify({ level, message, time: new Date().toISOString(), ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Meta) => emit("info", message, meta),
  warn: (message: string, meta?: Meta) => emit("warn", message, meta),
  error: (message: string, meta?: Meta) => emit("error", message, meta),
};
