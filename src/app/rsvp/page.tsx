"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Ticket, X } from "lucide-react";

function RsvpContent() {
  const searchParams = useSearchParams();
  const guestName = searchParams.get("g") || "Guest";
  const ladies = Number(searchParams.get("l") || 0);
  const gents = Number(searchParams.get("gt") || 0);
  const kids = Number(searchParams.get("k") || 0);
  const code = searchParams.get("code") || "DEMO";
  const [submitted, setSubmitted] = useState<"Accepted" | "Declined" | null>(null);

  const totalInvitees = ladies + gents;

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <header className="bg-[#BF3B2B] text-white px-4 py-5 text-center">
        <Ticket className="w-8 h-8 text-amber-300 mx-auto mb-2" />
        <h1 className="font-serif text-xl font-bold">NAFEESA AIRLINES</h1>
        <p className="text-xs text-amber-100 mt-1">RSVP Boarding Confirmation</p>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-4">
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <p className="text-[11px] uppercase font-bold text-slate-400">Confirmation Code</p>
          <p className="font-mono text-lg font-bold text-[#BF3B2B]">{code}</p>
          <p className="text-sm text-slate-600">Passenger</p>
          <p className="font-serif text-xl font-bold text-slate-900">{guestName}</p>
          <div className="grid grid-cols-3 gap-2 pt-2">
            <InfoPill label="Invitees" value={totalInvitees} />
            <InfoPill label="Ladies" value={ladies} />
            <InfoPill label="Gents" value={gents} />
            <InfoPill label="Kids" value={kids} />
          </div>
        </section>

        {!submitted ? (
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => setSubmitted("Accepted")}
              className="bg-emerald-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" /> Accept Invitation
            </button>
            <button
              type="button"
              onClick={() => setSubmitted("Declined")}
              className="bg-rose-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" /> Decline
            </button>
          </div>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
            <p className="text-sm text-slate-500">Your response</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                submitted === "Accepted" ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {submitted}
            </p>
            <p className="mt-3 text-xs text-slate-500">
              This demo RSVP page uses test.com. In production, responses would sync to your tracker.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg py-2 text-center">
      <div className="text-[10px] uppercase text-slate-400 font-bold">{label}</div>
      <div className="font-bold text-slate-900">{value}</div>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
      <RsvpContent />
    </Suspense>
  );
}
