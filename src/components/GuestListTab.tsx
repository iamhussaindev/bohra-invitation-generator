"use client";

import { useState } from "react";
import { ChevronDown, Plus, RefreshCw, Ticket, Trash2, Upload } from "lucide-react";
import { capitalizeGuestName, formatGuestName } from "@/lib/name-utils";
import type { GuestEntry, GuestSection } from "@/lib/types";

interface GuestListTabProps {
  guestSections: GuestSection[];
  isProcessing: boolean;
  errorMsg: string;
  onUploadLedger: (file: File) => Promise<void>;
  onUpdateEntry: (sectionIdx: number, entryIdx: number, fields: Partial<GuestEntry>) => void;
  onUpdateSection: (sectionIdx: number, sectionName: string) => void;
  onAddEntry: (sectionIdx: number) => void;
  onAddSection: () => void;
  onRemoveSection: (sectionIdx: number) => void;
  onRemoveEntry: (sectionIdx: number, entryIdx: number) => void;
  onGeneratePass: (entry: GuestEntry) => void;
}

export function GuestListTab({
  guestSections,
  isProcessing,
  errorMsg,
  onUploadLedger,
  onUpdateEntry,
  onUpdateSection,
  onAddEntry,
  onAddSection,
  onRemoveSection,
  onRemoveEntry,
  onGeneratePass,
}: GuestListTabProps) {
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});

  const toggleSection = (sectionIdx: number) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionIdx]: !(prev[sectionIdx] ?? true),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-start">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900">Grouped Guest Sections</h2>
          <p className="text-xs text-slate-500 mt-1">Edit names and counts before generating passes</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddSection}
            className="bg-[#BF3B2B] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Section
          </button>
          <label className="bg-white border border-slate-300 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Re-scan
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void onUploadLedger(file).finally(() => {
                    e.target.value = "";
                  });
                }
              }}
            />
          </label>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{errorMsg}</div>
      )}

      {isProcessing && (
        <div className="bg-white border rounded-2xl p-8 text-center">
          <RefreshCw className="w-8 h-8 text-[#BF3B2B] animate-spin mx-auto" />
          <p className="mt-2 text-sm font-medium">Processing ledger with OpenAI...</p>
        </div>
      )}

      {!isProcessing &&
        guestSections.map((section, sectionIdx) => {
          const isCollapsed = collapsedSections[sectionIdx] ?? true;

          return (
            <section
              key={`section-${sectionIdx}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 px-4 py-3 flex justify-between items-center gap-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => toggleSection(sectionIdx)}
                  className="p-1 text-slate-400 shrink-0"
                  aria-label={isCollapsed ? "Expand section" : "Collapse section"}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#BF3B2B]">
                    Section {sectionIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={section.sectionName}
                    onChange={(e) => onUpdateSection(sectionIdx, e.target.value)}
                    onBlur={(e) => {
                      const name =
                        capitalizeGuestName(e.target.value.trim()) || `Section ${sectionIdx + 1}`;
                      onUpdateSection(sectionIdx, name);
                    }}
                    className="w-full font-serif font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-red-300 focus:outline-none py-0.5"
                  />
                  <p className="text-[11px] text-slate-400">{section.entries.length} families</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSection(sectionIdx)}
                  className="p-2 text-slate-400 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {!isCollapsed && (
                <>
                  <div className="divide-y divide-slate-100">
                    {section.entries.length === 0 ? (
                      <p className="p-4 text-sm text-slate-400 text-center">No guests in this section yet.</p>
                    ) : (
                      section.entries.map((entry, entryIdx) => (
                        <div key={entry.id} className="p-4 space-y-3">
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            {entryIdx + 1}. {entry.originalText}
                          </p>
                          <input
                            type="text"
                            value={entry.cleanedNames}
                            onChange={(e) =>
                              onUpdateEntry(sectionIdx, entryIdx, { cleanedNames: e.target.value })
                            }
                            onBlur={(e) =>
                              onUpdateEntry(sectionIdx, entryIdx, {
                                cleanedNames: formatGuestName(
                                  e.target.value,
                                  entry.gender,
                                  entry.ladiesCount,
                                  entry.gentsCount
                                ),
                              })
                            }
                            className="w-full font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                          />
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {(["ladiesCount", "gentsCount", "kidsCount"] as const).map((field, i) => (
                              <div key={field}>
                                <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                                  {["Ladies", "Gents", "Kids"][i]}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={entry[field]}
                                  onChange={(e) =>
                                    onUpdateEntry(sectionIdx, entryIdx, {
                                      [field]: parseInt(e.target.value, 10) || 0,
                                    })
                                  }
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 text-center text-sm"
                                />
                              </div>
                            ))}
                            <div>
                              <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                                Total
                              </label>
                              <div className="py-2 font-bold text-slate-900">{entry.totalCount}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => onGeneratePass(entry)}
                              className="flex-1 bg-red-50 text-[#BF3B2B] font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1"
                            >
                              <Ticket className="w-3.5 h-3.5" /> Boarding Pass
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveEntry(sectionIdx, entryIdx)}
                              className="px-3 py-2.5 rounded-lg border border-slate-200 text-slate-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddEntry(sectionIdx)}
                    className="w-full py-3 text-xs font-semibold text-slate-600 border-t border-slate-100 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add guest to {section.sectionName}
                  </button>
                </>
              )}
            </section>
          );
        })}
    </div>
  );
}
