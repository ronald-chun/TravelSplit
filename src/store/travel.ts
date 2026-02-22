// TravelSplit - Zustand Store (API Version)
import { create } from "zustand";
import type { Trip, Member, Expense, AppSettings, SettlementResult, SettlementTransaction } from "@/types";
import { calculateAllBalances, calculateSettlementTransactions, calculateTotalExpenses } from "@/lib/settlement";
import { MEMBER_COLORS } from "@/types";

interface TravelState {
  // 數據
  trips: Trip[];
  currentTripId: string | null;
  settings: AppSettings;
  
  // 計算屬性
  currentTrip: Trip | null;
  balances: SettlementResult[];
  transactions: SettlementTransaction[];
  totalExpenses: number;
  
  // 載入狀態
  isLoading: boolean;
  
  // 操作
  initialize: () => Promise<void>;
  
  // Trip 操作
  createTrip: (trip: Omit<Trip, "id" | "pin" | "members" | "expenses" | "createdAt" | "updatedAt">) => Promise<string>;
  joinTripByPin: (pin: string) => Promise<Trip | null>;
  updateTrip: (tripId: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (tripId: string) => Promise<void>;
  setCurrentTrip: (tripId: string | null) => Promise<void>;
  
  // Member 操作
  addMember: (tripId: string, member: Omit<Member, "id" | "color">) => Promise<string>;
  updateMember: (tripId: string, memberId: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (tripId: string, memberId: string) => Promise<void>;
  
  // Expense 操作
  addExpense: (tripId: string, expense: Omit<Expense, "id" | "tripId" | "createdAt" | "updatedAt" | "amountInBaseCurrency">) => Promise<string>;
  updateExpense: (tripId: string, expenseId: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (tripId: string, expenseId: string) => Promise<void>;
  
  // Settings 操作
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // 數據導入導出
  exportData: () => string;
  importData: (jsonString: string) => Promise<boolean>;
  
  // 內部方法
  _recalculateSettlement: () => void;
  _refreshTrips: () => Promise<void>;
}

export const useTravelStore = create<TravelState>((set, get) => ({
  // 初始狀態
  trips: [],
  currentTripId: null,
  settings: {
    defaultCurrency: "HKD",
    theme: "system",
  },
  currentTrip: null,
  balances: [],
  transactions: [],
  totalExpenses: 0,
  isLoading: false,
  
  // 重新計算結算數據
  _recalculateSettlement: () => {
    const { currentTrip } = get();
    if (!currentTrip) {
      set({ balances: [], transactions: [], totalExpenses: 0 });
      return;
    }
    
    const balances = calculateAllBalances(currentTrip);
    const transactions = calculateSettlementTransactions(balances);
    const totalExpenses = calculateTotalExpenses(currentTrip);
    
    set({ balances, transactions, totalExpenses });
  },
  
  // 從 API 刷新數據
  _refreshTrips: async () => {
    try {
      const response = await fetch("/api/trips");
      const data = await response.json();
      
      const trips: Trip[] = data.trips.map((t: Trip & { isCurrent?: boolean }) => ({
        ...t,
        pin: t.pin,
        members: t.members || [],
        expenses: t.expenses || [],
      }));
      
      const currentTrip = trips.find(t => t.isCurrent) || trips[0] || null;
      const currentTripId = currentTrip?.id || null;
      
      set({ trips, currentTripId, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Failed to refresh trips:", error);
    }
  },
  
  // 初始化
  initialize: async () => {
    set({ isLoading: true });
    await get()._refreshTrips();
    set({ isLoading: false });
  },
  
  // Trip 操作
  createTrip: async (tripData) => {
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData),
      });
      
      const data = await response.json();
      const newTrip: Trip = {
        ...data.trip,
        members: data.trip.members || [],
        expenses: data.trip.expenses || [],
      };
      
      set((state) => ({
        trips: [...state.trips, newTrip],
        currentTripId: newTrip.id,
        currentTrip: newTrip,
      }));
      
      get()._recalculateSettlement();
      return newTrip.id;
    } catch (error) {
      console.error("Create trip error:", error);
      throw error;
    }
  },
  
  joinTripByPin: async (pin: string) => {
    try {
      const response = await fetch("/api/trips/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.toUpperCase() }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "加入失敗");
      }
      
      const data = await response.json();
      const joinedTrip: Trip = {
        ...data.trip,
        members: data.trip.members || [],
        expenses: data.trip.expenses || [],
      };
      
      // 檢查是否已經有此旅程
      const state = get();
      const existingTrip = state.trips.find(t => t.id === joinedTrip.id);
      
      if (existingTrip) {
        // 更新現有旅程
        const newTrips = state.trips.map(t =>
          t.id === joinedTrip.id ? joinedTrip : t
        );
        set({
          trips: newTrips,
          currentTripId: joinedTrip.id,
          currentTrip: joinedTrip,
        });
      } else {
        // 添加新旅程
        set((state) => ({
          trips: [...state.trips, joinedTrip],
          currentTripId: joinedTrip.id,
          currentTrip: joinedTrip,
        }));
      }
      
      get()._recalculateSettlement();
      return joinedTrip;
    } catch (error) {
      console.error("Join trip error:", error);
      throw error;
    }
  },
  
  updateTrip: async (tripId, updates) => {
    try {
      await fetch(`/api/trips/${tripId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      const state = get();
      const newTrips = state.trips.map(trip =>
        trip.id === tripId ? { ...trip, ...updates } : trip
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Update trip error:", error);
      throw error;
    }
  },
  
  deleteTrip: async (tripId) => {
    try {
      await fetch(`/api/trips/${tripId}`, {
        method: "DELETE",
      });
      
      const state = get();
      const newTrips = state.trips.filter(t => t.id !== tripId);
      const newCurrentId = state.currentTripId === tripId 
        ? (newTrips[0]?.id || null) 
        : state.currentTripId;
      const currentTrip = newCurrentId ? newTrips.find(t => t.id === newCurrentId) || null : null;
      
      set({ trips: newTrips, currentTripId: newCurrentId, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Delete trip error:", error);
      throw error;
    }
  },
  
  setCurrentTrip: async (tripId) => {
    try {
      if (tripId) {
        await fetch(`/api/trips/${tripId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setCurrent: true }),
        });
      }
      
      const state = get();
      const currentTrip = tripId ? state.trips.find(t => t.id === tripId) || null : null;
      
      set({ currentTripId: tripId, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Set current trip error:", error);
      throw error;
    }
  },
  
  // Member 操作
  addMember: async (tripId, memberData) => {
    try {
      const state = get();
      const trip = state.trips.find(t => t.id === tripId);
      const colorIndex = trip?.members.length || 0;
      const color = MEMBER_COLORS[colorIndex % MEMBER_COLORS.length];
      
      const response = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, ...memberData, color }),
      });
      
