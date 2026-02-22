"use client";

import { useTravelStore } from "@/store/travel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plane, ChevronDown } from "lucide-react";

interface TripSelectorProps {
  compact?: boolean;
}

export function TripSelector({ compact = false }: TripSelectorProps) {
  const { trips, currentTripId, setCurrentTrip } = useTravelStore();

  if (compact && currentTripId) {
    return (
      <Select value={currentTripId} onValueChange={setCurrentTrip}>
        <SelectTrigger className="w-auto min-w-32 border-0 bg-gray-100 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {trips.map((trip) => (
            <SelectItem key={trip.id} value={trip.id}>
              {trip.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Plane className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">TravelSplit</h1>
            <p className="text-gray-500 text-sm">選擇一個旅行繼續</p>
          </div>

          <div className="space-y-3">
            {trips.map((trip) => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setCurrentTrip(trip.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{trip.name}</div>
                      <div className="text-sm text-gray-500">
                        {trip.startDate} ~ {trip.endDate}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {trip.members.length} 人 · {trip.expenses.length} 筆費用
                      </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400 rotate-[-90deg]" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
