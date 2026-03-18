import { describe, it, expect } from "vitest";
import {
  calculateMemberBalance,
  convertToBaseCurrency,
  calculateAllBalances,
  calculateSettlementTransactions,
  calculateTotalExpenses,
  calculateExpensesByCategory,
  calculateExpensesByDate,
  generateSettlementSummary,
} from "@/lib/settlement";
import type { Member, Expense, Trip } from "@/types";

const members: Member[] = [
  { id: "m1", name: "Alice" },
  { id: "m2", name: "Bob" },
  { id: "m3", name: "Charlie" },
];

describe("convertToBaseCurrency", () => {
  it("returns the same amount when currencies match", () => {
    expect(convertToBaseCurrency(100, "HKD", "HKD")).toBe(100);
  });

  it("converts USD to HKD using default rates", () => {
    const result = convertToBaseCurrency(10, "USD", "HKD");
    expect(result).toBeCloseTo(78, 0);
  });

  it("converts HKD to USD using default rates", () => {
    const result = convertToBaseCurrency(78, "HKD", "USD");
    expect(result).toBeCloseTo(10, 0);
  });

  it("converts between non-USD currencies via USD", () => {
    const result = convertToBaseCurrency(100, "HKD", "JPY");
    const expected = (100 / 7.8) * 150;
    expect(result).toBeCloseTo(expected, 0);
  });

  it("uses custom rates over default rates", () => {
    const customRates = { USD: 8.5 };
    const result = convertToBaseCurrency(10, "USD", "HKD", customRates);
    expect(result).toBe(85);
  });

  it("falls back to 1 for unknown currency rates", () => {
    const result = convertToBaseCurrency(100, "XXX", "HKD");
    expect(result).toBeCloseTo(780, 0);
  });

  it("returns 0 for zero amount", () => {
    expect(convertToBaseCurrency(0, "USD", "HKD")).toBe(0);
  });
});

describe("calculateMemberBalance", () => {
  it("returns zero balance with no expenses", () => {
    const result = calculateMemberBalance(members[0], [], "HKD");
    expect(result).toEqual({
      memberId: "m1",
      memberName: "Alice",
      totalPaid: 0,
      totalOwed: 0,
      balance: 0,
    });
  });

  it("calculates balance for equal split", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Dinner",
        amount: 300,
        currency: "HKD",
        amountInBaseCurrency: 300,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2", "m3"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const result = calculateMemberBalance(members[0], expenses, "HKD");
    expect(result.totalPaid).toBe(300);
    expect(result.totalOwed).toBeCloseTo(100);
    expect(result.balance).toBeCloseTo(200);
  });

  it("calculates balance for a non-payer participant", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Dinner",
        amount: 300,
        currency: "HKD",
        amountInBaseCurrency: 300,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const result = calculateMemberBalance(members[1], expenses, "HKD");
    expect(result.totalPaid).toBe(0);
    expect(result.totalOwed).toBeCloseTo(150);
    expect(result.balance).toBeCloseTo(-150);
  });

  it("handles custom splits", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Dinner",
        amount: 300,
        currency: "HKD",
        amountInBaseCurrency: 300,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2"],
        splitType: "custom",
        customSplits: { m1: 200, m2: 100 },
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const alice = calculateMemberBalance(members[0], expenses, "HKD");
    expect(alice.totalPaid).toBe(300);
    expect(alice.totalOwed).toBe(200);
    expect(alice.balance).toBe(100);

    const bob = calculateMemberBalance(members[1], expenses, "HKD");
    expect(bob.totalPaid).toBe(0);
    expect(bob.totalOwed).toBe(100);
    expect(bob.balance).toBe(-100);
  });

  it("ignores deleted members from participant list", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Dinner",
        amount: 300,
        currency: "HKD",
        amountInBaseCurrency: 300,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2", "deleted_m"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const activeIds = new Set(["m1", "m2"]);
    const result = calculateMemberBalance(members[0], expenses, "HKD", undefined, activeIds);
    expect(result.totalOwed).toBeCloseTo(150);
  });

  it("handles currency conversion in balance", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Lunch in JPY",
        amount: 1500,
        currency: "JPY",
        amountInBaseCurrency: 1500,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const result = calculateMemberBalance(members[0], expenses, "HKD");
    const expectedJPYtoHKD = (1500 / 150) * 7.8;
    expect(result.totalPaid).toBeCloseTo(expectedJPYtoHKD, 0);
    expect(result.totalOwed).toBeCloseTo(expectedJPYtoHKD / 2, 0);
  });

  it("handles custom rates for currency conversion", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Dinner",
        amount: 100,
        currency: "USD",
        amountInBaseCurrency: 780,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ];

    const customRates = { USD: 8.5 };
    const result = calculateMemberBalance(members[0], expenses, "HKD", customRates);
    expect(result.totalPaid).toBeCloseTo(850, 0);
    expect(result.totalOwed).toBeCloseTo(425, 0);
  });
});

