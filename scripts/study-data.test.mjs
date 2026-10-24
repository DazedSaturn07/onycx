import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import test from "node:test";

async function compile(path, replacements = [], suffix = "") {
  let source = ts.transpileModule(
    await readFile(new URL(path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  for (const [from, to] of replacements) source = source.replaceAll(from, to);
  const url = `data:text/javascript;base64,${Buffer.from(source + "\n// " + suffix).toString("base64")}`;
  return { url, module: await import(url) };
}
const analytics = await compile("../src/lib/analytics-dashboards.ts");
const loader = await compile("../src/lib/dashboard-data.ts", [
  ["./analytics-dashboards", analytics.url],
]);
const client = async (suffix) =>
  (
    await compile(
      "../src/lib/study-dashboards.ts",
      [["./dashboard-data", loader.url]],
      suffix,
    )
  ).module;
const release = JSON.parse(
  await readFile(
    new URL("../public/dashboard-data/manifest.json", import.meta.url),
    "utf8",
  ),
);
const jsonResponse = (body) =>
  new Response(body, { headers: { "Content-Type": "application/json" } });
const signal = new AbortController().signal;

test("All study overviews and interaction payloads pass the same verified release loader", async () => {
  const previous = globalThis.fetch;
  try {
    const api = await client("valid");
    globalThis.fetch = async (url) =>
      url.endsWith("manifest.json")
        ? Response.json(release)
        : jsonResponse(
            await readFile(
              new URL(
                `../public/dashboard-data/${url.split("/dashboard-data/")[1].split("?")[0]}`,
                import.meta.url,
              ),
            ),
          );
    for (const slug of ["job-market", "loanflow", "airops"]) {
      assert.equal((await api.loadStudyData(slug, signal)).project, slug);
      assert.ok(
        (await api.loadStudyCube(slug, "crossfilter", signal)).rows.length > 0,
      );
    }
    assert.ok(
      (await api.loadStudyCube("airops", "hourly", signal)).rows.length > 0,
    );
  } finally {
    globalThis.fetch = previous;
  }
});

test("Study releases reject traversal, oversized payloads, corruption and incorrect schemas", async () => {
  const previous = globalThis.fetch;
  const record = release.files.find(
    (f) => f.path === "v2/loanflow/overview.json",
  );
  const replace = (value) => ({
    ...release,
    files: release.files.map((f) =>
      f === record ? { ...record, ...value } : f,
    ),
  });
  try {
    let api = await client("traversal");
    globalThis.fetch = async () =>
      Response.json(replace({ path: "../../.env" }));
    await assert.rejects(api.loadStudyData("loanflow", signal), /invalid/);
    api = await client("size");
    globalThis.fetch = async () =>
      Response.json(replace({ bytes: 12_000_001 }));
    await assert.rejects(api.loadStudyData("loanflow", signal), /invalid/);
    api = await client("tampered");
    globalThis.fetch = async (url) =>
      url.endsWith("manifest.json")
        ? Response.json(release)
        : jsonResponse('{"tampered":true}');
    await assert.rejects(
      api.loadStudyData("loanflow", signal),
      /does not match/,
    );
    api = await client("oversized");
    globalThis.fetch = async (url) =>
      url.endsWith("manifest.json")
        ? Response.json(release)
        : jsonResponse(new Uint8Array(record.bytes + 1));
    await assert.rejects(api.loadStudyData("loanflow", signal), /size limit/);
    const wrong = Buffer.from('{"version":1,"project":"airops"}');
    api = await client("schema");
    globalThis.fetch = async (url) =>
      url.endsWith("manifest.json")
        ? Response.json(
            replace({
              bytes: wrong.length,
              sha256: createHash("sha256").update(wrong).digest("hex"),
            }),
          )
        : jsonResponse(wrong);
    await assert.rejects(api.loadStudyData("loanflow", signal), /schema/);
  } finally {
    globalThis.fetch = previous;
  }
});

const query = (await compile("../src/lib/study-crossfilter.ts")).module;
const fixtures = {};
for (const slug of ["job-market", "loanflow", "airops"]) {
  fixtures[slug] = {
    data: JSON.parse(
      await readFile(
        new URL(`../public/study-data/v1/${slug}.json`, import.meta.url),
        "utf8",
      ),
    ),
    cube: JSON.parse(
      await readFile(
        new URL(
          `../public/dashboard-data/v2/${slug}/crossfilter.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  };
}
const hourly = JSON.parse(
  await readFile(
    new URL("../public/dashboard-data/v2/airops/hourly.json", import.meta.url),
    "utf8",
  ),
);
const close = (actual, expected, label) =>
  expected === null
    ? assert.equal(actual, null, label)
    : assert.ok(
        actual !== null && Math.abs(actual - expected) < 1e-6,
        `${label}: ${actual} != ${expected}`,
      );
test("Coordinated queries reproduce all 276 independently verified base cohorts", () => {
  for (const [slug, { data, cube }] of Object.entries(fixtures))
    for (const [key, base] of Object.entries(data.slices)) {
      const live = query.deriveStudySlice(
        cube,
        JSON.parse(key),
        {},
        "default",
        base,
        slug === "airops" ? hourly : undefined,
      );
      close(live.hero.value, base.hero.value, `${slug}/${key}/hero`);
      close(live.gauge.value, base.gauge.value, `${slug}/${key}/gauge`);
      live.metrics.forEach((m, i) =>
        close(m.value, base.metrics[i].value, `${slug}/${key}/${m.label}`),
      );
      for (const [key, value] of Object.entries(base.facts))
        close(live.facts[key], value, `${slug}/${key}`);
    }
});
test("Chart filters compose without changing metric grains or zero-denominator behavior", () => {
  const j = fixtures["job-market"],
    jb = j.data.slices['["All","All"]'];
  const paid = query.deriveStudySlice(
    j.cube,
    ["All", "All"],
    { salary: "Numeric salary" },
    "default",
    jb,
  );
  assert.equal(paid.hero.value, 36073);
  assert.equal(paid.gauge.value, 1);
  const entry = query.deriveStudySlice(
    j.cube,
    ["Data Analyst", "entry"],
    { entry: "Entry titles with 2+ years" },
    "default",
    jb,
  );
  assert.equal(entry.facts.entry_groups, 4);
  assert.equal(entry.facts.entry_two_plus, 4);
  const l = fixtures.loanflow,
    lb = l.data.slices['["All","All"]'];
  const pending = query.deriveStudySlice(
    l.cube,
    ["All", "All"],
    { milestone: "Pending milestone" },
    "default",
    lb,
  );
  assert.equal(pending.hero.value, 17228);
  assert.equal(pending.gauge.value, 1);
  const unresolved = query.deriveStudySlice(
    l.cube,
    ["All", "All"],
    { milestone: "Unresolved at cutoff" },
    "default",
    lb,
  );
  assert.equal(unresolved.hero.value, 98);
  assert.equal(unresolved.metrics[0].value, null);
  const a = fixtures.airops,
    ab = a.data.slices['["All","All"]'];
  const route = query.deriveStudySlice(
    a.cube,
    ["All", "All"],
    { route: "LGA-CMH" },
    "default",
    ab,
    hourly,
  );
  assert.equal(route.facts.scheduled, 1439);
  assert.equal(route.facts.arrived, 1316);
  close(route.metrics[0].value, 123 / 1439, "route cancellations");
  assert.equal(
    route.rankings.hours.reduce((n, p) => n + p.count, 0),
    1439,
  );
  const empty = query.deriveStudySlice(
    a.cube,
    ["US", "2015-12"],
    { route: "LGA-CMH" },
    "default",
    ab,
    hourly,
  );
  assert.equal(empty.hero.value, 0);
  assert.equal(empty.gauge.value, null);
  assert.ok(empty.metrics.every((m) => m.value === null));
});
