// TravelSplit - 旅行費用分攤追蹤器類型定義

// 成員類型
export interface Member {
  id: string;
  name: string;
  avatar?: string; // Emoji 或圖片 URL
  color?: string; // 用於顯示的顏色
}

// 費用類型
export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amount: number; // 原始金額
  currency: string;
  amountInBaseCurrency: number; // 轉換後的基礎貨幣金額
  payerId: string; // 付款人 ID
  date: string; // ISO 格式
  category: ExpenseCategory;
  participants: string[]; // 參與分攤的成員 ID 列表
  splitType: "equal" | "custom";
  customSplits?: Record<string, number>; // 具體比例或金額
  createdAt: string;
  updatedAt: string;
}

// 費用分類
export type ExpenseCategory =
  | "transport"
  | "accommodation"
  | "food"
  | "entertainment"
  | "shopping"
  | "other";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; icon: string }[] = [
  { value: "transport", label: "交通", icon: "🚗" },
  { value: "accommodation", label: "住宿", icon: "🏨" },
  { value: "food", label: "餐飲", icon: "🍽️" },
  { value: "entertainment", label: "娛樂", icon: "🎢" },
  { value: "shopping", label: "購物", icon: "🛍️" },
  { value: "other", label: "其他", icon: "📦" },
];

// 匯率
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  updatedAt: string;
}

// 旅行類型
export interface Trip {
  id: string;
  name: string;
  pin: string; // 6位PIN碼，用於分享旅程
  startDate: string; // ISO 格式
  endDate: string;
  currency: string; // 基礎貨幣 (如 "HKD")
  enabledCurrencies?: string[]; // 啟用的貨幣列表（用於匯率設定）
  customRates?: Record<string, number>; // 自定義匯率
  ratesLastFetched?: string; // 上次獲取匯率時間
  members: Member[];
  expenses: Expense[];
  createdAt: string;
  updatedAt: string;
}

// 結算結果
export interface SettlementResult {
  memberId: string;
  memberName: string;
  totalPaid: number; // 總付款
  totalOwed: number; // 總應付
  balance: number; // 淨餘額 (正數 = 應收, 負數 = 應付)
}

// 結算交易建議
export interface SettlementTransaction {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

// 應用數據
export interface AppData {
  trips: Trip[];
  currentTripId: string | null;
  exchangeRates: ExchangeRate[];
  settings: AppSettings;
}

// 應用設置
export interface AppSettings {
  defaultCurrency: string;
  theme: "light" | "dark" | "system";
}

// 常用貨幣列表
export const COMMON_CURRENCIES = [
  { code: "HKD", name: "港幣", symbol: "$" },
  { code: "USD", name: "美元", symbol: "$" },
  { code: "TWD", name: "新台幣", symbol: "NT$" },
  { code: "JPY", name: "日圓", symbol: "¥" },
  { code: "KRW", name: "韓元", symbol: "₩" },
  { code: "CNY", name: "人民幣", symbol: "¥" },
  { code: "EUR", name: "歐元", symbol: "€" },
  { code: "GBP", name: "英鎊", symbol: "£" },
  { code: "THB", name: "泰銖", symbol: "฿" },
  { code: "SGD", name: "新加坡幣", symbol: "$" },
  { code: "MYR", name: "馬來西亞令吉", symbol: "RM" },
  { code: "VND", name: "越南盾", symbol: "₫" },
];

// 預設匯率 (以 USD 為基準)
export const DEFAULT_RATES: Record<string, number> = {
  USD: 1,
  HKD: 7.8,
  TWD: 32,
  JPY: 150,
  KRW: 1350,
  CNY: 7.2,
  EUR: 0.92,
  GBP: 0.79,
  THB: 35,
  SGD: 1.35,
  MYR: 4.7,
  VND: 24500,
};

// 成員顏色
export const MEMBER_COLORS = [
  "#FF6B6B", // 紅
  "#4ECDC4", // 青綠
  "#45B7D1", // 藍
  "#96CEB4", // 綠
  "#FFEAA7", // 黃
  "#DDA0DD", // 紫
  "#98D8C8", // 薄荷
  "#F7DC6F", // 金
  "#BB8FCE", // 淺紫
  "#85C1E9", // 淺藍
];
