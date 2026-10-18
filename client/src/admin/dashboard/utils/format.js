// Formatters                                                         */

const numberFmt = new Intl.NumberFormat("en-IN");
const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatNumber(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return numberFmt.format(n);
}

export function formatDate(d) {
  const dt = toDate(d);
  return dt ? dateFmt.format(dt) : "—";
}

export function formatDateTime(d) {
  const dt = toDate(d);
  return dt ? dateTimeFmt.format(dt) : "—";
}

function toDate(d) {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

// Safe extractors                                                    */

export function pickNumber(obj, keys = []) {
  if (!obj) return 0;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number") return v;
    if (v != null && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}

export function pickObject(raw, keys = []) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  for (const k of keys) {
    const v = raw[k];
    if (v && typeof v === "object" && !Array.isArray(v)) return v;
  }
  return raw;
}

export function toArray(raw, extraKeys = []) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  const KEYS = [
    "data",
    "results",
    "items",
    "trend",
    "growth",
    "books",
    "activities",
    "overview",
    "users",
    "list",
    ...extraKeys,
  ];
  for (const k of KEYS) {
    if (Array.isArray(raw[k])) return raw[k];
  }
  return [];
}

/**
 * Normalise time-series array to [{ value, label, shortLabel }]
 */
export function normaliseSeries(raw, valueKeys = []) {
  const arr = toArray(raw);
  const keys = [
    ...valueKeys,
    "value",
    "count",
    "total",
    "sessions",
    "reads",
    "newUsers",
    "users",
    "registrations",
  ];

  return arr.map((item) => {
    const value = pickNumber(item, keys);
    const dateRaw =
      item.date ||
      item.day ||
      item.createdAt ||
      item.timestamp ||
      item.label ||
      item.time ||
      item.period;

    const dt = toDate(dateRaw);
    return {
      value,
      label: dt
        ? formatDate(dt)
        : String(item.label ?? item.name ?? dateRaw ?? ""),
      shortLabel: dt
        ? dt.toLocaleDateString(undefined, { day: "numeric", month: "short" })
        : String(item.label ?? item.name ?? dateRaw ?? ""),
    };
  });
}
