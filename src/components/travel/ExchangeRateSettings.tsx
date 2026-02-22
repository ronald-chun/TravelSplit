"use client";

import { useState, useEffect } from "react";
import { COMMON_CURRENCIES, DEFAULT_RATES } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  RefreshCw, 
  Save, 
  RotateCcw,
  Check,
  AlertCircle,
  Clock,
  Settings2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";

interface ExchangeRateSettingsProps {
  baseCurrency: string;
  enabledCurrencies: string[] | undefined;
  customRates: Record<string, number> | undefined;
  ratesLastFetched?: string;
  onUpdateRates: (rates: Record<string, number>) => void;
  onUpdateEnabledCurrencies: (currencies: string[]) => void;
}

interface LiveRates {
  rates: Record<string, number>;
  updatedAt: string;
  source: string;
  success: boolean;
}

export function ExchangeRateSettings({ 
  baseCurrency, 
  enabledCurrencies,
  customRates,
  ratesLastFetched,
  onUpdateRates,
  onUpdateEnabledCurrencies
}: ExchangeRateSettingsProps) {
  // API 獲取的匯率（上次匯率）
  const [apiRates, setApiRates] = useState<Record<string, number>>({});
  // 當前使用的匯率（用戶可編輯）
  const [currentRates, setCurrentRates] = useState<Record<string, number>>(() => {
    if (customRates && Object.keys(customRates).length > 0) {
      return { ...customRates };
    }
    // 使用預設匯率
    const baseRateInUSD = DEFAULT_RATES[baseCurrency] || 1;
    const rates: Record<string, number> = {};
    COMMON_CURRENCIES.forEach(({ code }) => {
      if (code !== baseCurrency && DEFAULT_RATES[code]) {
        rates[code] = baseRateInUSD / DEFAULT_RATES[code];
      }
    });
    return rates;
  });
  
  const [liveRates, setLiveRates] = useState<LiveRates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(
    () => enabledCurrencies || COMMON_CURRENCIES.map(c => c.code).filter(c => c !== baseCurrency)
  );

  // 比較是否有變更
  useEffect(() => {
    const originalRates = customRates || {};
    const hasRateChanges = Object.keys(currentRates).some(
      key => Math.abs((currentRates[key] || 0) - (originalRates[key] || 0)) > 0.0001
    ) || Object.keys(originalRates).some(
      key => Math.abs((currentRates[key] || 0) - (originalRates[key] || 0)) > 0.0001
    );
    setHasChanges(hasRateChanges);
  }, [currentRates, customRates]);

  // 同步 enabledCurrencies
  useEffect(() => {
    if (enabledCurrencies) {
      setSelectedCurrencies(enabledCurrencies);
    }
  }, [enabledCurrencies]);

  // 獲取實時匯率（API）
  const fetchLiveRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/exchange-rates");
      const data: LiveRates = await response.json();
      
      // 轉換匯率格式
      const baseRateInUSD = data.rates[baseCurrency] || 1;
      const convertedRates: Record<string, number> = {};
      
      COMMON_CURRENCIES.forEach(({ code }) => {
        if (code !== baseCurrency && data.rates[code]) {
          convertedRates[code] = baseRateInUSD / data.rates[code];
        }
      });
      
      // 保存為 API 匯率（上次匯率）
      setApiRates(convertedRates);
      setLiveRates(data);
      
      if (data.success) {
        toast.success("已獲取最新匯率");
      } else {
        toast.warning("使用備用匯率");
      }
    } catch (error) {
      toast.error("獲取匯率失敗");
    } finally {
      setIsLoading(false);
    }
  };

  // 重置為 API 匯率
  const resetToApiRates = () => {
    if (Object.keys(apiRates).length === 0) {
      toast.warning("請先點擊「更新」獲取匯率");
      return;
    }

    setCurrentRates({ ...apiRates });
    onUpdateRates(apiRates);
    setHasChanges(false);
    toast.success("已重置為 API 匯率");
  };

  // 保存自定義匯率
  const saveRates = () => {
    onUpdateRates(currentRates);
    setHasChanges(false);
    toast.success("匯率已保存");
  };

  // 更新單個匯率
  const updateRate = (currency: string, value: string) => {
    // 允許用戶自由輸入，包括空值
    setCurrentRates(prev => ({
      ...prev,
      [currency]: value,
    }));
  };

  // 處理失焦時格式化
  const handleBlur = (currency: string) => {
    const value = currentRates[currency];
    if (typeof value === "string") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        setCurrentRates(prev => ({
          ...prev,
          [currency]: numValue,
        }));
      } else {
        // 如果值無效，恢復為預設值
        const baseRate = DEFAULT_RATES[baseCurrency] || 1;
        const targetRate = DEFAULT_RATES[currency] || 1;
        setCurrentRates(prev => ({
          ...prev,
          [currency]: baseRate / targetRate,
        }));
      }
    }
  };

  const toggleCurrency = (code: string) => {
    setSelectedCurrencies(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const saveCurrencySelection = () => {
    onUpdateEnabledCurrencies(selectedCurrencies);
    setShowCurrencySelector(false);
    toast.success("已保存貨幣選擇");
  };

  const toggleAllCurrencies = () => {
    const allCurrencies = COMMON_CURRENCIES.map(c => c.code).filter(c => c !== baseCurrency);
    if (selectedCurrencies.length === allCurrencies.length) {
      setSelectedCurrencies([]);
    } else {
      setSelectedCurrencies(allCurrencies);
    }
  };

  // 獲取當前匯率顯示值
  const getCurrentRateDisplay = (currency: string): string => {
    const rate = currentRates[currency];
    if (rate === undefined || rate === null) {
      const baseRate = DEFAULT_RATES[baseCurrency] || 1;
      const targetRate = DEFAULT_RATES[currency] || 1;
      return (baseRate / targetRate).toFixed(4);
    }
    if (typeof rate === "string") {
      return rate;
    }
    return rate.toFixed(4);
  };

  // 獲取當前匯率數值
  const getCurrentRate = (currency: string): number => {
    const rate = currentRates[currency];
    if (rate === undefined || rate === null) {
      const baseRate = DEFAULT_RATES[baseCurrency] || 1;
      const targetRate = DEFAULT_RATES[currency] || 1;
      return baseRate / targetRate;
    }
    if (typeof rate === "string") {
      return parseFloat(rate) || 0;
    }
    return rate;
  };

  // 獲取 API 匯率（上次匯率）
  const getApiRate = (currency: string): number | null => {
    if (apiRates[currency] !== undefined) {
      return apiRates[currency];
    }
    return null;
  };

  const baseCurrencyInfo = COMMON_CURRENCIES.find(c => c.code === baseCurrency);
  
  const displayCurrencies = COMMON_CURRENCIES.filter(
    c => c.code !== baseCurrency && selectedCurrencies.includes(c.code)
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            匯率設定
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCurrencySelector(!showCurrencySelector)}
            >
              <Settings2 className="w-4 h-4 mr-1" />
              貨幣
              {showCurrencySelector ? (
                <ChevronUp className="w-3 h-3 ml-1" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-1" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLiveRates}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              更新
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          基礎貨幣：<strong>{baseCurrencyInfo?.name || baseCurrency}</strong> ({baseCurrency})
        </p>
      </CardHeader>
      <CardContent>
        {/* 貨幣選擇器 */}
        {showCurrencySelector && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">選擇需要的貨幣</span>
              <Button variant="ghost" size="sm" onClick={toggleAllCurrencies}>
                {selectedCurrencies.length === COMMON_CURRENCIES.length - 1 ? "取消全選" : "全選"}
              </Button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {COMMON_CURRENCIES
                .filter(c => c.code !== baseCurrency)
                .map(({ code, name }) => (
                  <label
                    key={code}
                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedCurrencies.includes(code)}
                      onCheckedChange={() => toggleCurrency(code)}
                    />
                    <span className="text-sm">{code}</span>
                    <span className="text-xs text-gray-500">{name}</span>
                  </label>
                ))}
            </div>
            <Button size="sm" onClick={saveCurrencySelection} className="w-full">
              確認選擇 ({selectedCurrencies.length} 種貨幣)
            </Button>
          </div>
        )}

        {/* 上次獲取時間 */}
        <div className="p-3 rounded-lg bg-gray-50 border mb-4">
          <div className="text-xs text-gray-500 mb-1">上次獲取匯率</div>
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <Clock className="w-3 h-3" />
            {ratesLastFetched 
              ? new Date(ratesLastFetched).toLocaleString("zh-TW")
              : "尚未獲取"
            }
          </div>
        </div>

        {/* 實時匯率資訊 */}
        {liveRates && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${
            liveRates.success 
              ? "bg-green-50 border border-green-200" 
              : "bg-amber-50 border border-amber-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {liveRates.success ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                )}
                <span className={liveRates.success ? "text-green-700" : "text-amber-700"}>
                  {liveRates.success ? "實時匯率已獲取" : "使用備用匯率"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(liveRates.updatedAt).toLocaleString("zh-TW")}
              </div>
            </div>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetToApiRates}
            disabled={Object.keys(apiRates).length === 0}
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            重置
          </Button>
          <Button
            size="sm"
            onClick={saveRates}
            disabled={!hasChanges}
            className="bg-sky-500 hover:bg-sky-600"
          >
            <Save className="w-4 h-4 mr-1" />
            保存匯率
          </Button>
        </div>

        {/* 匯率列表 */}
        {displayCurrencies.length > 0 ? (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium pb-2 border-b">
              <span className="col-span-3">貨幣</span>
              <span className="col-span-4 text-right">API匯率</span>
              <span className="col-span-5 text-right">匯率</span>
            </div>

            {displayCurrencies.map(({ code }) => {
              const apiRate = getApiRate(code);

              return (
                <div key={code} className="grid grid-cols-12 gap-2 items-center py-2 border-b last:border-0">
                  <div className="col-span-3">
                    <span className="font-medium text-gray-900">{code}</span>
                  </div>

                  <div className="col-span-4 text-right text-sm text-gray-500">
                    {apiRate !== null
                      ? apiRate.toFixed(4)
                      : <span className="text-gray-400">-</span>
                    }
                  </div>

                  <div className="col-span-5 flex items-center justify-end">
                    <Input
                      type="number"
                      step="0.0001"
                      value={getCurrentRateDisplay(code)}
                      onChange={(e) => updateRate(code, e.target.value)}
                      onBlur={() => handleBlur(code)}
                      className="w-28 h-8 text-right text-sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">尚未選擇貨幣</p>
            <p className="text-xs mt-1">點擊上方「貨幣」按鈕選擇需要的貨幣</p>
          </div>
        )}

        {/* 說明 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
          <p className="font-medium mb-1">💡 匯率說明</p>
          <p>匯率表示 1 單位目標貨幣可兌換多少基礎貨幣。</p>
          <p className="mt-1">例如：JPY 匯率為 0.052，表示 1 JPY = 0.052 {baseCurrency}</p>
          <p className="mt-2">• API匯率：從 API 獲取的最新匯率</p>
          <p>• 匯率：當前使用的匯率（可直接編輯）</p>
          <p>• 重置：將匯率重置為 API 匯率</p>
        </div>
      </CardContent>
    </Card>
  );
}
