"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/HomeTab";
import { GuestListTab } from "@/components/GuestListTab";
import { PassGeneratorTab } from "@/components/PassGeneratorTab";
import { RsvpTrackerTab } from "@/components/RsvpTrackerTab";
import { AppHeader } from "@/components/AppHeader";
import { parseApiJson } from "@/lib/api-utils";
import { compressImageForUpload } from "@/lib/image-utils";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { mergeGuestSections } from "@/lib/ledger-normalize";
import { fillInviteCountsFromLedger } from "@/lib/invite-counts";
import { computeGuestReport } from "@/lib/guest-stats";
import { fetchGuestSections, markInviteSent, saveGuestSections } from "@/lib/supabase/guests";
import { clearRsvps, fetchRsvps } from "@/lib/supabase/rsvps";
import type { AppTab, GuestEntry, GuestSection, OverlayCoords, RsvpRecord } from "@/lib/types";
import { DEFAULT_TEMPLATE_URL } from "@/lib/invite-template";
import { DEFAULT_COORDS } from "@/lib/types";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [guestSections, setGuestSections] = useState<GuestSection[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestEntry | null>(null);
  const [uploadedTemplateImage, setUploadedTemplateImage] = useState<string | null>(null);
  const [isTemplateReady, setIsTemplateReady] = useState(false);
  const [coords, setCoords] = useState<OverlayCoords>(DEFAULT_COORDS);
  const [rsvpList, setRsvpList] = useState<RsvpRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(isSupabaseConfigured());
  const [isDbReady, setIsDbReady] = useState(!isSupabaseConfigured());
  const [errorMsg, setErrorMsg] = useState("");
  const hasUserEditedGuests = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setErrorMsg("Supabase is not configured. Add your project URL and publishable key to .env.local.");
      return;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const [sections, rsvps] = await Promise.all([fetchGuestSections(), fetchRsvps()]);
        if (cancelled) return;

        setGuestSections(sections);
        if (sections[0]?.entries[0]) {
          setSelectedGuest(sections[0].entries[0]);
        }
        setRsvpList(rsvps);
      } catch (error) {
        if (!cancelled) {
          setErrorMsg(error instanceof Error ? error.message : "Failed to load data from Supabase.");
        }
      } finally {
        if (!cancelled) {
          setIsDbLoading(false);
          setIsDbReady(true);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isDbReady || !isSupabaseConfigured() || !hasUserEditedGuests.current) return;

    const timeout = setTimeout(() => {
      void saveGuestSections(guestSections).catch((error) => {
        setErrorMsg(error instanceof Error ? error.message : "Failed to save guest list.");
      });
    }, 600);

    return () => clearTimeout(timeout);
  }, [guestSections, isDbReady]);

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

  const guestReport = useMemo(() => computeGuestReport(guestSections), [guestSections]);

  const markGuestsEdited = () => {
    hasUserEditedGuests.current = true;
  };

  const handleLedgerUpload = async (file: File) => {
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const image = await compressImageForUpload(file);

      const response = await fetch("/api/process-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const data = await parseApiJson<{ sections?: GuestSection[]; error?: string }>(response);
      if (!response.ok) {
        throw new Error(data.error || "Failed to process ledger photo.");
      }

      if (!data.sections?.length) {
        throw new Error("No guests were found in the photo.");
      }

      markGuestsEdited();

      let mergedSections: GuestSection[] = [];
      setGuestSections((prev) => {
        mergedSections = mergeGuestSections(prev, data.sections!);
        return mergedSections;
      });

      if (!selectedGuest && mergedSections[0]?.entries[0]) {
        setSelectedGuest(mergedSections[0].entries[0]);
      }

      if (isSupabaseConfigured()) {
        await saveGuestSections(mergedSections);
      }
      setActiveTab("guests");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to process ledger photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateEntry = (
    sectionIdx: number,
    entryIdx: number,
    updatedFields: Partial<GuestEntry>
  ) => {
    markGuestsEdited();
    let updatedSelectedGuest: GuestEntry | null = null;

    setGuestSections((prev) =>
      prev.map((section, sIdx) => {
        if (sIdx !== sectionIdx) return section;

        return {
          ...section,
          entries: section.entries.map((entry, eIdx) => {
            if (eIdx !== entryIdx) return entry;

            const nextEntry: GuestEntry = {
              ...entry,
              ...updatedFields,
              totalCount:
                (updatedFields.ladiesCount ?? entry.ladiesCount) +
                (updatedFields.gentsCount ?? entry.gentsCount) +
                (updatedFields.kidsCount ?? entry.kidsCount),
            };

            if (selectedGuest?.id === nextEntry.id) {
              updatedSelectedGuest = nextEntry;
            }

            return nextEntry;
          }),
        };
      })
    );

    if (updatedSelectedGuest) {
      setSelectedGuest(updatedSelectedGuest);
    }
  };

  const handleAddEntry = (sectionIdx: number) => {
    markGuestsEdited();
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

  const handleUpdateSection = (sectionIdx: number, sectionName: string) => {
    markGuestsEdited();
    setGuestSections((prev) => {
      const updated = [...prev];
      updated[sectionIdx] = { ...updated[sectionIdx], sectionName };
      return updated;
    });
  };

  const handleAddSection = () => {
    const name = prompt("Enter section name:");
    if (!name) return;
    markGuestsEdited();
    setGuestSections((prev) => [...prev, { sectionName: name, entries: [] }]);
  };

  const handleRemoveSection = (sectionIdx: number) => {
    if (!confirm("Delete this entire section?")) return;
    markGuestsEdited();
    setGuestSections((prev) => {
      const updated = prev.filter((_, idx) => idx !== sectionIdx);
      const stillSelected = updated.some((section) =>
        section.entries.some((entry) => entry.id === selectedGuest?.id)
      );
      if (!stillSelected) {
        setSelectedGuest(updated[0]?.entries[0] ?? null);
      }
      return updated;
    });
  };

  const handleFillAllInvites = () => {
    markGuestsEdited();
    let updatedSelectedGuest: GuestEntry | null = null;

    setGuestSections((prev) => {
      const nextSections = prev.map((section) => ({
        ...section,
        entries: section.entries.map((entry) => ({
          ...entry,
          ...fillInviteCountsFromLedger(entry),
        })),
      }));

      if (selectedGuest) {
        updatedSelectedGuest =
          nextSections.flatMap((section) => section.entries).find((entry) => entry.id === selectedGuest.id) ??
          null;
      }

      return nextSections;
    });

    if (updatedSelectedGuest) {
      setSelectedGuest(updatedSelectedGuest);
    }
  };

  const handleRemoveEntry = (sectionIdx: number, entryIdx: number) => {
    markGuestsEdited();
    setGuestSections((prev) => {
      const updated = [...prev];
      const removedId = updated[sectionIdx].entries[entryIdx]?.id;
      updated[sectionIdx].entries.splice(entryIdx, 1);
      if (removedId === selectedGuest?.id) {
        const nextGuest =
          updated.flatMap((section) => section.entries)[0] ?? null;
        setSelectedGuest(nextGuest);
      }
      return updated;
    });
  };

  const handleInviteSent = (guestId: string) => {
    const sentAt = new Date().toISOString();

    setGuestSections((prev) =>
      prev.map((section) => ({
        ...section,
        entries: section.entries.map((entry) =>
          entry.id === guestId && !entry.inviteSentAt ? { ...entry, inviteSentAt: sentAt } : entry
        ),
      }))
    );

    if (selectedGuest?.id === guestId && !selectedGuest.inviteSentAt) {
      setSelectedGuest({ ...selectedGuest, inviteSentAt: sentAt });
    }

    if (!isSupabaseConfigured()) return;

    void markInviteSent(guestId, sentAt).catch((error) => {
      setErrorMsg(error instanceof Error ? error.message : "Failed to record invite sent.");
    });
  };

  const handleClearRsvps = async () => {
    setRsvpList([]);
    if (!isSupabaseConfigured()) return;
    try {
      await clearRsvps();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Failed to clear RSVPs.");
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-slate-800 flex flex-col safe-bottom">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pt-4 pb-28">
        {activeTab === "home" && (
          <HomeTab
            guestReport={guestReport}
            totalSections={guestSections.length}
            hasCustomTemplate={Boolean(uploadedTemplateImage && isTemplateReady)}
            isProcessing={isProcessing}
            errorMsg={errorMsg}
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
            onUpdateSection={handleUpdateSection}
            onAddEntry={handleAddEntry}
            onAddSection={handleAddSection}
            onRemoveSection={handleRemoveSection}
            onRemoveEntry={handleRemoveEntry}
            onGeneratePass={(entry) => {
              setSelectedGuest(entry);
              setActiveTab("passes");
            }}
            onFillAllInvites={handleFillAllInvites}
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
            onInviteSent={handleInviteSent}
          />
        )}

        {activeTab === "rsvp" && (
          <RsvpTrackerTab rsvpList={rsvpList} onClear={handleClearRsvps} />
        )}

        {isDbLoading && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-2 rounded-full shadow-lg">
            Loading from Supabase...
          </div>
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
