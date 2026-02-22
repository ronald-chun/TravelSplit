import { NextResponse } from "next/server";

// 匯率 API 端點
// 使用免費的匯率 API（以 USD 為基準）
const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD";

// 備用匯率（如果 API 失敗）
const FALLBACK_RATES: Record<string, number> = {
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

export async function GET() {
  try {
    const response = await fetch(EXCHANGE_RATE_API, {
      next: { revalidate: 3600 }, // 快取 1 小時
    });

    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();
    
    // 提取我們需要的貨幣
    const rates: Record<string, number> = {};
    const supportedCurrencies = ["USD", "HKD", "TWD", "JPY", "KRW", "CNY", "EUR", "GBP", "THB", "SGD", "MYR", "VND"];
    
    supportedCurrencies.forEach((currency) => {
      if (data.rates && data.rates[currency]) {
        rates[currency] = data.rates[currency];
      }
    });

    return NextResponse.json({
      success: true,
      rates,
      updatedAt: new Date().toISOString(),
      source: "exchangerate-api.com",
    });
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    
    // 返回備用匯率
    return NextResponse.json({
      success: false,
      rates: FALLBACK_RATES,
      updatedAt: new Date().toISOString(),
      source: "fallback",
      error: "Unable to fetch live rates, using fallback rates",
    });
  }
}
