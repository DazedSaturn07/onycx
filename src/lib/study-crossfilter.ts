import type {
  MetricFormat,
  StudyMetric,
  StudyPoint,
  StudySlice,
} from "./study-dashboards";

export interface StudyCube {
  version: number;
  project: string;
  names: Record<string, string[]>;
  rows: (number | null)[][];
  groups?: number[][];
  skills?: number[][];
  review?: Record<string, string>;
  calendar?: string[];
  paths?: [number, string][];
  repetitions?: number[][];
  histories?: Record<string, [string, string][]>;
  airlineNames?: Record<string, string>;
}
export type StudyFocus = Record<string, string>;
type Row = (number | null)[];
const num = (value: number | null | undefined) => value ?? 0;
const divide = (a: number, b: number) => (b ? a / b : null);
const mean = (values: number[]) =>
  divide(
    values.reduce((a, b) => a + b, 0),
    values.length,
  );
const quantile = (values: number[], p: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    index = (sorted.length - 1) * p;
  return (
    sorted[Math.floor(index)] +
    (sorted[Math.ceil(index)] - sorted[Math.floor(index)]) * (index % 1)
  );
};
const count = (values: string[]): StudyPoint[] => {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};
const metric = (
  label: string,
  value: number | null,
  format: MetricFormat = "number",
  note = "",
): StudyMetric => ({ label, value, format, note });
const matches = (selected: string, actual: string) =>
  selected === "All" || selected === actual;
const focusMatches = (focus: StudyFocus, key: string, actual: string) =>
  !focus[key] || focus[key] === actual;
const table = (columns: string[], rows: (string | number | null)[][]) => ({
  columns,
  rows,
});

