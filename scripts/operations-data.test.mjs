import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import worker from "../analytics/cloudflare/worker.mjs";

const read = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const source = ts
  .transpileModule(
    await readFile(
      new URL("../src/lib/operations-data.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  )
  .outputText.replace(/import \{[^}]+\} from "\.\/dashboard-data";/, "");
const engine = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const civicMeta = await read(
  "../public/dashboard-data/v2/civicpulse/overview.json",
);
const civicRows = (
  await Promise.all(
    civicMeta.parts.map((p) =>
      read(`../public/dashboard-data/v2/civicpulse/${p}.json`),
    ),
  )
).flatMap((p) => p.rows);
const civic = { ...civicMeta, rows: civicRows };
const freight = await read(
  "../public/dashboard-data/v2/freightflow/overview.json",
);
const near = (a, b, message) =>
  a === null || b === null
    ? assert.equal(a, b, message)
    : assert.ok(Math.abs(a - b) < 1e-6, `${message}: ${a} != ${b}`);

test("CivicPulse complete request population and every independently computed base/combined filter reconcile", async () => {
  const oracle = await read("./fixtures/civic-oracle.json");
  assert.equal(civicRows.length, 348180);
  for (const { filters, expected } of oracle) {
    const actual = engine.deriveCivic(civic, {
      ...engine.allCivicFilters,
      ...filters,
    }).summary;
    for (const key of Object.keys(expected))
      near(actual[key], expected[key], `${JSON.stringify(filters)} ${key}`);
  }
  console.log(
    `CivicPulse reconciled ${oracle.length} independent filter populations.`,
  );
});
test("CivicPulse preserves missing due-date denominators, recomputes percentiles and retains quality records", () => {
  const all = engine.deriveCivic(civic, engine.allCivicFilters);
  assert.equal(all.summary.backlog, 1640);
  assert.equal(all.summary.quality_issues, 3325);
  near(all.summary.median_hours, 15.096111111111112, "Median");
  near(all.summary.p90_hours, 395.4608333333333, "P90");
  const nypd = engine.deriveCivic(civic, {
    ...engine.allCivicFilters,
    agency: "NYPD",
  }).summary;
  assert.equal(nypd.requests, 153175);
  assert.equal(nypd.due_eligible, 0);
  assert.equal(engine.ratio(nypd.due_met, nypd.due_eligible), null);
  const empty = engine.deriveCivic(civic, {
    ...engine.allCivicFilters,
    agency: "DHS",
    complaint_type: "Noise - Residential",
  }).summary;
  assert.equal(empty.requests, 0);
  assert.equal(empty.median_hours, null);
  assert.equal(empty.p90_hours, null);
  const groups = engine.civicGroups(all.rows, "agency", civic.names, true);
  assert.equal(
    groups.reduce((n, g) => n + g.summary.requests, 0),
    all.summary.requests,
  );
  assert.notEqual(
    groups.reduce((n, g) => n + (g.summary.median_hours ?? 0), 0) /
      groups.length,
    all.summary.median_hours,
  );
});
test("FreightFlow summary cube reproduces independent full-fact year/trade/mode/commodity queries", async () => {
  const oracle = await read(
    "./fixtures/freight-oracle.json",
  );
  for (const { filters, expected } of oracle) {
    const s = engine.freightSummary(freight, filters);
    [s.tons, s.value, s.miles, s.records].forEach((v, i) =>
      near(v, expected[i], `${JSON.stringify(filters)} measure ${i}`),
    );
  }
  console.log(
    `FreightFlow reconciled ${oracle.length} independent filter populations.`,
  );
  const baseline = engine.freightSummary(freight, engine.allFreightFilters),
    forecast = engine.freightSummary(freight, {
      ...engine.allFreightFilters,
      year: 2050,
    });
  near(baseline.tons, 20011502.950363945, "Baseline ktons");
  near(forecast.tons, 28890491.213853948, "Forecast ktons");
  assert.equal(baseline.records, 1316715);
  const modes = engine.freightGroups(freight, engine.allFreightFilters, "mode");
  near(
    modes.reduce((n, g) => n + g.summary.tons, 0),
    baseline.tons,
    "Mode denominator",
  );
});
test("Every lazy FreightFlow lane partition reconciles to the small cube across all years", async () => {
  for (const [commodity, files] of Object.entries(freight.partitions)) {
    const rows = (
      await Promise.all(
        files.map((p) =>
          read(`../public/dashboard-data/v2/freightflow/${p}.json`),
        ),
      )
    ).flatMap((p) => p.rows);
    assert.ok(
      rows.every((r) => r.length === 14 && r.every(Number.isSafeInteger)),
      commodity,
    );
    for (const year of freight.years) {
      const filters = {
        ...engine.allFreightFilters,
        year,
        commodity: commodity === "All" ? -1 : Number(commodity),
      };
      const totals = engine.freightSummary(freight, filters),
        lanes = engine.freightLanes(freight, rows, filters);
      for (const metric of ["tons", "value", "miles", "records"])
        near(
          lanes.reduce((n, r) => n + r[metric], 0),
          totals[metric],
          `${commodity}/${year}/${metric}`,
        );
    }
  }
});
test("Source candidates preserve full eligibility, fixed global ranks and all endpoints", async () => {
  const priorities = await read(
    "../public/dashboard-data/v2/freightflow/priorities.json",
  );
  assert.equal(priorities.rows.length, 2031);
  for (const r of priorities.rows) {
    assert.ok(r[4] >= 1000 && r[2] >= 0 && r[2] <= 5);
    near((r[6] / r[4]) ** (1 / 26) - 1, r[7], "Candidate CAGR");
    assert.ok(r[8] >= 0 && r[8] <= 1);
  }
});
test("Published operations assets remain minimized, bounded, hash-manifested and allowlisted", async () => {
  const manifest = await read("../public/dashboard-data/manifest.json"),
    assets = await read("../analytics/cloudflare/operations-assets.json");
  assert.ok(manifest.files.length <= 100);
  assert.ok(
    civicRows.every(
      (r) =>
        r.length === 14 &&
        r.every((v) => v === null || Number.isSafeInteger(v)),
    ),
  );
  const env = {
    DATA_RATE_LIMITER: { limit: async () => ({ success: true }) },
    DASHBOARD_DATA: {
      get: async () => ({ body: "{}", size: 2, httpEtag: '"x"' }),
    },
  };
  for (const [project, files] of Object.entries(assets))
    for (const file of files) {
      const entry = manifest.files.find(
        (f) => f.path === `v2/${project}/${file}.json`,
      );
      assert.ok(entry);
      assert.ok(entry.bytes < 12_000_000);
      assert.equal(
        (
          await worker.fetch(
            new Request(
              `https://data.example/analytics/releases/${"a".repeat(64)}/v2/${project}/${file}.json`,
            ),
            env,
          )
        ).status,
        200,
      );
    }
  for (const suffix of [
    "civicpulse/raw.json",
    "freightflow/source.json",
    "sales-analysis/overview.json",
  ])
    assert.equal(
      (
        await worker.fetch(
          new Request(
            `https://data.example/analytics/releases/${"a".repeat(64)}/v2/${suffix}`,
          ),
          env,
        )
      ).status,
      404,
    );
});
test("All portfolio sections expose outcomes, complete project registrations and honest model claims", async () => {
  let catalog = ts.transpileModule(
    await readFile(
      new URL("../src/data/project-catalog.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const evidence = await read("../src/data/project-evidence.json");
  catalog = catalog.replace(
    /import evidence from "\.\/project-evidence.json";/,
    `const evidence=${JSON.stringify(evidence)};`,
  );
  const registry = await import(
    `data:text/javascript;base64,${Buffer.from(catalog).toString("base64")}`
  );
  assert.equal(
    new Set(registry.allRepositoryProjects.map((p) => p.id)).size,
    14,
  );
  for (const p of registry.allRepositoryProjects) {
    assert.ok(
      p.outcomes.length > 0 && p.outcomes.every((o) => o.value && o.label),
      p.id,
    );
    assert.match(p.repoUrl, /^https:\/\/github.com\/DazedSaturn07\//);
  }
  assert.deepEqual(
    registry.supplyChainProjects.map((p) => p.id),
    ["freightflow", "airops"],
  );
  assert.deepEqual(
    registry.machineLearningProjects.map((p) => p.id),
    ["mobilitydemand", "campaignlift", "retainai", "face-mask-detection"],
  );
  assert.equal(registry.dashboardProjects.length, 9);
  near(
    evidence.mobilitydemand.mae_improvement_pct,
    18.471939722167285,
    "Forecast improvement",
  );
  near(
    evidence.campaignlift.lift_at_capacity,
    4.193548387096774,
    "Ranking lift",
  );
});
