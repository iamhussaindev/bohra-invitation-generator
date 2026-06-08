"use client";

import type { RsvpRecord } from "@/lib/types";

interface RsvpTrackerTabProps {
  rsvpList: RsvpRecord[];
  onClear: () => void;
}

export function RsvpTrackerTab({ rsvpList, onClear }: RsvpTrackerTabProps) {
  const accepted = rsvpList.filter((r) => r.status === "Accepted");

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900">RSVP Tracker</h2>
          <p className="text-xs text-slate-500 mt-1">Live responses from shared boarding pass links</p>
        </div>
        <button type="button" onClick={onClear} className="text-xs text-red-600 font-bold">
          Clear
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Accepted" value={accepted.length} tone="emerald" />
        <Stat
          label="Confirmed Pax"
          value={accepted.reduce((acc, r) => acc + r.ladies + r.gents + r.kids, 0)}
          tone="slate"
        />
        <Stat label="Ladies" value={accepted.reduce((acc, r) => acc + r.ladies, 0)} tone="slate" />
        <Stat label="Kids" value={accepted.reduce((acc, r) => acc + r.kids, 0)} tone="amber" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {rsvpList.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            No RSVPs yet. Share a boarding pass link from the Passes tab.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {rsvpList.map((rsvp) => (
              <div key={rsvp.id} className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{rsvp.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{rsvp.timestamp}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rsvp.status === "Accepted"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {rsvp.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-3 text-xs text-slate-600">
                  <span>L: {rsvp.ladies}</span>
                  <span>G: {rsvp.gents}</span>
                  <span>K: {rsvp.kids}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "slate" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
    slate: "bg-slate-50 border-slate-200 text-slate-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-[10px] font-bold uppercase mt-1 opacity-70">{label}</div>
    </div>
  );
}
