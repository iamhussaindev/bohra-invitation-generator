export type GuestGender = "ladies" | "gents" | "mixed";

export interface GuestEntry {
  id: string;
  originalText: string;
  cleanedNames: string;
  gender: GuestGender;
  ladiesCount: number;
  gentsCount: number;
  kidsCount: number;
  totalCount: number;
  inviteSentAt?: string | null;
}

export interface GuestSection {
  sectionName: string;
  entries: GuestEntry[];
}

export interface OverlayCoords {
  nameX: number;
  nameY: number;
  inviteesX: number;
  inviteesY: number;
  kidsX: number;
  kidsY: number;
  fontSize: number;
  countFontSize: number;
  fontFamily: string;
}

export interface RsvpRecord {
  id: string;
  name: string;
  status: "Accepted" | "Declined";
  ladies: number;
  gents: number;
  kids: number;
  timestamp: string;
}

export type AppTab = "home" | "guests" | "passes" | "rsvp";

export const DEFAULT_COORDS: OverlayCoords = {
  nameX: 1482,
  nameY: 672,
  inviteesX: 1529,
  inviteesY: 3893,
  kidsX: 2141,
  kidsY: 3898,
  fontSize: 83,
  countFontSize: 90,
  fontFamily: '"Times New Roman", Georgia, serif',
};
