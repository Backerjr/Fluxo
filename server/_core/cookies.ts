import type { Response as ExpressResponse } from "express";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "http";

export type RequestLike = Pick<IncomingMessage, "headers"> & {
  protocol?: string;
};

export type ResponseLike = ExpressResponse | ServerResponse;

export type SessionCookieOptions = {
  domain?: string;
  httpOnly: boolean;
  path: string;
  sameSite: "lax" | "strict" | "none" | boolean;
  secure: boolean;
};

function getForwardedProto(headers: IncomingHttpHeaders): string | null {
  const forwardedProto = headers["x-forwarded-proto"];
  if (!forwardedProto) return null;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : `${forwardedProto}`.split(",");

  const firstProto = protoList
    .map(proto => proto.trim().toLowerCase())
    .find(Boolean);

  return firstProto ?? null;
}

function isSecureRequest(req: RequestLike) {
  const directProtocol =
    typeof req.protocol === "string" ? req.protocol.toLowerCase() : null;
  const forwardedProtocol = getForwardedProto(req.headers);
  const protocol = directProtocol ?? forwardedProtocol;
  return protocol === "https";
}

function appendSetCookieHeader(res: ServerResponse, value: string) {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", value);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing, value]);
    return;
  }

  res.setHeader("Set-Cookie", [existing as string, value]);
}

function serializeCookie(
  name: string,
  value: string,
  options: SessionCookieOptions & { maxAge?: number; expires?: Date }
) {
  const segments = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
  ];

  if (options.maxAge !== undefined) {
    segments.push(`Max-Age=${options.maxAge}`);
  }

  if (options.expires) {
    segments.push(`Expires=${options.expires.toUTCString()}`);
  }

  if (options.domain) {
    segments.push(`Domain=${options.domain}`);
  }

  if (options.path) {
    segments.push(`Path=${options.path}`);
  }

  if (options.secure) {
    segments.push("Secure");
  }

  if (options.httpOnly) {
    segments.push("HttpOnly");
  }

  if (options.sameSite) {
    const sameSite =
      options.sameSite === true
        ? "Strict"
        : typeof options.sameSite === "string"
          ? options.sameSite
          : "Lax";
    segments.push(`SameSite=${sameSite}`);
  }

  return segments.join("; ");
}

export function getSessionCookieOptions(
  req: RequestLike
): SessionCookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}

export function clearSessionCookie(
  res: ResponseLike,
  name: string,
  options: SessionCookieOptions & { maxAge?: number; expires?: Date }
) {
  const expressResponse = res as ExpressResponse;
  if (typeof expressResponse.clearCookie === "function") {
    expressResponse.clearCookie(name, {
      ...options,
      maxAge: options.maxAge ?? -1,
    });
    return;
  }

  const serialized = serializeCookie(name, "", {
    ...options,
    maxAge: options.maxAge ?? -1,
    expires: options.expires ?? new Date(0),
  });

  appendSetCookieHeader(res as ServerResponse, serialized);
}