describe("calculateAllBalances", () => {
  const trip: Trip = {
    id: "t1",
    name: "Japan Trip",
    pin: "ABC123",
    startDate: "2026-01-01",
    endDate: "2026-01-05",
    currency: "HKD",
    members,
    expenses: [
      {
        id: "e1",
        tripId: "t1",
        description: "Dinner",
        amount: 300,
        currency: "HKD",
        amountInBaseCurrency: 300,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1", "m2", "m3"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("returns a balance result for every member", () => {
    const results = calculateAllBalances(trip);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.memberId)).toEqual(["m1", "m2", "m3"]);
  });

  it("payer has positive balance, others have negative", () => {
    const results = calculateAllBalances(trip);
    const alice = results.find((r) => r.memberId === "m1");
    const bob = results.find((r) => r.memberId === "m2");
    expect(alice!.balance).toBeCloseTo(200);
    expect(bob!.balance).toBeCloseTo(-100);
  });

  it("sums of all totalPaid equals total expenses", () => {
    const results = calculateAllBalances(trip);
    const totalPaid = results.reduce((sum, r) => sum + r.totalPaid, 0);
    expect(totalPaid).toBeCloseTo(300);
  });

  it("sums of all balances equals zero", () => {
    const results = calculateAllBalances(trip);
    const totalBalance = results.reduce((sum, r) => sum + r.balance, 0);
    expect(totalBalance).toBeCloseTo(0);
  });
});

describe("calculateSettlementTransactions", () => {
  it("returns empty array when all balances are zero", () => {
    const balances = [
      { memberId: "m1", memberName: "Alice", totalPaid: 100, totalOwed: 100, balance: 0 },
      { memberId: "m2", memberName: "Bob", totalPaid: 50, totalOwed: 50, balance: 0 },
    ];
    expect(calculateSettlementTransactions(balances)).toEqual([]);
  });

  it("creates one transaction for simple two-person case", () => {
    const balances = [
      { memberId: "m1", memberName: "Alice", totalPaid: 200, totalOwed: 100, balance: 100 },
      { memberId: "m2", memberName: "Bob", totalPaid: 0, totalOwed: 100, balance: -100 },
    ];
    const transactions = calculateSettlementTransactions(balances);
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toEqual({
      fromId: "m2",
      fromName: "Bob",
      toId: "m1",
      toName: "Alice",
      amount: 100,
    });
  });

  it("minimizes transactions for three-person case", () => {
    const balances = [
      { memberId: "m1", memberName: "Alice", totalPaid: 300, totalOwed: 100, balance: 200 },
      { memberId: "m2", memberName: "Bob", totalPaid: 0, totalOwed: 100, balance: -100 },
      { memberId: "m3", memberName: "Charlie", totalPaid: 0, totalOwed: 100, balance: -100 },
    ];
    const transactions = calculateSettlementTransactions(balances);
    expect(transactions.length).toBeLessThanOrEqual(2);
    const totalSettled = transactions.reduce((sum, t) => sum + t.amount, 0);
    expect(totalSettled).toBeCloseTo(200);
  });

  it("handles multiple creditors and debtors", () => {
    const balances = [
      { memberId: "m1", memberName: "Alice", totalPaid: 300, totalOwed: 100, balance: 200 },
      { memberId: "m2", memberName: "Bob", totalPaid: 200, totalOwed: 100, balance: 100 },
      { memberId: "m3", memberName: "Charlie", totalPaid: 0, totalOwed: 200, balance: -200 },
      { memberId: "m4", memberName: "Diana", totalPaid: 0, totalOwed: 100, balance: -100 },
    ];
    const transactions = calculateSettlementTransactions(balances);
    expect(transactions.length).toBeLessThanOrEqual(3);
  });

  it("ignores very small balances (under 0.01 threshold)", () => {
    const balances = [
      { memberId: "m1", memberName: "Alice", totalPaid: 100, totalOwed: 100, balance: 0.005 },
      { memberId: "m2", memberName: "Bob", totalPaid: 100, totalOwed: 100, balance: -0.005 },
    ];
    const transactions = calculateSettlementTransactions(balances);
    expect(transactions).toHaveLength(0);
  });
});

