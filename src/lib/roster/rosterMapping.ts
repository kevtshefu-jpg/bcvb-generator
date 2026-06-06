import type {
  FamilyContact,
  Player,
  PlayerGender,
  PlayerStatus,
  RosterImportColumnMapping,
  TeamCategory,
} from "../../types/roster";

export const ROSTER_MAPPING_FIELDS: Array<{
  key: keyof RosterImportColumnMapping;
  label: string;
  required?: boolean;
}> = [
  { key: "firstName", label: "Prénom", required: true },
  { key: "lastName", label: "Nom", required: true },
  { key: "birthDate", label: "Date de naissance" },
  { key: "gender", label: "Sexe" },
  { key: "licenseNumber", label: "Licence" },
  { key: "playerEmail", label: "Email joueur" },
  { key: "playerPhone", label: "Téléphone joueur" },
  { key: "parent1Name", label: "Parent 1" },
  { key: "parent1Email", label: "Email parent 1" },
  { key: "parent1Phone", label: "Téléphone parent 1" },
  { key: "parent2Name", label: "Parent 2" },
  { key: "parent2Email", label: "Email parent 2" },
  { key: "parent2Phone", label: "Téléphone parent 2" },
  { key: "category", label: "Catégorie" },
  { key: "team", label: "Équipe cible" },
  { key: "status", label: "Statut" },
  { key: "notes", label: "Notes" },
];

export function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

function findColumn(columns: string[], candidates: string[]) {
  const normalizedColumns = columns.map((column) => ({
    original: column,
    normalized: normalize(column),
  }));

  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    const found = normalizedColumns.find((column) =>
      column.normalized.includes(normalizedCandidate)
    );
    if (found) return found.original;
  }

  return undefined;
}

export function inferRosterMapping(columns: string[]): RosterImportColumnMapping {
  return {
    firstName: findColumn(columns, ["prenom", "first name", "firstname", "joueur prenom", "joueurprenom"]),
    lastName: findColumn(columns, ["nom", "lastname", "last name", "famille"]),
    birthDate: findColumn(columns, ["naissance", "date naissance", "date de naissance", "birthdate", "birth date"]),
    gender: findColumn(columns, ["sexe", "genre", "gender"]),
    licenseNumber: findColumn(columns, ["licence", "numero licence", "numéro licence", "license"]),
    playerEmail: findColumn(columns, ["email joueur", "mail joueur", "email", "courriel"]),
    playerPhone: findColumn(columns, ["telephone joueur", "téléphone joueur", "portable joueur", "phone joueur"]),
    parent1Name: findColumn(columns, ["parent1", "parent 1", "responsable1", "responsable 1", "mere", "mère"]),
    parent1Email: findColumn(columns, ["email parent1", "email parent 1", "mail parent1", "mail parent 1", "email mere", "mail mere"]),
    parent1Phone: findColumn(columns, ["telephone parent1", "telephone parent 1", "téléphone parent 1", "portable parent1", "tel mere"]),
    parent2Name: findColumn(columns, ["parent2", "parent 2", "responsable2", "responsable 2", "pere", "père"]),
    parent2Email: findColumn(columns, ["email parent2", "email parent 2", "mail parent2", "mail parent 2", "email pere", "mail pere"]),
    parent2Phone: findColumn(columns, ["telephone parent2", "telephone parent 2", "téléphone parent 2", "portable parent2", "tel pere"]),
    category: findColumn(columns, ["categorie", "catégorie", "category"]),
    team: findColumn(columns, ["equipe", "équipe", "team"]),
    status: findColumn(columns, ["statut", "status"]),
    notes: findColumn(columns, ["notes", "commentaire", "commentaires"]),
  };
}

export function mapRosterRow(
  raw: Record<string, string>,
  mapping: RosterImportColumnMapping
): Partial<Player> {
  const get = (key?: string) => (key ? raw[key] || "" : "");

  return {
    firstName: get(mapping.firstName),
    lastName: get(mapping.lastName),
    birthDate: normalizeDate(get(mapping.birthDate)),
    gender: normalizeGender(get(mapping.gender)),
    licenseNumber: get(mapping.licenseNumber),
    email: get(mapping.playerEmail),
    phone: get(mapping.playerPhone),
    status: normalizeStatus(get(mapping.status)),
    category: normalizeCategory(get(mapping.category)),
    notes: get(mapping.notes),
  } as Partial<Player>;
}

export function mapRosterContacts(
  rowId: string,
  raw: Record<string, string>,
  mapping: RosterImportColumnMapping
): Partial<FamilyContact>[] {
  const get = (key?: string) => (key ? raw[key] || "" : "");
  const parent1Name = splitName(get(mapping.parent1Name));
  const parent2Name = splitName(get(mapping.parent2Name));
  const contacts: Partial<FamilyContact>[] = [];

  if (parent1Name.firstName || parent1Name.lastName || get(mapping.parent1Email) || get(mapping.parent1Phone)) {
    contacts.push({
      id: `${rowId}_contact_1`,
      relation: "responsable légal",
      firstName: parent1Name.firstName,
      lastName: parent1Name.lastName,
      email: get(mapping.parent1Email),
      phone: get(mapping.parent1Phone),
      isPrimary: true,
      isParentReferent: false,
    });
  }

  if (parent2Name.firstName || parent2Name.lastName || get(mapping.parent2Email) || get(mapping.parent2Phone)) {
    contacts.push({
      id: `${rowId}_contact_2`,
      relation: "responsable légal",
      firstName: parent2Name.firstName,
      lastName: parent2Name.lastName,
      email: get(mapping.parent2Email),
      phone: get(mapping.parent2Phone),
      isPrimary: contacts.length === 0,
      isParentReferent: false,
    });
  }

  return contacts;
}

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1] || "",
  };
}

function normalizeGender(value: string): PlayerGender {
  const v = normalize(value);
  if (["m", "masculin", "garcon", "homme"].includes(v)) return "M";
  if (["f", "feminin", "fille", "femme"].includes(v)) return "F";
  if (v.includes("mixte")) return "Mixte";
  if (v.includes("autre")) return "Autre";
  return "Non renseigné";
}

function normalizeStatus(value: string): PlayerStatus {
  const v = normalize(value);
  if (v.includes("essai")) return "essai";
  if (v.includes("mutation")) return "mutation";
  if (v.includes("blesse")) return "blessé";
  if (v.includes("attente")) return "en attente";
  if (v.includes("arret")) return "arrêt";
  if (v.includes("archive")) return "archivé";
  return "actif";
}

function normalizeCategory(value: string): TeamCategory | undefined {
  const v = value.toUpperCase().replace(/\s/g, "");
  if (v.includes("U7")) return "U7";
  if (v.includes("U9")) return "U9";
  if (v.includes("U11")) return "U11";
  if (v.includes("U13")) return "U13";
  if (v.includes("U15")) return "U15";
  if (v.includes("U18")) return "U18";
  if (v.includes("U21")) return "U21";
  if (v.includes("LOISIR")) return "Loisir";
  if (v.includes("SECTION")) return "Section sportive";
  if (v.includes("SENIOR") || v.includes("SM") || v.includes("SF")) return "Seniors";
  if (v.includes("GENERAL")) return "Général BCVB";
  return undefined;
}

function normalizeDate(value: string) {
  if (!value) return undefined;
  return value.trim();
}
