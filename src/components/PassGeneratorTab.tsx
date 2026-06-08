"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Download, RefreshCw, Share2, Trash2 } from "lucide-react";
import type { GuestEntry, GuestSection, OverlayCoords } from "@/lib/types";
import { DEFAULT_COORDS } from "@/lib/types";
import {
  buildRsvpUrl,
  drawGuestOverlay,
  generateFallbackTemplate,
  generateRsvpCode,
} from "@/lib/client-canvas";
import { formatGuestName } from "@/lib/name-utils";

interface PassGeneratorTabProps {
  guestSections: GuestSection[];
  selectedGuest: GuestEntry | null;
  coords: OverlayCoords;
  uploadedTemplateImage: string | null;
  onSelectGuest: (guest: GuestEntry) => void;
  onUpdateEntry: (sectionIdx: number, entryIdx: number, fields: Partial<GuestEntry>) => void;
  onCoordsChange: (coords: OverlayCoords) => void;
  onSimulateRsvp: (status: "Accepted" | "Declined") => void;
}

export function PassGeneratorTab({
  guestSections,
  selectedGuest,
  coords,
  uploadedTemplateImage,
  onSelectGuest,
  onUpdateEntry,
  onCoordsChange,
  onSimulateRsvp,
}: PassGeneratorTabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedLink, setCopiedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedGuest) return;

    if (uploadedTemplateImage) {
      const img = new Image();
      img.src = uploadedTemplateImage;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        drawGuestOverlay(ctx, selectedGuest, coords);
      };
    } else {
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      generateFallbackTemplate(ctx, 800, 1000, selectedGuest.cleanedNames, {
        ladies: selectedGuest.ladiesCount,
        gents: selectedGuest.gentsCount,
        kids: selectedGuest.kidsCount,
      });
    }
  }, [selectedGuest, uploadedTemplateImage, coords]);

  const generateServerImage = useCallback(
    async (guest: GuestEntry) => {
      const response = await fetch("/api/generate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest,
          coords,
          templateImage: uploadedTemplateImage,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate invite.");
      return data.image as string;
    },
    [coords, uploadedTemplateImage]
  );

  const handleDownload = async () => {
    if (!selectedGuest) return;
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const image = await generateServerImage(selectedGuest);
      const link = document.createElement("a");
      link.download = `boarding-pass-${selectedGuest.cleanedNames.replace(/\s+/g, "_")}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Download failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!selectedGuest) return;
    setIsGenerating(true);
    setErrorMsg("");
    try {
      const code = generateRsvpCode();
      const rsvpUrl = buildRsvpUrl(selectedGuest, code);
      const shareText = `✈ Your boarding pass for Nafeesa's 1st Birthday!\n\nPassenger: ${selectedGuest.cleanedNames}\nInvitees: ${selectedGuest.ladiesCount + selectedGuest.gentsCount} | Kids: ${selectedGuest.kidsCount}\n\nRSVP here: ${rsvpUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: "Nafeesa Airlines Boarding Pass",
          text: shareText,
          url: rsvpUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedLink(rsvpUrl);
        setTimeout(() => setCopiedLink(""), 4000);
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setErrorMsg(error instanceof Error ? error.message : "Share failed.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const allGuests = guestSections.flatMap((section) => section.entries);

  const handleDownloadAll = async () => {
    setIsBulkGenerating(true);
    setErrorMsg("");
    try {
      for (let i = 0; i < allGuests.length; i++) {
        const guest = allGuests[i];
        setBulkProgress(`${i + 1} / ${allGuests.length}: ${guest.cleanedNames}`);
        const image = await generateServerImage(guest);
        const link = document.createElement("a");
        link.download = `boarding-pass-${guest.cleanedNames.replace(/\s+/g, "_")}.png`;
        link.href = image;
        link.click();
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
      setBulkProgress(`Downloaded ${allGuests.length} invites`);
      setTimeout(() => setBulkProgress(""), 3000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Bulk download failed.");
    } finally {
      setIsBulkGenerating(false);
    }
  };

  const updateGuestName = (name: string) => {
    if (!selectedGuest) return;
    guestSections.forEach((section, sIdx) => {
      const eIdx = section.entries.findIndex((entry) => entry.id === selectedGuest.id);
      if (eIdx !== -1) {
        onUpdateEntry(sIdx, eIdx, { cleanedNames: name });
      }
    });
  };

  if (!selectedGuest || allGuests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-sm">
        <h2 className="text-xl font-serif font-bold text-slate-900">Boarding Pass Designer</h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload a ledger photo or add guests first, then come back to generate passes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-serif font-bold text-slate-900">Boarding Pass Designer</h2>
        <p className="text-xs text-slate-500 mt-1">Preview on canvas, generate via API, share RSVP link</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{errorMsg}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm">
        <label className="text-[11px] font-bold uppercase text-slate-500 block">Select Family</label>
        <select
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-semibold"
          value={selectedGuest.id}
          onChange={(e) => {
            for (const section of guestSections) {
              const found = section.entries.find((entry) => entry.id === e.target.value);
              if (found) {
                onSelectGuest(found);
                break;
              }
            }
          }}
        >
          {guestSections.map((section) => (
            <optgroup key={section.sectionName} label={section.sectionName}>
              {section.entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.cleanedNames} ({entry.totalCount} pax)
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <input
          type="text"
          value={selectedGuest.cleanedNames}
          onChange={(e) => updateGuestName(e.target.value)}
          onBlur={(e) =>
            updateGuestName(
              formatGuestName(
                e.target.value,
                selectedGuest.gender,
                selectedGuest.ladiesCount,
                selectedGuest.gentsCount
              )
            )
          }
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold"
        />

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <CountPill label="Ladies" value={selectedGuest.ladiesCount} />
          <CountPill label="Gents" value={selectedGuest.gentsCount} />
          <CountPill label="Kids" value={selectedGuest.kidsCount} />
        </div>
      </div>

      <div className="bg-slate-100 rounded-2xl p-3 flex justify-center overflow-hidden">
        <canvas ref={canvasRef} className="max-w-full h-auto rounded-lg border border-slate-200 shadow-inner" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isGenerating || isBulkGenerating}
          className="bg-white border border-slate-300 text-slate-700 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={isGenerating || isBulkGenerating}
          className="bg-[#BF3B2B] text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Share2 className="w-4 h-4" /> Share + RSVP
        </button>
      </div>

      <button
        type="button"
        onClick={handleDownloadAll}
        disabled={isGenerating || isBulkGenerating || allGuests.length === 0}
        className="w-full bg-slate-900 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isBulkGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Generate All Invites ({allGuests.length})
      </button>

      {bulkProgress && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 p-3 rounded-xl text-xs">{bulkProgress}</div>
      )}

      {copiedLink && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-xs">
          Copied RSVP link: {copiedLink}
        </div>
      )}

      <details className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
        <summary className="text-sm font-semibold text-slate-800 cursor-pointer">Overlay Position Settings</summary>
        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => onCoordsChange(DEFAULT_COORDS)}
            className="text-xs text-[#BF3B2B] font-semibold"
          >
            Reset positions
          </button>
          <SliderField label="Name X" value={coords.nameX} min={200} max={3200} onChange={(v) => onCoordsChange({ ...coords, nameX: v })} />
          <SliderField label="Name Y" value={coords.nameY} min={200} max={1200} onChange={(v) => onCoordsChange({ ...coords, nameY: v })} />
          <SliderField label="Invitees X" value={coords.inviteesX} min={200} max={3200} onChange={(v) => onCoordsChange({ ...coords, inviteesX: v })} />
          <SliderField label="Invitees Y" value={coords.inviteesY} min={3600} max={4150} onChange={(v) => onCoordsChange({ ...coords, inviteesY: v })} />
          <SliderField label="Kids X" value={coords.kidsX} min={200} max={3200} onChange={(v) => onCoordsChange({ ...coords, kidsX: v })} />
          <SliderField label="Kids Y" value={coords.kidsY} min={3600} max={4150} onChange={(v) => onCoordsChange({ ...coords, kidsY: v })} />
          <SliderField label="Name Font Size" value={coords.fontSize} min={24} max={120} onChange={(v) => onCoordsChange({ ...coords, fontSize: v })} />
          <SliderField label="Count Font Size" value={coords.countFontSize} min={18} max={90} onChange={(v) => onCoordsChange({ ...coords, countFontSize: v })} />
        </div>
      </details>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase">RSVP Simulator</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSimulateRsvp("Accepted")}
            className="flex-1 bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Accept
          </button>
          <button
            type="button"
            onClick={() => onSimulateRsvp("Declined")}
            className="flex-1 bg-rose-600 text-white text-xs font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Decline
          </button>
        </div>
      </div>
    </div>
  );
}

function CountPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg py-2">
      <div className="text-[10px] uppercase text-slate-400 font-bold">{label}</div>
      <div className="font-bold text-slate-900">{value}</div>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-[#BF3B2B]"
      />
    </div>
  );
}
