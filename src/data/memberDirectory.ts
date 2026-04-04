export type MemberRole = "admin" | "coach" | "dirigeant" | "membre";

export type MemberRecord = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: MemberRole;
  team?: string;
  initials: string;
};

export const memberDirectory: MemberRecord[] = [
  {
    id: "kevin-tshefu",
    email: "kevin@bcvb.local",
    password: "BCVB2026!",
    fullName: "Kevin Tshefu",
    role: "admin",
    team: "Responsable technique · SF1 · U15M R2",
    initials: "KT"
  },
  {
    id: "coach-bcvb",
    email: "coach@bcvb.local",
    password: "CoachBCVB!",
    fullName: "Coach BCVB",
    role: "coach",
    team: "Pôle formation",
    initials: "CB"
  },
  {
    id: "dirigeant-bcvb",
    email: "dirigeant@bcvb.local",
    password: "DirigeantBCVB!",
    fullName: "Dirigeant BCVB",
    role: "dirigeant",
    team: "Comité sportif",
    initials: "DB"
  }
];

export function sanitizeEmail(email: string) {
  return email.trim().toLowerCase();
}
