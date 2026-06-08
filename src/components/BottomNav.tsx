"use client";

import { Home, Ticket, Users, UserCheck } from "lucide-react";
import type { AppTab } from "@/lib/types";

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const tabs: { id: AppTab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "guests", label: "Guests", icon: Users },
  { id: "passes", label: "Passes", icon: Ticket },
  { id: "rsvp", label: "RSVP", icon: UserCheck },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 safe-bottom">
      <div className="max-w-3xl mx-auto grid grid-cols-4">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center py-2.5 gap-1 text-[11px] font-semibold transition-colors ${
                active ? "text-[#BF3B2B]" : "text-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[#BF3B2B]" : "text-slate-400"}`} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
