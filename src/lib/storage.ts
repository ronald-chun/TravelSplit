// localStorage 工具函數
import type { AppData, Trip } from "@/types";

const STORAGE_KEY = "travelsplit_data";

// 預設數據
export const getDefaultAppData = (): AppData => ({
  trips: [],
  currentTripId: null,
  exchangeRates: [],
  settings: {
    defaultCurrency: "HKD",
    theme: "system",
  },
});

// 讀取數據
export const loadAppData = (): AppData => {
  if (typeof window === "undefined") {
    return getDefaultAppData();
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return getDefaultAppData();
    }
    return JSON.parse(data) as AppData;
  } catch (error) {
    console.error("Failed to load app data:", error);
    return getDefaultAppData();
  }
};

// 保存數據
export const saveAppData = (data: AppData): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save app data:", error);
  }
};

// 導出數據為 JSON 文件
export const exportData = (data: AppData): string => {
  return JSON.stringify(data, null, 2);
};

// 導入數據
export const importData = (jsonString: string): AppData | null => {
  try {
    const data = JSON.parse(jsonString) as AppData;
    // 驗證數據結構
    if (!data.trips || !Array.isArray(data.trips)) {
      throw new Error("Invalid data structure");
    }
    return data;
  } catch (error) {
    console.error("Failed to import data:", error);
    return null;
  }
};

// 生成 UUID
export const generateId = (): string => {
  return crypto.randomUUID();
};

// 格式化金額
export const formatCurrency = (amount: number, currency: string): string => {
  const currencyInfo = {
    HKD: "$",
    USD: "$",
    TWD: "NT$",
    JPY: "¥",
    KRW: "₩",
    CNY: "¥",
    EUR: "€",
    GBP: "£",
    THB: "฿",
    SGD: "$",
    MYR: "RM",
    VND: "₫",
  };
  
  const symbol = currencyInfo[currency as keyof typeof currencyInfo] || currency;
  
  return `${symbol}${amount.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// 格式化日期
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// 格式化日期範圍
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (startDate === endDate) {
    return formatDate(startDate);
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// 計算天數
export const calculateDays = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // 包含起始日
};
