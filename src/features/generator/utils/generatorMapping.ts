import type { SituationRecord } from "../../../types/referentiel";
import type { GeneratorState } from "../../../types/generator";

export function situationToGeneratorStateSeed(
  situation: SituationRecord
): Partial<GeneratorState> {
  return {
    meta: {
      title: situation.title,
      categoryId: situation.categoryIds[0] ?? "U11",
      themeId: situation.themeIds[0] ?? "jeu-rapide",
      step: situation.pedagogicStep,
      duration: situation.durationMin,
      players: situation.playersMax,
      baskets: situation.courtType === "Plein terrain" ? 2 : 1,
      objective: situation.objective,
      intentions: [...situation.tags.slice(0, 3)],
      coachingPoints: [...situation.coachingPoints],
      material: [...situation.materials],
      setup: situation.setup,
      instructions: situation.instructions,
      successCriteria: situation.successCriteria.join("\n"),
      variables: situation.variables.join("\n")
    }
  };
}
