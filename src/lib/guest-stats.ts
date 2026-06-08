import type { GuestSection } from "@/lib/types";

export interface GuestReport {
  totalFamilies: number;
  totalLadies: number;
  totalGents: number;
  totalKids: number;
  invitesSentFamilies: number;
}

export function computeGuestReport(sections: GuestSection[]): GuestReport {
  const entries = sections.flatMap((section) => section.entries);

  return {
    totalFamilies: entries.length,
    totalLadies: entries.reduce((sum, entry) => sum + entry.ladiesCount, 0),
    totalGents: entries.reduce((sum, entry) => sum + entry.gentsCount, 0),
    totalKids: entries.reduce((sum, entry) => sum + entry.kidsCount, 0),
    invitesSentFamilies: entries.filter((entry) => entry.inviteSentAt).length,
  };
}
