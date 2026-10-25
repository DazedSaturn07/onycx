import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import worker from "../analytics/cloudflare/worker.mjs";

const read = async (path) =>
  JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const meta = await read("../public/dashboard-data/v2/novamart/overview.json");
const orders = await read("../public/dashboard-data/v2/novamart/orders.json");
const items = await read("../public/dashboard-data/v2/novamart/items.json");
const data = { ...meta, orders: orders.rows, items: items.rows };
const source = ts
  .transpileModule(
    await readFile(new URL("../src/lib/novamart.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  )
  .outputText.replace(/import \{[^}]+\} from "\.\/dashboard-data";/, "");
const { deriveNova, allNovaFilters, divide } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const oracle = await read("../analytics/reports/novamart-filter-oracle.json");

test("NovaMart browser calculations reconcile to independent pandas across every month, state, category and status plus seller and combined filters", () => {
  for (const { filters, expected } of oracle) {
    const result = deriveNova(data, { ...allNovaFilters, ...filters });
    for (const [key, value] of Object.entries(expected))
      assert.ok(
        Math.abs(result.summary[key] - value) <
          (Number.isInteger(value) ? 0.001 : 0.0001),
        `${JSON.stringify(filters)} ${key}: ${result.summary[key]} != ${value}`,
      );
    assert.equal(
      result.monthly.reduce((n, g) => n + g.summary.gmv, 0),
      expected.gmv,
    );
    assert.equal(
      result.states.reduce((n, g) => n + g.summary.orders, 0),
      expected.orders,
    );
    assert.equal(
      result.categories.reduce((n, g) => n + g.summary.gmv, 0),
      expected.gmv,
    );
    assert.equal(
      result.sellers.reduce((n, g) => n + g.summary.gmv, 0),
      expected.gmv,
    );
    assert.equal(result.exceptions.length, expected.late);
  }
  console.log(`Reconciled ${oracle.length} independent filter cases.`);
});
test("Missing delivery outcomes, empty populations and repeat customer identity remain correct", () => {
  const all = deriveNova(data, allNovaFilters).summary;
  assert.equal(all.missingActual, 8);
  assert.equal(all.customers, 93358);
  assert.equal(all.repeat, 2801);
  assert.equal(all.late, 7826);
  assert.equal(all.calendarLate, 6534);
  assert.equal(all.gmv, 1322149811);
  assert.equal(all.repeatGmv + all.singleGmv, all.gmv);
  const empty = deriveNova(data, {
    ...allNovaFilters,
    month: "2018-10",
    status: "delivered",
  }).summary;
  assert.equal(empty.orders, 0);
  assert.equal(divide(empty.late, empty.eligible), null);
  assert.equal(divide(0, 0), null);
});
test("Public data omits source IDs, free text, precise locations and the removed project", async () => {
  assert.equal(orders.rows.length, 99441);
  assert.equal(items.rows.length, 112650);
  for (const row of orders.rows) assert.equal(row.length, 12);
  for (const row of items.rows) assert.equal(row.length, 5);
  const manifest = await read("../public/dashboard-data/manifest.json");
  assert.equal(
    manifest.files.filter((f) => f.path.startsWith("v2/novamart/")).length,
    3,
  );
  assert.ok(!manifest.files.some((f) => f.path.includes("sales-analysis")));
  assert.equal(meta.attribution.license, "CC BY-NC-SA 4.0");
});
test("Cloudflare serves only the new allowlisted NovaMart files and denies the removed project", async () => {
  const env = {
    DATA_RATE_LIMITER: { limit: async () => ({ success: true }) },
    DASHBOARD_DATA: {
      get: async () => ({ body: "{}", size: 2, httpEtag: '"x"' }),
    },
  };
  const prefix = `https://data.example/analytics/releases/${"a".repeat(64)}/v2/`;
  for (const file of ["overview", "orders", "items"])
    assert.equal(
      (await worker.fetch(new Request(prefix + `novamart/${file}.json`), env))
        .status,
      200,
    );
  assert.equal(
    (
      await worker.fetch(
        new Request(prefix + "sales-analysis/overview.json"),
        env,
      )
    ).status,
    404,
  );
});
