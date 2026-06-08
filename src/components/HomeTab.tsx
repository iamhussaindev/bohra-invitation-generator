"use client";

import { Camera, Check, RefreshCw, Sparkles, Upload, Users } from "lucide-react";

interface HomeTabProps {
  totalFamilies: number;
  totalSections: number;
  acceptedRsvps: number;
  hasCustomTemplate: boolean;
  isProcessing: boolean;
  errorMsg: string;
  onUploadLedger: (file: File, useDemo?: boolean) => Promise<void>;
  onTemplateUpload: (file: File) => Promise<void>;
  onResetTemplate: () => void;
  onGoToGuests: () => void;
}

export function HomeTab({
  totalFamilies,
  totalSections,
  acceptedRsvps,
  hasCustomTemplate,
  isProcessing,
  errorMsg,
  onUploadLedger,
  onTemplateUpload,
  onResetTemplate,
  onGoToGuests,
}: HomeTabProps) {
  return (
    <div className="space-y-4">
      <section className="bg-gradient-to-br from-red-50 to-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
        <span className="inline-block bg-[#BF3B2B] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Nafeesa&apos;s 1st Birthday
        </span>
        <h2 className="mt-3 text-2xl font-serif font-black text-[#2C3E50] leading-tight">
          Upload your guest ledger
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Take a photo of your handwritten list. AI will read the text, clean names, and build your guest list.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <label className="flex items-center justify-center gap-2 bg-[#BF3B2B] active:bg-red-700 text-white font-semibold px-4 py-3.5 rounded-xl cursor-pointer transition shadow-md">
            <Camera className="w-5 h-5" />
            <span>Capture Ledger Photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="hidden"
              disabled={isProcessing}
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

          <label className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-3.5 rounded-xl cursor-pointer active:bg-slate-50">
            <Upload className="w-5 h-5 text-slate-500" />
            <span>Upload from Gallery</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              className="hidden"
              disabled={isProcessing}
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

          <button
            type="button"
            onClick={onGoToGuests}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 font-semibold px-4 py-3 rounded-xl"
          >
            <Users className="w-5 h-5 text-slate-500" />
            View Guest List
          </button>
        </div>
      </section>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">{errorMsg}</div>
      )}

      {isProcessing && (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-[#BF3B2B] animate-spin mx-auto" />
          <p className="mt-3 text-sm font-semibold text-slate-800">Reading ledger with AI...</p>
          <p className="mt-1 text-xs text-slate-500">Extracting names and building your guest list</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Families" value={String(totalFamilies)} />
        <StatCard label="Sections" value={String(totalSections)} />
        <StatCard label="RSVPs" value={String(acceptedRsvps)} />
        <StatCard label="Template" value={hasCustomTemplate ? "Active" : "Loading..."} />
      </div>

      <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <h3 className="font-serif font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#BF3B2B]" />
          How it works
        </h3>
        <ol className="text-sm text-slate-600 space-y-2 list-decimal pl-4">
          <li>Upload ledger photo with sections like Shekha Mujal.</li>
          <li>Names are cleaned — Ben for ladies, Bhai for gents, relation words removed.</li>
          <li>Generate boarding passes with invitee + kids counts on canvas.</li>
          <li>Share RSVP link via WhatsApp.</li>
        </ol>
      </section>

      <section className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <h3 className="font-serif font-bold text-slate-900">Invitation Template</h3>
        <p className="text-sm text-slate-600">
          Nafeesa&apos;s boarding pass template is pre-loaded. Upload a different image to replace it.
        </p>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-xl py-4 cursor-pointer text-sm text-slate-500 active:border-red-400">
          <Upload className="w-4 h-4" />
          {hasCustomTemplate ? "Change Template" : "Upload Template"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onTemplateUpload(file);
            }}
          />
        </label>
        {hasCustomTemplate && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Template active
            </span>
            <button type="button" onClick={onResetTemplate} className="text-red-500 font-medium">
              Reset
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      <div className="text-xl font-bold text-slate-900">{value}</div>
      <div className="text-[10px] uppercase font-semibold text-slate-500 mt-1">{label}</div>
    </div>
  );
}
