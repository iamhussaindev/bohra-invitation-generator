"use client";

import type { GuestEntry } from "@/lib/types";
import {
  getInviteAdultsInputValue,
  getInviteKidsInputValue,
  getLedgerAdults,
  getLedgerKids,
  isInviteCountsModified,
  revertInviteCounts,
} from "@/lib/invite-counts";

interface InviteCountEditorProps {
  entry: GuestEntry;
  onUpdate: (fields: Partial<GuestEntry>) => void;
  onAddAll: () => void;
}

export function InviteCountEditor({ entry, onUpdate, onAddAll }: InviteCountEditorProps) {
  const showRevert = isInviteCountsModified(entry);

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase text-amber-800">Invite Counts (on pass)</p>
        <div className="flex items-center gap-2 shrink-0">
          {showRevert && (
            <button
              type="button"
              onClick={() => onUpdate(revertInviteCounts(entry))}
              className="text-[10px] font-semibold text-slate-500"
            >
              Revert
            </button>
          )}
          <button
            type="button"
            onClick={onAddAll}
            className="text-[10px] font-semibold text-[#BF3B2B]"
          >
            Add All
          </button>
        </div>
      </div>
      <p className="text-[10px] text-amber-900/70 text-center">
        Ledger: {getLedgerAdults(entry)} adults · {getLedgerKids(entry)} kids
        {entry.totalCount > getLedgerAdults(entry) + getLedgerKids(entry)
          ? ` · ${entry.totalCount} total`
          : ""}
      </p>
      <div className="grid grid-cols-2 gap-2 text-center">
        <InviteCountInput
          label="Adults"
          value={getInviteAdultsInputValue(entry)}
          isAllOnPass={Boolean(entry.inviteAllAdults)}
          onChange={(value) =>
            onUpdate({
              inviteAdultsCount: value,
              inviteAllAdults: false,
            })
          }
        />
        <InviteCountInput
          label="Kids"
          value={getInviteKidsInputValue(entry)}
          isAllOnPass={Boolean(entry.inviteAllKids)}
          onChange={(value) =>
            onUpdate({
              inviteKidsCount: value,
              inviteAllKids: false,
            })
          }
        />
      </div>
    </div>
  );
}

function InviteCountInput({
  label,
  value,
  isAllOnPass,
  onChange,
}: {
  label: string;
  value: number;
  isAllOnPass: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase text-slate-400 font-bold block mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
          className={`w-full bg-white border rounded-lg py-2 text-center text-sm font-semibold text-slate-900 ${
            isAllOnPass ? "border-[#BF3B2B]/40 pr-10" : "border-slate-200"
          }`}
        />
        {isAllOnPass && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#BF3B2B] pointer-events-none">
            All
          </span>
        )}
      </div>
    </div>
  );
}
