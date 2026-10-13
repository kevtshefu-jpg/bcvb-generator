import type { SeasonConfig } from "../../types/admin";

// August–July is the club's existing season boundary. This only supplies
// defaults for a new local configuration; saved administrator choices win.
export function buildDefaultSeasons(today: Date = new Date()): SeasonConfig[] {
  const year = today.getMonth() >= 7 ? today.getFullYear() : today.getFullYear() - 1;
  const years = [...new Set([year, year - 1, 2024])].filter((value) => value <= year);

  return years.map((startYear) => ({
    id: `season-${startYear}-${startYear + 1}`,
    label: `Saison ${startYear}-${startYear + 1}`,
    startDate: `${startYear}-08-01`,
    endDate: `${startYear + 1}-07-31`,
    active: startYear === year,
    archived: startYear < year,
  }));
}

export const defaultSeasons: SeasonConfig[] = buildDefaultSeasons();

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