function jobs(
  cube: StudyCube,
  selection: string[],
  focus: StudyFocus,
  measure: string,
  base: StudySlice,
): StudySlice {
  const names = cube.names,
    groups = cube.groups ?? [];
  const repeated = new Set(
    cube.rows.filter((r) => r[10]).map((r) => num(r[0])),
  );
  const skillIndex = names.skills.indexOf(focus.skill);
  const skilled = new Set(
    (cube.skills ?? []).filter((r) => r[1] === skillIndex).map((r) => r[0]),
  );
  const ruleIndex = names.rules.indexOf(focus.rule);
  const rows = cube.rows.filter((r) => {
    const g = groups[num(r[0])];
    return (
      matches(selection[0], names.roles[g[0]]) &&
      matches(selection[1], names.seniorities[num(r[2])]) &&
      focusMatches(focus, "date", names.dates[num(r[1])]) &&
      focusMatches(focus, "quality", names.bands[g[2]]) &&
      focusMatches(focus, "employment", names.employment[num(r[3])]) &&
      (!focus.salary ||
        Boolean(r[4]) === (focus.salary === "Numeric salary")) &&
      (!focus.remote || Boolean(r[5])) &&
      (!focus.experience || Boolean(r[7])) &&
      (!focus.repetition ||
        repeated.has(num(r[0])) ===
          (focus.repetition === "Repeated text groups")) &&
      (!focus.rule || (ruleIndex >= 0 && (g[3] & (1 << ruleIndex)) !== 0)) &&
      (!focus.skill || skilled.has(num(r[0]))) &&
      (!focus.entry ||
        (names.seniorities[num(r[2])] === "entry" &&
          r[6] !== null &&
          r[6] >= 2))
    );
  });
  const ids = new Set(rows.map((r) => num(r[0]))),
    scores = [...ids].map((i) => groups[i][1]);
  const numeric = rows.filter((r) => r[4]).length,
    remote = rows.filter((r) => r[5]).length;
  const observationsByGroup = new Map<number, number>();
  for (const r of rows)
    observationsByGroup.set(
      num(r[0]),
      (observationsByGroup.get(num(r[0])) ?? 0) + 1,
    );
  const repeatedGroups = [...observationsByGroup.values()].filter(
    (n) => n > 1,
  ).length;
  const extra = rows.filter((r) => r[10]).length;
  const entryRows = rows.filter(
    (r) => names.seniorities[num(r[2])] === "entry",
  );
  const entry = new Set(entryRows.map((r) => num(r[0])));
  const twoPlus = new Set(
    entryRows.filter((r) => r[6] !== null && r[6] >= 2).map((r) => num(r[0])),
  );
  const byDate = new Map<string, Row[]>(),
    byRole = new Map<string, Row[]>();
  for (const r of rows) {
    const date = names.dates[num(r[1])],
      role = names.roles[groups[num(r[0])][0]];
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(r);
    if (!byRole.has(role)) byRole.set(role, []);
    byRole.get(role)!.push(r);
  }
  const measureValue = (data: Row[]) =>
    measure === "groups"
      ? new Set(data.map((r) => r[0])).size
      : measure === "quality"
        ? mean(
            [...new Set(data.map((r) => num(r[0])))].map((i) => groups[i][1]),
          )
        : data.length;
  const trend = (cube.calendar ?? [])
    .filter((day) => !focus.date || day === focus.date)
    .map((label) => ({ label, value: measureValue(byDate.get(label) ?? []) }));
  const pay = new Map<string, number>();
  for (const r of rows.filter((r) => r[4])) {
    const key = JSON.stringify([
      names.currencies[num(r[8])],
      names.periods[num(r[9])],
    ]);
    pay.set(key, (pay.get(key) ?? 0) + 1);
  }
  const flagCounts = names.rules
    .map((label, i) => ({
      label,
      value: [...ids].filter((id) => (groups[id][3] & (1 << i)) !== 0).length,
    }))
    .filter((p) => p.value)
    .sort((a, b) => b.value - a.value);
  const skills = new Map<number, number>();
  for (const [id, skill] of cube.skills ?? [])
    if (ids.has(id)) skills.set(skill, (skills.get(skill) ?? 0) + 1);
  const review = Object.entries(cube.review ?? {})
    .filter(([id]) => ids.has(Number(id)))
    .sort(
      (a, b) =>
        groups[Number(a[0])][1] - groups[Number(b[0])][1] ||
        Number(a[0]) - Number(b[0]),
    )
    .slice(0, 12);
  const reviewCount = [...ids].filter((i) =>
    ["Review Recommended", "Multiple Quality Concerns"].includes(
      names.bands[groups[i][2]],
    ),
  ).length;
  return {
    ...base,
    hero:
      measure === "groups"
        ? metric(
            "Exact text groups",
            ids.size,
            "number",
            "Visible text groups · not verified unique vacancies",
          )
        : measure === "quality"
          ? metric(
              "Representative JD quality",
              mean(scores),
              "score",
              "Mean latest group score · heuristic, 0–100",
            )
          : metric(
              "Posting observations",
              rows.length,
              "number",
              base.hero.note,
            ),
    trend,
    trend_title:
      measure === "quality"
        ? "Representative group quality by listed date"
        : measure === "groups"
          ? "Visible text groups by listed date"
          : "Posting observations by listed date",
    trend_format: measure === "quality" ? "score" : "number",
    gauge: {
      label: "Numeric pay disclosure",
      value: divide(numeric, rows.length),
      segments: [
        { label: "Numeric salary", value: numeric },
        { label: "No numeric salary", value: rows.length - numeric },
      ],
    },
    metrics: [
      metric(
        "Exact text groups",
        ids.size,
        "number",
        "Not verified unique vacancies",
      ),
      metric(
        "Representative JD quality",
        mean(scores),
        "score",
        "Mean score per visible text group · heuristic, 0–100",
      ),
      metric(
        "Extra repeated observations",
        extra,
        "number",
        "Visible extra observations in exact source groups",
      ),
      metric(
        "Confirmed remote permission",
        remote,
        "number",
        "Blank permission remains unknown",
      ),
    ],
    rankings: {
      roles: [...byRole]
        .map(([label, data]) => ({
          label,
          value: data.length,
          count: new Set(data.map((r) => r[0])).size,
        }))
        .sort((a, b) => b.value - a.value),
      quality: count([...ids].map((i) => names.bands[groups[i][2]])),
      employment: count(rows.map((r) => names.employment[num(r[3])])),
      flags: flagCounts,
      skills: [...skills]
        .map(([i, value]) => ({ label: names.skills[i], value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 12),
      repetition: [
        {
          label: "One observation",
          value: [...observationsByGroup.values()].filter((n) => n === 1)
            .length,
        },
        { label: "Repeated text groups", value: repeatedGroups },
      ],
    },
    facts: {
      observations: rows.length,
      groups: ids.size,
      numeric_salary: numeric,
      entry_groups: entry.size,
      entry_two_plus: twoPlus.size,
      entry_share: divide(twoPlus.size, entry.size),
      experience_coverage: divide(rows.filter((r) => r[7]).length, rows.length),
      remote_share: divide(remote, rows.length),
      review_groups: reviewCount,
      repeated_groups: repeatedGroups,
      repeat_share: divide(extra, rows.length),
    },
    tables: {
      pay: table(
        base.tables.pay.columns,
        [...pay].sort().map(([key, n]) => [...JSON.parse(key), n]),
      ),
      review: table(
        [
          "Preserved representative title (up to 12)",
          "Quality score / 100",
          "Band",
          "Review rules",
        ],
        review.map(([id, title]) => {
          const g = groups[Number(id)];
          return [
            title,
            g[1],
            names.bands[g[2]],
            names.rules.filter((_, i) => (g[3] & (1 << i)) !== 0).join("; ") ||
              "No flags",
          ];
        }),
      ),
      entry: table(
        base.tables.entry.columns,
        names.roles.flatMap((role) => {
          const data = entryRows.filter(
            (r) => names.roles[groups[num(r[0])][0]] === role,
          );
          const all = new Set(data.map((r) => r[0])).size,
            flagged = new Set(
              data.filter((r) => r[6] !== null && r[6] >= 2).map((r) => r[0]),
            ).size;
          return all ? [[role, all, flagged, divide(flagged, all)]] : [];
        }),
      ),
    },
  };
}

const durationRanges: [string, number, number][] = [
  ["0–7 days", 0, 7],
  ["7–14 days", 7, 14],
  ["14–21 days", 14, 21],
  ["21–35 days", 21, 35],
  ["35+ days", 35, Infinity],
];
function loans(
  cube: StudyCube,
  selection: string[],
  focus: StudyFocus,
  measure: string,
  base: StudySlice,
): StudySlice {
  const names = cube.names,
    paths = cube.paths ?? [];
  const activityIndex = names.activities.indexOf(`W_${focus.activity}`);
  const repeatedActivityCases = new Set(
    (cube.repetitions ?? [])
      .filter((r) => r[1] === activityIndex)
      .map((r) => r[0]),
  );
  const range = durationRanges.find((r) => r[0] === focus.duration);
  const rows = cube.rows
    .map((row, id) => ({ row, id }))
    .filter(
      ({ row: r, id }) =>
        matches(selection[0], names.types[num(r[0])]) &&
        matches(selection[1], names.months[num(r[2])]) &&
        focusMatches(focus, "goal", names.goals[num(r[1])]) &&
        (!focus.milestone ||
          (focus.milestone === "Resolved"
            ? r[4] !== null
            : names.statuses[num(r[3])] === focus.milestone)) &&
        (!range || (r[4] !== null && r[4] >= range[1] && r[4] < range[2])) &&
        (!focus.incomplete || Boolean(r[5])) &&
        (!focus.work || num(r[6]) > 0) &&
        (!focus.activity || repeatedActivityCases.has(id)) &&
        (!focus.path || `Path ${paths[num(r[9])][0]}` === focus.path) &&
        (!focus.offer ||
          (focus.offer === "Accepted signal"
            ? num(r[7]) > 0 && Boolean(r[8])
            : num(r[7]) > 1)),
    );
  const values = rows.map((r) => r.row),
    ids = new Set(rows.map((r) => r.id));
  const durations = values.flatMap((r) => (r[4] === null ? [] : [r[4]]));
  const extra = values.reduce((sum, r) => sum + num(r[6]), 0);
  const byMonth = new Map<string, Row[]>();
  for (const r of values) {
    const key = names.months[num(r[2])];
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(r);
  }
  const valueFor = (data: Row[]) => {
    const d = data.flatMap((r) => (r[4] === null ? [] : [r[4]]));
    return measure === "median"
      ? quantile(d, 0.5)
      : measure === "p90"
        ? quantile(d, 0.9)
        : measure === "mean"
          ? mean(d)
          : data.length;
  };
  const variantCounts = new Map<number, number>();
  for (const r of values)
    variantCounts.set(num(r[9]), (variantCounts.get(num(r[9])) ?? 0) + 1);
  const rankedPaths = [...variantCounts]
    .sort((a, b) => b[1] - a[1] || paths[a[0]][0] - paths[b[0]][0])
    .slice(0, 20);
  const repeats = new Map<number, number>();
  for (const [id, activity, n] of cube.repetitions ?? [])
    if (ids.has(id)) repeats.set(activity, (repeats.get(activity) ?? 0) + n);
  const signalRows: (string | number | null)[][] = [];
  for (const [field, label] of [
    [5, "Incomplete-file signal"],
    [6, "Repeated completed work"],
  ] as const)
    for (const flag of [false, true]) {
      const data = values.filter((r) => Boolean(r[field]) === flag);
      if (data.length) {
        const d = data.flatMap((r) => (r[4] === null ? [] : [r[4]]));
        signalRows.push([
          label,
          flag ? "Present" : "Absent",
          data.length,
          d.length,
          quantile(d, 0.5),
        ]);
      }
    }
  const samples = rows
    .filter((r) => cube.histories?.[String(r.id)])
    .slice(0, 3)
    .map(({ row: r, id }, i) => ({
      label: `Example ${i + 1}`,
      type: names.types[num(r[0])],
      goal: names.goals[num(r[1])],
      status: names.statuses[num(r[3])],
      days: r[4],
      events: cube.histories![String(id)].map(([activity, time]) => ({
        activity,
        time,
      })),
    }));
  const label =
    measure === "median"
      ? "Median resolution"
      : measure === "p90"
        ? "P90 resolution"
        : "Mean resolution";
  return {
    ...base,
    hero:
      measure === "default"
        ? metric("Loan applications", values.length, "number", base.hero.note)
        : metric(
            label,
            valueFor(values),
            "days",
            "Resolved applications only · calendar days",
          ),
    trend: [...byMonth]
      .sort()
      .map(([label, data]) => ({ label, value: valueFor(data) })),
    trend_title:
      measure === "default"
        ? "Applications by starting month"
        : `${label} by starting month`,
    trend_format: measure === "default" ? "number" : "days",
    gauge: {
      label: "Resolved at cutoff",
      value: divide(durations.length, values.length),
      segments: count(values.map((r) => names.statuses[num(r[3])])),
    },
    metrics: [
      metric(
        "Median resolution",
        quantile(durations, 0.5),
        "days",
        "Resolved applications only · calendar days",
      ),
      metric(
        "P90 resolution",
        quantile(durations, 0.9),
        "days",
        "90th percentile · unresolved cases excluded",
      ),
      metric(
        "Incomplete-file signal",
        divide(values.filter((r) => r[5]).length, values.length),
        "percent",
        "A recorded signal, not an established cause",
      ),
      metric(
        "Repeated completed work",
        divide(values.filter((r) => num(r[6]) > 0).length, values.length),
        "percent",
        "Investigative proxy; repetitions can be legitimate",
      ),
    ],
    rankings: {
      goals: count(values.map((r) => names.goals[num(r[1])])),
      milestones: count(values.map((r) => names.statuses[num(r[3])])),
      repeats: [...repeats]
        .map(([i, value]) => ({
          label: names.activities[i].replace("W_", ""),
          value,
        }))
        .sort((a, b) => b.value - a.value),
      durations: durationRanges.map(([label, lo, hi]) => ({
        label,
        value: durations.filter((n) => n >= lo && n < hi).length,
      })),
    },
    facts: {
      applications: values.length,
      resolved: durations.length,
      unresolved: values.length - durations.length,
      mean_days: mean(durations),
      extra_completions: extra,
      acceptance_share: divide(
        values.filter((r) => num(r[7]) > 0 && r[8]).length,
        values.filter((r) => num(r[7]) > 0).length,
      ),
      multi_offer_share: divide(
        values.filter((r) => num(r[7]) > 1).length,
        values.filter((r) => num(r[7]) > 0).length,
      ),
      top_twenty_share: divide(
        rankedPaths.reduce((sum, p) => sum + p[1], 0),
        values.length,
      ),
      path_count: variantCounts.size,
      event_count: values.reduce((sum, r) => sum + num(r[10]), 0),
      unresolved_age: mean(
        values.flatMap((r) => (r[4] === null && r[11] !== null ? [r[11]] : [])),
      ),
    },
    tables: {
      paths: table(
        base.tables.paths.columns,
        rankedPaths.map(([i, n]) => [
          `Path ${paths[i][0]}`,
          n,
          divide(n, values.length),
          paths[i][1],
        ]),
      ),
      signals: table(base.tables.signals.columns, signalRows),
    },
    samples,
  };
}

function flights(
  cube: StudyCube,
  selection: string[],
  focus: StudyFocus,
  measure: string,
  base: StudySlice,
  hourly?: StudyCube,
): StudySlice {
  const names = cube.names;
  const filter = (r: Row) => {
    const route = names.routes[num(r[2])],
      [origin, destination] = route.split("-");
    return (
      matches(selection[0], names.carriers[num(r[0])]) &&
      matches(selection[1], names.months[num(r[1])]) &&
      focusMatches(focus, "route", route) &&
      focusMatches(focus, "origin", origin) &&
      focusMatches(focus, "destination", destination)
    );
  };
  const rows = cube.rows.filter(filter);
  const sum = (data: Row[]) => {
    const totals = Array<number>(14).fill(0);
    for (const r of data)
      for (let i = 0; i < 14; i++) totals[i] += num(r[i + 3]);
    return totals;
  };
  const totals = sum(rows),
    [
      scheduled,
      arrived,
      ontime,
      late,
      severe,
      cancelled,
      diverted,
      arrivalSum,
      numeric,
    ] = totals;
  const causes = [
    "Air system",
    "Security",
    "Airline",
    "Late aircraft",
    "Weather",
  ];
  const value = (a: number[], key: string) =>
    key === "cancel"
      ? divide(a[5], a[0])
      : key === "severe"
        ? divide(a[4], a[1])
        : key === "mean"
          ? divide(a[7], a[1])
          : key === "diversion"
            ? divide(a[6], a[0])
            : key === "late"
              ? divide(a[3], a[1])
              : key.startsWith("cause:")
                ? a[9 + causes.indexOf(key.slice(6))]
                : divide(a[2], a[1]);
  const grouped = (key: (r: Row) => string) => {
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      const label = key(r);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(r);
    }
    return [...map].map(([label, data]) => ({ label, totals: sum(data) }));
  };
  const months = grouped((r) => names.months[num(r[1])]).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const carriers = grouped((r) => names.carriers[num(r[0])]);
  const routeGroups = grouped((r) => names.routes[num(r[2])]);
  const rankedRoutes = routeGroups
    .filter((r) => r.totals[0] >= 1000 && r.totals[1] > 0)
    .sort(
      (a, b) =>
        (value(b.totals, "late") ?? 0) - (value(a.totals, "late") ?? 0) ||
        a.label.localeCompare(b.label),
    )
    .slice(0, 20);
  const routeRow = (r: (typeof routeGroups)[number]) => {
    const a = r.totals;
    return [
      r.label,
      a[0],
      a[1],
      divide(a[3], a[1]),
      divide(a[5], a[0]),
      divide(a[4], a[1]),
      divide(a[7], a[1]),
      a[0] && a[1]
        ? Math.max(0, 100 - (50 * a[3]) / a[1] - (50 * a[5]) / a[0])
        : null,
    ];
  };
  const airport = (index: number) =>
    grouped((r) => names.routes[num(r[2])].split("-")[index])
      .filter((r) => r.totals[0] >= 1000 && r.totals[1] > 0)
      .map((r) => ({
        label: r.label,
        value: divide(r.totals[4], r.totals[1]),
        count: r.totals[0],
      }))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      .slice(0, 20);
  const hours = new Map<number, number[]>();
  for (const r of hourly?.rows.filter(filter) ?? []) {
    const hour = num(r[3]);
    if (!hours.has(hour)) hours.set(hour, [0, 0, 0]);
    const a = hours.get(hour)!;
    for (let i = 0; i < 3; i++) a[i] += num(r[i + 4]);
  }
  const sourceMeasure = measure === "default" ? "ontime" : measure;
  const label =
    measure === "cancel"
      ? "Cancellation rate"
      : measure === "severe"
        ? "Severe arrival delay"
        : measure === "mean"
          ? "Mean arrival delay"
          : measure === "diversion"
            ? "Diversion rate"
            : measure === "late"
              ? "Arrival delay >15 minutes"
              : measure.startsWith("cause:")
                ? `${measure.slice(6)} attribution minutes`
                : "Custom on-time arrivals";
  const format: MetricFormat =
    measure === "mean"
      ? "minutes"
      : measure.startsWith("cause:")
        ? "number"
        : "percent";
  return {
    ...base,
    hero:
      measure === "default"
        ? metric("Scheduled observations", scheduled, "number", base.hero.note)
        : metric(
            label,
            value(totals, measure),
            format,
            "Selected source cohort · documented denominators",
          ),
    trend: months.map((r) => ({
      label: r.label,
      value: value(r.totals, sourceMeasure),
    })),
    trend_title: `${label} by month`,
    trend_format: format,
    gauge: {
      label: "Custom on-time arrivals",
      value: divide(ontime, arrived),
      segments: [
        { label: "On time ≤15m", value: ontime },
        { label: "Late >15m", value: late },
      ],
    },
    metrics: [
      metric(
        "Cancellation rate",
        divide(cancelled, scheduled),
        "percent",
        `${cancelled.toLocaleString("en-GB")} of ${scheduled.toLocaleString("en-GB")} scheduled`,
      ),
      metric(
        "Severe arrival delay",
        divide(severe, arrived),
        "percent",
        `>60 minutes · ${severe.toLocaleString("en-GB")} eligible arrivals`,
      ),
      metric(
        "Mean arrival delay",
        divide(arrivalSum, arrived),
        "minutes",
        "Eligible arrivals · includes early arrivals",
      ),
      metric(
        "Diversion rate",
        divide(diverted, scheduled),
        "percent",
        `${diverted.toLocaleString("en-GB")} of ${scheduled.toLocaleString("en-GB")} scheduled`,
      ),
    ],
    rankings: {
      carriers: carriers
        .map((r) => ({
          label: r.label,
          value: divide(r.totals[5], r.totals[0]),
          count: r.totals[0],
        }))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)),
      routes: rankedRoutes.map((r) => ({
        label: r.label,
        value: divide(r.totals[3], r.totals[1]),
        count: r.totals[0],
      })),
      origins: airport(0),
      destinations: airport(1),
      attribution: causes
        .map((label, i) => ({ label, value: totals[9 + i] }))
        .sort((a, b) => b.value - a.value),
      hours: hourly
        ? [...hours]
            .sort((a, b) => a[0] - b[0])
            .map(([h, a]) => ({
              label: String(h),
              value: divide(a[2], a[1]),
              count: a[0],
            }))
        : base.rankings.hours,
    },
    facts: {
      scheduled,
      arrived,
      ontime,
      late,
      cancelled,
      diverted,
      numeric_airport_rows: numeric,
      numeric_share: divide(numeric, scheduled),
      attribution_minutes: totals.slice(9).reduce((a, b) => a + b, 0),
      reliability:
        scheduled && arrived
          ? Math.max(
              0,
              100 - (50 * late) / arrived - (50 * cancelled) / scheduled,
            )
          : null,
    },
    tables: {
      routes: table(base.tables.routes.columns, rankedRoutes.map(routeRow)),
      ...(focus.route
        ? {
            route_detail: table(
              base.tables.routes.columns,
              routeGroups.map(routeRow),
            ),
          }
        : {}),
      carriers: table(
        base.tables.carriers.columns,
        carriers.map((r) => [
          r.label,
          cube.airlineNames?.[r.label] ?? r.label,
          r.totals[0],
          r.totals[1],
          divide(r.totals[2], r.totals[1]),
          divide(r.totals[5], r.totals[0]),
        ]),
      ),
      months: table(
        base.tables.months.columns,
        months.map((r) => [
          r.label,
          r.totals[0],
          r.totals[1],
          divide(r.totals[2], r.totals[1]),
          divide(r.totals[5], r.totals[0]),
        ]),
      ),
    },
  };
}

export function deriveStudySlice(
  cube: StudyCube,
  selection: string[],
  focus: StudyFocus,
  measure: string,
  base: StudySlice,
  hourly?: StudyCube,
): StudySlice {
  return cube.project === "job-market"
    ? jobs(cube, selection, focus, measure, base)
    : cube.project === "loanflow"
      ? loans(cube, selection, focus, measure, base)
      : flights(cube, selection, focus, measure, base, hourly);
}
