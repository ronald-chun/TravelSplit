import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getDefaultAppData,
  exportData,
  importData,
  generateId,
  formatCurrency,
  formatDate,
  formatDateRange,
  calculateDays,
} from "@/lib/storage";
import type { AppData } from "@/types";

describe("getDefaultAppData", () => {
  it("returns default structure with empty trips", () => {
    const data = getDefaultAppData();
    expect(data.trips).toEqual([]);
    expect(data.currentTripId).toBeNull();
    expect(data.exchangeRates).toEqual([]);
  });

  it("has default settings with HKD and system theme", () => {
    const data = getDefaultAppData();
    expect(data.settings.defaultCurrency).toBe("HKD");
    expect(data.settings.theme).toBe("system");
  });
});

describe("exportData", () => {
  it("serializes AppData to formatted JSON string", () => {
    const data: AppData = getDefaultAppData();
    const result = exportData(data);
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(data);
  });

  it("produces indented JSON (2 spaces)", () => {
    const data: AppData = getDefaultAppData();
    const result = exportData(data);
    expect(result).toContain("  \"trips\"");
  });
});

describe("importData", () => {
  it("parses valid JSON and returns AppData", () => {
    const data: AppData = {
      trips: [],
      currentTripId: null,
      exchangeRates: [],
      settings: { defaultCurrency: "USD", theme: "dark" },
    };
    const json = JSON.stringify(data);
    const result = importData(json);
    expect(result).toEqual(data);
  });

  it("returns null for invalid JSON", () => {
    const result = importData("not json");
    expect(result).toBeNull();
  });

  it("returns null when trips field is missing", () => {
    const result = importData(JSON.stringify({ currentTripId: null }));
    expect(result).toBeNull();
  });

  it("returns null when trips is not an array", () => {
    const result = importData(JSON.stringify({ trips: "not-array" }));
    expect(result).toBeNull();
  });

  it("returns null for empty string", () => {
    const result = importData("");
    expect(result).toBeNull();
  });
});

describe("generateId", () => {
  it("returns a UUID v4 string", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("formatCurrency", () => {
  it("formats HKD with $ symbol", () => {
    expect(formatCurrency(1234.5, "HKD")).toBe("$1,234.5");
  });

  it("formats USD with $ symbol", () => {
    expect(formatCurrency(100, "USD")).toBe("$100");
  });

  it("formats TWD with NT$ symbol", () => {
    expect(formatCurrency(5000, "TWD")).toBe("NT$5,000");
  });

  it("formats JPY with ¥ symbol", () => {
    expect(formatCurrency(10000, "JPY")).toBe("¥10,000");
  });

  it("formats EUR with € symbol", () => {
    expect(formatCurrency(50, "EUR")).toBe("€50");
  });

  it("formats GBP with £ symbol", () => {
    expect(formatCurrency(30, "GBP")).toBe("£30");
  });

  it("formats THB with ฿ symbol", () => {
    expect(formatCurrency(1000, "THB")).toBe("฿1,000");
  });

  it("formats KRW with ₩ symbol", () => {
    expect(formatCurrency(50000, "KRW")).toBe("₩50,000");
  });

  it("formats SGD with $ symbol", () => {
    expect(formatCurrency(20, "SGD")).toBe("$20");
  });

  it("formats MYR with RM prefix", () => {
    expect(formatCurrency(100, "MYR")).toBe("RM100");
  });

  it("formats VND with ₫ symbol", () => {
    expect(formatCurrency(100000, "VND")).toBe("₫100,000");
  });

  it("uses currency code for unknown currency", () => {
    expect(formatCurrency(100, "XYZ")).toBe("XYZ100");
  });

  it("removes unnecessary decimal places for whole numbers", () => {
    expect(formatCurrency(100, "HKD")).toBe("$100");
  });
});

describe("formatDate", () => {
  it("formats ISO date string to zh-TW locale", () => {
    const result = formatDate("2026-01-15");
    expect(result).toBeTruthy();
    expect(result).toMatch(/2026/);
  });

  it("formats datetime string correctly", () => {
    const result = formatDate("2026-03-18T12:00:00Z");
    expect(result).toBeTruthy();
  });
});

describe("formatDateRange", () => {
  it("returns single date when start equals end", () => {
    const result = formatDateRange("2026-01-15", "2026-01-15");
    expect(result).toBe(formatDate("2026-01-15"));
  });

  it("returns range with separator when dates differ", () => {
    const result = formatDateRange("2026-01-01", "2026-01-05");
    expect(result).toContain(" - ");
    expect(result).toContain(formatDate("2026-01-01"));
    expect(result).toContain(formatDate("2026-01-05"));
  });
});

describe("calculateDays", () => {
  it("returns 1 for same start and end date", () => {
    expect(calculateDays("2026-01-01", "2026-01-01")).toBe(1);
  });

  it("returns correct count for multi-day range", () => {
    expect(calculateDays("2026-01-01", "2026-01-05")).toBe(5);
  });

  it("returns correct count regardless of date order", () => {
    expect(calculateDays("2026-01-05", "2026-01-01")).toBe(5);
  });

  it("handles single month boundary", () => {
    expect(calculateDays("2026-01-30", "2026-02-02")).toBe(4);
  });

  it("handles year boundary", () => {
    expect(calculateDays("2025-12-30", "2026-01-02")).toBe(4);
  });
});
