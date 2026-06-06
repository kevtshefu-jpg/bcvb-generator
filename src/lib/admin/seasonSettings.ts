import type { SeasonConfig } from "../../types/admin";

export const defaultSeasons: SeasonConfig[] = [
  {
    id: "season-2025-2026",
    label: "Saison 2025-2026",
    startDate: "2025-08-01",
    endDate: "2026-07-31",
    active: true,
    archived: false,
  },
  {
    id: "season-2024-2025",
    label: "Saison 2024-2025",
    startDate: "2024-08-01",
    endDate: "2025-07-31",
    active: false,
    archived: true,
  },
];

export function setActiveSeason(seasons: SeasonConfig[], seasonId: string) {
  return seasons.map((season) => ({
    ...season,
    active: season.id === seasonId,
    archived: season.id === seasonId ? false : season.archived,
  }));
}

export function archiveSeason(seasons: SeasonConfig[], seasonId: string) {
  return seasons.map((season) => ({
    ...season,
    active: season.id === seasonId ? false : season.active,
    archived: season.id === seasonId ? true : season.archived,
  }));
}

export function createNextSeason(seasons: SeasonConfig[]): SeasonConfig[] {
  const currentActive = seasons.find((season) => season.active) ?? seasons[0];
  const startYear = currentActive ? Number(currentActive.endDate.slice(0, 4)) : new Date().getFullYear();
  const endYear = startYear + 1;
  const seasonId = `season-${startYear}-${endYear}`;

  if (seasons.some((season) => season.id === seasonId)) return seasons;

  return [
    {
      id: seasonId,
      label: `Saison ${startYear}-${endYear}`,
      startDate: `${startYear}-08-01`,
      endDate: `${endYear}-07-31`,
      active: false,
      archived: false,
    },
    ...seasons,
  ];
}
