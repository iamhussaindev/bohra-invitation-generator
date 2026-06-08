"use client";

import { Ticket } from "lucide-react";
import type { AppTab } from "@/lib/types";

interface AppHeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const titles: Record<AppTab, string> = {
  home: "Terminal",
  guests: "Guest List",
  passes: "Boarding Pass",
  rsvp: "RSVP Tracker",
};

export function AppHeader({ activeTab }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#BF3B2B] text-white shadow-md px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        <Ticket className="w-7 h-7 text-amber-300 shrink-0" />
        <div className="min-w-0">
          <h1 className="font-serif text-lg font-bold tracking-wide truncate">NAFEESA AIRLINES</h1>
          <p className="text-[11px] text-amber-100 truncate">{titles[activeTab]} · Boarding Pass Generator</p>
        </div>
      </div>
    </header>
  );
}