      const data = await response.json();
      const newMember: Member = data.member;
      
      const newTrips = state.trips.map(t =>
        t.id === tripId
          ? { ...t, members: [...t.members, newMember] }
          : t
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
      
      return newMember.id;
    } catch (error) {
      console.error("Add member error:", error);
      throw error;
    }
  },
  
  updateMember: async (tripId, memberId, updates) => {
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, ...updates }),
      });
      
      const state = get();
      const newTrips = state.trips.map(trip =>
        trip.id === tripId
          ? {
              ...trip,
              members: trip.members.map(m =>
                m.id === memberId ? { ...m, ...updates } : m
              ),
            }
          : trip
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Update member error:", error);
      throw error;
    }
  },
  
  deleteMember: async (tripId, memberId) => {
    try {
      await fetch(`/api/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      
      const state = get();
      const newTrips = state.trips.map(trip =>
        trip.id === tripId
          ? {
              ...trip,
              members: trip.members.filter(m => m.id !== memberId),
              expenses: trip.expenses
                .map(expense => ({
                  ...expense,
                  participants: expense.participants.filter(id => id !== memberId),
                  customSplits: expense.customSplits 
                    ? Object.fromEntries(
                        Object.entries(expense.customSplits).filter(([id]) => id !== memberId)
                      )
                    : undefined,
                }))
                .filter(expense => expense.payerId !== memberId),
            }
          : trip
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Delete member error:", error);
      throw error;
    }
  },
  
  // Expense 操作
  addExpense: async (tripId, expenseData) => {
    try {
      const state = get();
      const trip = state.trips.find(t => t.id === tripId);
      
      if (!trip) return "";
      
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          ...expenseData,
          baseCurrency: trip.currency,
          customRates: trip.customRates,
        }),
      });
      
      const data = await response.json();
      const newExpense: Expense = data.expense;
      
      const newTrips = state.trips.map(t =>
        t.id === tripId
          ? { ...t, expenses: [...t.expenses, newExpense] }
          : t
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
      
      return newExpense.id;
    } catch (error) {
      console.error("Add expense error:", error);
      throw error;
    }
  },
  
  updateExpense: async (tripId, expenseId, updates) => {
    try {
      const state = get();
      const trip = state.trips.find(t => t.id === tripId);
      const expense = trip?.expenses.find(e => e.id === expenseId);
      
      if (!trip || !expense) return;
      
      await fetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseId,
          ...updates,
          baseCurrency: trip.currency,
          customRates: trip.customRates,
        }),
      });
      
      const newTrips = state.trips.map(t =>
        t.id === tripId
          ? {
              ...t,
              expenses: t.expenses.map(e =>
                e.id === expenseId ? { ...e, ...updates } : e
              ),
            }
          : t
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Update expense error:", error);
      throw error;
    }
  },
  
  deleteExpense: async (tripId, expenseId) => {
    try {
      await fetch(`/api/expenses?expenseId=${expenseId}`, {
        method: "DELETE",
      });
      
      const state = get();
      const newTrips = state.trips.map(t =>
        t.id === tripId
          ? { ...t, expenses: t.expenses.filter(e => e.id !== expenseId) }
          : t
      );
      
      const currentTrip = state.currentTripId === tripId
        ? newTrips.find(t => t.id === tripId) || null
        : state.currentTrip;
      
      set({ trips: newTrips, currentTrip });
      get()._recalculateSettlement();
    } catch (error) {
      console.error("Delete expense error:", error);
      throw error;
    }
  },
  
  // Settings 操作
  updateSettings: (settingsUpdate) => {
    const state = get();
    const newSettings = { ...state.settings, ...settingsUpdate };
    set({ settings: newSettings });
  },
  
  // 數據導入導出
  exportData: () => {
    const state = get();
    return JSON.stringify({
      trips: state.trips,
      currentTripId: state.currentTripId,
      settings: state.settings,
    }, null, 2);
  },
  
  importData: async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.trips || !Array.isArray(data.trips)) {
        return false;
      }
      
      // 這裡需要將數據逐個導入到數據庫
      // 暫時只是更新本地狀態
      const currentTrip = data.currentTripId
        ? data.trips.find((t: Trip) => t.id === data.currentTripId) || null
        : null;
      
      set({
        trips: data.trips,
        currentTripId: data.currentTripId || null,
        settings: data.settings || get().settings,
        currentTrip,
      });
      
      get()._recalculateSettlement();
      
      return true;
    } catch {
      return false;
    }
  },
}));

// Hook for getting current trip
export const useCurrentTrip = () => {
  const currentTrip = useTravelStore((state) => state.currentTrip);
  return currentTrip;
};
