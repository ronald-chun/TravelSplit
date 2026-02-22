// 結算計算工具
import type { Trip, Expense, Member, SettlementResult, SettlementTransaction } from "@/types";
import { DEFAULT_RATES } from "@/types";

// 計算成員淨餘額
export const calculateMemberBalance = (
  member: Member,
  expenses: Expense[],
  baseCurrency: string,
  customRates?: Record<string, number>,
  allMemberIds?: Set<string> // 傳入所有現有成員 ID
): SettlementResult => {
  let totalPaid = 0;
  let totalOwed = 0;

  expenses.forEach((expense) => {
    // 轉換金額為基礎貨幣
    const amountInBase = convertToBaseCurrency(
      expense.amount,
      expense.currency,
      baseCurrency,
      customRates
    );

    // 如果該成員是付款人
    if (expense.payerId === member.id) {
      totalPaid += amountInBase;
    }

    // 過濾掉已刪除的參與者，只計算現有成員
    const validParticipants = allMemberIds 
      ? expense.participants.filter(id => allMemberIds.has(id))
      : expense.participants;

    // 如果該成員參與分攤（且是有效成員）
    if (validParticipants.includes(member.id) && validParticipants.length > 0) {
      if (expense.splitType === "equal") {
        const share = amountInBase / validParticipants.length;
        totalOwed += share;
      } else if (expense.customSplits && expense.customSplits[member.id]) {
        // 自定義分攤：需要將原始貨幣金額轉換為基礎貨幣
        const customAmountInBase = convertToBaseCurrency(
          expense.customSplits[member.id],
          expense.currency,
          baseCurrency,
          customRates
        );
        totalOwed += customAmountInBase;
      }
    }
  });

  return {
    memberId: member.id,
    memberName: member.name,
    totalPaid,
    totalOwed,
    balance: totalPaid - totalOwed,
  };
};

// 貨幣轉換
export const convertToBaseCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  customRates?: Record<string, number>
): number => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // 優先使用自定義匯率
  if (customRates && customRates[fromCurrency]) {
    // 自定義匯率是相對於基礎貨幣的
    return amount * customRates[fromCurrency];
  }

  // 使用預設匯率 (先轉換為 USD，再轉換為目標貨幣)
  const fromRate = DEFAULT_RATES[fromCurrency] || 1;
  const toRate = DEFAULT_RATES[toCurrency] || 1;
  
  // 先轉換為 USD，再轉換為目標貨幣
  const inUSD = amount / fromRate;
  return inUSD * toRate;
};

// 計算所有成員的結算結果
export const calculateAllBalances = (trip: Trip): SettlementResult[] => {
  // 建立現有成員 ID 的集合，用於過濾無效的參與者
  const memberIds = new Set(trip.members.map(m => m.id));
  
  return trip.members.map((member) =>
    calculateMemberBalance(member, trip.expenses, trip.currency, trip.customRates, memberIds)
  );
};

// 最小化交易次數算法 (Greedy Algorithm)
export const calculateSettlementTransactions = (
  balances: SettlementResult[]
): SettlementTransaction[] => {
  const transactions: SettlementTransaction[] = [];
  
  // 分離債務人和債權人
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];

  balances.forEach((balance) => {
    if (balance.balance < -0.01) {
      // 負數 = 欠錢 (債務人)
      debtors.push({
        id: balance.memberId,
        name: balance.memberName,
        amount: Math.abs(balance.balance),
      });
    } else if (balance.balance > 0.01) {
      // 正數 = 應收 (債權人)
      creditors.push({
        id: balance.memberId,
        name: balance.memberName,
        amount: balance.balance,
      });
    }
  });

  // 按金額排序（大到小）
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // Greedy 算法
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0.01) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: settleAmount,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return transactions;
};

// 計算 Trip 總費用
export const calculateTotalExpenses = (trip: Trip): number => {
  return trip.expenses.reduce((total, expense) => {
    return total + expense.amountInBaseCurrency;
  }, 0);
};

// 按分類計算費用
export const calculateExpensesByCategory = (
  expenses: Expense[]
): Record<string, number> => {
  const result: Record<string, number> = {};

  expenses.forEach((expense) => {
    if (!result[expense.category]) {
      result[expense.category] = 0;
    }
    result[expense.category] += expense.amountInBaseCurrency;
  });

  return result;
};

// 按日期計算費用
export const calculateExpensesByDate = (
  expenses: Expense[]
): Record<string, number> => {
  const result: Record<string, number> = {};

  expenses.forEach((expense) => {
    const date = expense.date.split("T")[0]; // 只取日期部分
    if (!result[date]) {
      result[date] = 0;
    }
    result[date] += expense.amountInBaseCurrency;
  });

  return result;
};

// 生成結算摘要文字
export const generateSettlementSummary = (
  trip: Trip,
  balances: SettlementResult[],
  transactions: SettlementTransaction[]
): string => {
  const lines: string[] = [];
  
  lines.push(`【${trip.name} 結算明細】`);
  lines.push("");
  lines.push("📊 成員收支概覽：");
  
  balances.forEach((balance) => {
    const status = balance.balance >= 0 ? "應收" : "應付";
    const amount = Math.abs(balance.balance).toFixed(2);
    lines.push(`  ${balance.memberName}: ${status} ${trip.currency} ${amount}`);
  });
  
  lines.push("");
  lines.push("💰 結算建議：");
  
  if (transactions.length === 0) {
    lines.push("  已結清，無需結算！");
  } else {
    transactions.forEach((t) => {
      lines.push(`  ${t.fromName} → ${t.toName}: ${trip.currency} ${t.amount.toFixed(2)}`);
    });
  }
  
  return lines.join("\n");
};
