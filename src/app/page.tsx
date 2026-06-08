"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/HomeTab";
import { GuestListTab } from "@/components/GuestListTab";
import { PassGeneratorTab } from "@/components/PassGeneratorTab";
import { RsvpTrackerTab } from "@/components/RsvpTrackerTab";
import { AppHeader } from "@/components/AppHeader";
import { MOCK_LEDGER_DATA, MOCK_RSVP_DATA } from "@/lib/mock-data";
import { capitalizeGuestSections } from "@/lib/name-utils";
import type { AppTab, GuestEntry, GuestSection, OverlayCoords, RsvpRecord } from "@/lib/types";
import { DEFAULT_TEMPLATE_URL } from "@/lib/invite-template";
import { DEFAULT_COORDS } from "@/lib/types";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [guestSections, setGuestSections] = useState<GuestSection[]>(
    () => capitalizeGuestSections(MOCK_LEDGER_DATA)
  );
  const [selectedGuest, setSelectedGuest] = useState<GuestEntry>(MOCK_LEDGER_DATA[0].entries[0]);
  const [uploadedTemplateImage, setUploadedTemplateImage] = useState<string | null>(null);
  const [isTemplateReady, setIsTemplateReady] = useState(false);
  const [coords, setCoords] = useState<OverlayCoords>(DEFAULT_COORDS);
  const [rsvpList, setRsvpList] = useState<RsvpRecord[]>(MOCK_RSVP_DATA);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(DEFAULT_TEMPLATE_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load invitation template.");
        return response.blob();
      })
      .then((blob) => blobToBase64(blob))
      .then((base64) => {
        if (!cancelled) {
          setUploadedTemplateImage(base64);
          setIsTemplateReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) setIsTemplateReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalFamilies = useMemo(
    () => guestSections.reduce((acc, section) => acc + section.entries.length, 0),
    [guestSections]
  );

  const handleLedgerUpload = async (file: File, useDemo = false) => {
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch("/api/process-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, useDemo }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process ledger.");
      }

      setGuestSections(data.sections);
      if (data.sections[0]?.entries[0]) {
        setSelectedGuest(data.sections[0].entries[0]);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to process ledger.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateEntry = (
    sectionIdx: number,
    entryIdx: number,
    updatedFields: Partial<GuestEntry>
  ) => {
    setGuestSections((prev) => {
      const updated = [...prev];
      const entry = updated[sectionIdx].entries[entryIdx];
      const nextEntry = {
        ...entry,
        ...updatedFields,
        totalCount:
          (updatedFields.ladiesCount ?? entry.ladiesCount) +
          (updatedFields.gentsCount ?? entry.gentsCount) +
          (updatedFields.kidsCount ?? entry.kidsCount),
      };
      updated[sectionIdx].entries[entryIdx] = nextEntry;

      if (selectedGuest.id === nextEntry.id) {
        setSelectedGuest(nextEntry);
      }

      return updated;
    });
  };

  const handleAddEntry = (sectionIdx: number) => {
    setGuestSections((prev) => {
      const updated = [...prev];
      updated[sectionIdx].entries.push({
        id: `custom-${Date.now()}`,
        originalText: "New Entry",
        cleanedNames: "New Guest",
        gender: "mixed",
        ladiesCount: 1,
        gentsCount: 1,
        kidsCount: 0,
        totalCount: 2,
      });
      return updated;
    });
  };

  const handleAddSection = () => {
    const name = prompt("Enter section name:");
    if (!name) return;
    setGuestSections((prev) => [...prev, { sectionName: name, entries: [] }]);
  };

  const handleRemoveSection = (sectionIdx: number) => {
    if (!confirm("Delete this entire section?")) return;
    setGuestSections((prev) => prev.filter((_, idx) => idx !== sectionIdx));
  };

  const handleRemoveEntry = (sectionIdx: number, entryIdx: number) => {
    setGuestSections((prev) => {
      const updated = [...prev];
      updated[sectionIdx].entries.splice(entryIdx, 1);
      return updated;
    });
  };

  const simulateGuestRSVP = (status: "Accepted" | "Declined") => {
    setRsvpList((prev) => [
      {
        id: String(Date.now()),
        name: selectedGuest.cleanedNames,
        status,
        ladies: status === "Accepted" ? selectedGuest.ladiesCount : 0,
        gents: status === "Accepted" ? selectedGuest.gentsCount : 0,
        kids: status === "Accepted" ? selectedGuest.kidsCount : 0,
        timestamp: "Just now",
      },
      ...prev,
    ]);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 flex flex-col safe-bottom">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-28">
        {activeTab === "home" && (
          <HomeTab
            totalFamilies={totalFamilies}
            totalSections={guestSections.length}
            acceptedRsvps={rsvpList.filter((r) => r.status === "Accepted").length}
            hasCustomTemplate={Boolean(uploadedTemplateImage && isTemplateReady)}
            isProcessing={isProcessing}
            onUploadLedger={handleLedgerUpload}
            onTemplateUpload={async (file) => setUploadedTemplateImage(await fileToBase64(file))}
            onResetTemplate={async () => {
              const base64 = await fetch(DEFAULT_TEMPLATE_URL)
                .then((r) => r.blob())
                .then((blob) => blobToBase64(blob));
              setUploadedTemplateImage(base64);
            }}
            onGoToGuests={() => setActiveTab("guests")}
          />
        )}

        {activeTab === "guests" && (
          <GuestListTab
            guestSections={guestSections}
            isProcessing={isProcessing}
            errorMsg={errorMsg}
            onUploadLedger={handleLedgerUpload}
            onUpdateEntry={handleUpdateEntry}
            onAddEntry={handleAddEntry}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            onRemoveEntry={handleRemoveEntry}
            onGeneratePass={(entry) => {
              setSelectedGuest(entry);
              setActiveTab("passes");
            }}
          />
        )}

        {activeTab === "passes" && (
          <PassGeneratorTab
            guestSections={guestSections}
            selectedGuest={selectedGuest}
            coords={coords}
            uploadedTemplateImage={uploadedTemplateImage}
            onSelectGuest={setSelectedGuest}
            onUpdateEntry={handleUpdateEntry}
            onCoordsChange={setCoords}
            onSimulateRsvp={simulateGuestRSVP}
          />
        )}

        {activeTab === "rsvp" && (
          <RsvpTrackerTab rsvpList={rsvpList} onClear={() => setRsvpList([])} />
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return fileToBase64(new File([blob], "invitation-template.jpg", { type: blob.type }));
}
