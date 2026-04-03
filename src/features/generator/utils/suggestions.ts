import { categories } from "../../../data/categories";
import { themes } from "../../../data/themes";
import type { CategoryId, ThemeId } from "../../../types/referentiel";

type SuggestionSet = {
	objectiveSuggestions: string[];
	intentionSuggestions: string[];
	coachingSuggestions: string[];
};

export function getSuggestions(categoryId: CategoryId, themeId: ThemeId): SuggestionSet {
	const category = categories.find((c) => c.id === categoryId);
	const theme = themes.find((t) => t.id === themeId);

	return {
		objectiveSuggestions: [
			...(category?.offensiveTargets ?? []).slice(0, 2),
			...(theme?.pillars ?? []).slice(0, 2)
		],
		intentionSuggestions: [
			...(category?.priorities ?? []).slice(0, 2),
			...(theme?.pillars ?? []).slice(0, 2)
		],
		coachingSuggestions: [
			...(category?.coachingPoints ?? []).slice(0, 2),
			...(theme?.coachingFocus ?? []).slice(0, 2)
		]
	};
}
