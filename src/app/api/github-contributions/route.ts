import { profile } from "@/data/portfolio";

export const revalidate = 3600;

export async function GET() {
  const username = profile.githubUsername;
  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error("Activity unavailable");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("contributions" in payload) || !Array.isArray(payload.contributions)) throw new Error("Invalid activity");
    const contributions = payload.contributions.filter((day: unknown) => {
      if (!day || typeof day !== "object" || !("date" in day) || !("count" in day) || !("level" in day)) return false;
      return typeof day.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Number.isFinite(Date.parse(`${day.date}T00:00:00Z`)) && typeof day.count === "number" && Number.isInteger(day.count) && day.count >= 0 && typeof day.level === "number" && Number.isInteger(day.level) && day.level >= 0 && day.level <= 4;
    });
    if (!contributions.length || contributions.length !== payload.contributions.length) throw new Error("Invalid activity");
    return Response.json({ contributions }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return Response.json({ error: "GitHub contribution data is temporarily unavailable." }, { status: 502 });
  }
}