describe("calculateTotalExpenses", () => {
  const trip: Trip = {
    id: "t1",
    name: "Test",
    pin: "ABC123",
    startDate: "2026-01-01",
    endDate: "2026-01-05",
    currency: "HKD",
    members: [],
    expenses: [
      {
        id: "e1",
        tripId: "t1",
        description: "A",
        amount: 100,
        currency: "HKD",
        amountInBaseCurrency: 100,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "e2",
        tripId: "t1",
        description: "B",
        amount: 200,
        currency: "HKD",
        amountInBaseCurrency: 200,
        payerId: "m1",
        date: "2026-01-01",
        category: "transport",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("returns 0 for no expenses", () => {
    expect(calculateTotalExpenses({ ...trip, expenses: [] })).toBe(0);
  });

  it("sums all amountInBaseCurrency", () => {
    expect(calculateTotalExpenses(trip)).toBe(300);
  });
});

describe("calculateExpensesByCategory", () => {
  it("groups expenses by category and sums amounts", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Lunch",
        amount: 100,
        currency: "HKD",
        amountInBaseCurrency: 100,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "e2",
        tripId: "t1",
        description: "Dinner",
        amount: 200,
        currency: "HKD",
        amountInBaseCurrency: 200,
        payerId: "m1",
        date: "2026-01-01",
        category: "food",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "e3",
        tripId: "t1",
        description: "Taxi",
        amount: 50,
        currency: "HKD",
        amountInBaseCurrency: 50,
        payerId: "m1",
        date: "2026-01-02",
        category: "transport",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-02",
        updatedAt: "2026-01-02",
      },
    ];

    const result = calculateExpensesByCategory(expenses);
    expect(result["food"]).toBe(300);
    expect(result["transport"]).toBe(50);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it("returns empty object for no expenses", () => {
    expect(calculateExpensesByCategory([])).toEqual({});
  });
});

describe("calculateExpensesByDate", () => {
  it("groups expenses by date and sums amounts", () => {
    const expenses: Expense[] = [
      {
        id: "e1",
        tripId: "t1",
        description: "Lunch",
        amount: 100,
        currency: "HKD",
        amountInBaseCurrency: 100,
        payerId: "m1",
        date: "2026-01-01T12:00:00Z",
        category: "food",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "e2",
        tripId: "t1",
        description: "Dinner",
        amount: 200,
        currency: "HKD",
        amountInBaseCurrency: 200,
        payerId: "m1",
        date: "2026-01-01T20:00:00Z",
        category: "food",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "e3",
        tripId: "t1",
        description: "Taxi",
        amount: 50,
        currency: "HKD",
        amountInBaseCurrency: 50,
        payerId: "m1",
        date: "2026-01-02T10:00:00Z",
        category: "transport",
        participants: ["m1"],
        splitType: "equal",
        createdAt: "2026-01-02",
        updatedAt: "2026-01-02",
      },
    ];

    const result = calculateExpensesByDate(expenses);
    expect(result["2026-01-01"]).toBe(300);
    expect(result["2026-01-02"]).toBe(50);
  });

  it("returns empty object for no expenses", () => {
    expect(calculateExpensesByDate([])).toEqual({});
  });
});

describe("generateSettlementSummary", () => {
  const trip: Trip = {
    id: "t1",
    name: "Japan Trip",
    pin: "ABC123",
    startDate: "2026-01-01",
    endDate: "2026-01-05",
    currency: "HKD",
    members: [],
    expenses: [],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };

  it("includes trip name in header", () => {
    const balances: any[] = [];
    const transactions: any[] = [];
    const summary = generateSettlementSummary(trip, balances, transactions);
    expect(summary).toContain("Japan Trip");
  });

  it("shows settlement cleared message when no transactions", () => {
    const balances: any[] = [
      { memberId: "m1", memberName: "Alice", totalPaid: 100, totalOwed: 100, balance: 0 },
    ];
    const summary = generateSettlementSummary(trip, balances, []);
    expect(summary).toContain("已結清");
  });

  it("includes transaction details when transactions exist", () => {
    const balances: any[] = [
      { memberId: "m1", memberName: "Alice", totalPaid: 200, totalOwed: 100, balance: 100 },
      { memberId: "m2", memberName: "Bob", totalPaid: 0, totalOwed: 100, balance: -100 },
    ];
    const transactions = [
      { fromId: "m2", fromName: "Bob", toId: "m1", toName: "Alice", amount: 100 },
    ];
    const summary = generateSettlementSummary(trip, balances, transactions);
    expect(summary).toContain("Bob → Alice");
    expect(summary).toContain("100.00");
  });

  it("shows correct status for positive and negative balances", () => {
    const balances: any[] = [
      { memberId: "m1", memberName: "Alice", totalPaid: 200, totalOwed: 100, balance: 100 },
      { memberId: "m2", memberName: "Bob", totalPaid: 0, totalOwed: 100, balance: -100 },
    ];
    const summary = generateSettlementSummary(trip, balances, []);
    expect(summary).toContain("Alice: 應收");
    expect(summary).toContain("Bob: 應付");
  });
});
