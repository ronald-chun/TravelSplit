"use client";
// TravelSplit Home Page

import { useEffect, useState, useSyncExternalStore } from "react";
import { useTravelStore } from "@/store/travel";
import { Dashboard } from "@/components/travel/Dashboard";
import { ExpensesList } from "@/components/travel/ExpensesList";
import { Settlement } from "@/components/travel/Settlement";
import { Settings } from "@/components/travel/Settings";
import { TripSelector } from "@/components/travel/TripSelector";
import { CreateTripModal } from "@/components/travel/CreateTripModal";
import { JoinTripModal } from "@/components/travel/JoinTripModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutDashboard, 
  Receipt, 
  Calculator, 
  Settings as SettingsIcon, 
  Plane,
  Plus,
  KeyRound,
  Loader2
} from "lucide-react";

// Floating Action Button Component
function FloatingActionButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white z-40 md:right-8"
      size="icon"
    >
      <Plus className="w-6 h-6" />
    </Button>
  );
}

// 歡迎頁面組件
function WelcomePage({ 
  onCreateTrip, 
  onJoinTrip 
}: { 
  onCreateTrip: () => void; 
  onJoinTrip: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Plane className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            TravelSplit
          </h1>
          <p className="text-gray-600 mb-2">
            旅行費用分攤追蹤器
          </p>
          <p className="text-sm text-gray-500 mb-8">
            記錄旅行開銷，輕鬆結算分攤
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={onCreateTrip}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 text-white py-6 text-lg rounded-xl shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              開始新旅行
            </Button>
            
            <Button
              onClick={onJoinTrip}
              variant="outline"
              className="w-full py-6 text-lg rounded-xl"
            >
              <KeyRound className="w-5 h-5 mr-2" />
              輸入 PIN 碼加入旅程
            </Button>
          </div>
        </div>
      </main>
      
      <footer className="py-4 text-center text-sm text-gray-400">
        記錄 · 分攤 · 結算
      </footer>
    </div>
  );
}

// 主頁面組件
function MainPage({ 
  activeTab, 
  setActiveTab, 
  onJoinTrip,
  onCreateTrip,
  setShowAddExpense 
}: { 
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onJoinTrip: () => void;
  onCreateTrip: () => void;
  setShowAddExpense: (show: boolean) => void;
}) {
  const { currentTrip } = useTravelStore();

  if (!currentTrip) {
    return <TripSelector />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900">TravelSplit</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onJoinTrip}
                className="text-sky-600"
              >
                <KeyRound className="w-4 h-4 mr-1" />
                加入
              </Button>
              <TripSelector compact />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
        {/* Trip Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{currentTrip.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {currentTrip.startDate} ~ {currentTrip.endDate}
            {currentTrip.members.length > 0 && (
              <span className="ml-2">· {currentTrip.members.length} 人</span>
            )}
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-1">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">概覽</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-1">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">費用</span>
            </TabsTrigger>
            <TabsTrigger value="settlement" className="flex items-center gap-1">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">結算</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">設定</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard />
          </TabsContent>
          <TabsContent value="expenses">
            <ExpensesList externalShowAdd={false} onExternalShowAddChange={setShowAddExpense} />
          </TabsContent>
          <TabsContent value="settlement">
            <Settlement />
          </TabsContent>
          <TabsContent value="settings">
            <Settings onCreateTrip={onCreateTrip} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button - 只在有成員時顯示 */}
      {currentTrip.members.length > 0 && (
        <FloatingActionButton
          onClick={() => {
            setActiveTab("expenses");
            setShowAddExpense(true);
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t py-4 text-center text-sm text-gray-400">
        TravelSplit · 記錄 · 分攤 · 結算
      </footer>
    </div>
  );
}

// 用於檢測客戶端的 hook
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function Home() {
  const isClient = useIsClient();
  const { initialize, isLoading, joinedTripIds } = useTravelStore();
  const [showCreateTrip, setShowCreateTrip] = useState(false);
  const [showJoinTrip, setShowJoinTrip] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (isClient) {
      initialize();
    }
  }, [initialize, isClient]);

  // 載入中狀態
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <p className="mt-4 text-gray-500">載入中...</p>
      </div>
    );
  }

  const handleCreateTrip = () => setShowCreateTrip(true);
  const handleJoinTrip = () => setShowJoinTrip(true);

  return (
    <>
      {/* 根據是否有已加入的旅程決定顯示哪個頁面 */}
      {joinedTripIds.length === 0 ? (
        <WelcomePage onCreateTrip={handleCreateTrip} onJoinTrip={handleJoinTrip} />
      ) : (
        <MainPage 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onJoinTrip={handleJoinTrip}
          onCreateTrip={handleCreateTrip}
          setShowAddExpense={setShowAddExpense}
        />
      )}

      {/* Modal 只在最頂層渲染一次 */}
      <CreateTripModal open={showCreateTrip} onOpenChange={setShowCreateTrip} />
      <JoinTripModal open={showJoinTrip} onOpenChange={setShowJoinTrip} />
    </>
  );
}
