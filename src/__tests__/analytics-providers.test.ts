import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  mulberry32,
  hashSeed,
  mockAnalyticsProvider,
} from "@/lib/analytics/mock-provider";
import type { ProviderId } from "@/lib/analytics/types";

describe("mulberry32 PRNG", () => {
  it("produz valores deterministicos para a mesma seed", () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(12345);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it("produz valores diferentes para seeds diferentes", () => {
    const rng1 = mulberry32(12345);
    const rng2 = mulberry32(54321);

    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());

    expect(seq1).not.toEqual(seq2);
  });

  it("gera valores entre 0 e 1", () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});

describe("hashSeed", () => {
  it("produz o mesmo hash para a mesma string", () => {
    expect(hashSeed("borgo")).toEqual(hashSeed("borgo"));
  });

  it("produz hashes diferentes para strings diferentes", () => {
    expect(hashSeed("borgo")).not.toEqual(hashSeed("maple"));
  });

  it("retorna um numero positivo", () => {
    const h = hashSeed("test-string");
    expect(h).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(h)).toBe(true);
  });
});

describe("MockAnalyticsProvider", () => {
  it("isConfigured retorna true", async () => {
    const result = await mockAnalyticsProvider.isConfigured();
    expect(result).toBe(true);
  });

  it("testConnection retorna sucesso", async () => {
    const result = await mockAnalyticsProvider.testConnection();
    expect(result.success).toBe(true);
  });

  it("fetchMetrics retorna dados com source=mock", async () => {
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-01-07");
    const result = await mockAnalyticsProvider.fetchMetrics(
      "bu-test-1",
      startDate,
      endDate,
    );

    expect(result.isMock).toBe(true);
    expect(result.metrics.length).toBeGreaterThan(0);

    for (const m of result.metrics) {
      expect(m.source).toBe("mock" as ProviderId);
    }
  });

  it("fetchMetrics gera dados consistentes para a mesma unidade", async () => {
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-01-01");
    const r1 = await mockAnalyticsProvider.fetchMetrics(
      "bu-deterministic",
      startDate,
      endDate,
    );
    const r2 = await mockAnalyticsProvider.fetchMetrics(
      "bu-deterministic",
      startDate,
      endDate,
    );

    const traffic1 = r1.metrics.filter((m) => m.pageViews !== undefined);
    const traffic2 = r2.metrics.filter((m) => m.pageViews !== undefined);

    expect(traffic1.length).toEqual(traffic2.length);
    if (traffic1.length > 0 && traffic2.length > 0) {
      expect(traffic1[0].pageViews).toEqual(traffic2[0].pageViews);
      expect(traffic1[0].uniqueVisitors).toEqual(traffic2[0].uniqueVisitors);
    }
  });

  it("fetchMetrics gera dados diferentes para unidades diferentes", async () => {
    const startDate = new Date("2026-01-01");
    const endDate = new Date("2026-01-01");
    const r1 = await mockAnalyticsProvider.fetchMetrics(
      "bu-unit-a",
      startDate,
      endDate,
    );
    const r2 = await mockAnalyticsProvider.fetchMetrics(
      "bu-unit-b",
      startDate,
      endDate,
    );

    const traffic1 = r1.metrics.filter((m) => m.pageViews !== undefined);
    const traffic2 = r2.metrics.filter((m) => m.pageViews !== undefined);

    if (traffic1.length > 0 && traffic2.length > 0) {
      expect(traffic1[0].pageViews).not.toEqual(traffic2[0].pageViews);
    }
  });

  it("getStatus retorna status valido", async () => {
    const status = await mockAnalyticsProvider.getStatus();
    expect(status.providerId).toBe("mock");
    expect(status.isConfigured).toBe(true);
    expect(status.displayName).toBeTruthy();
  });
});
