import type { TutorialItem, TutorialProgressState } from "../../types/tutorials";

const STORAGE_KEY = "bcvb:tutorial-progress";

export const emptyTutorialProgress: TutorialProgressState = {
  completedSteps: {},
  completedChecklistItems: {},
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

export function getTutorialProgress(): TutorialProgressState {
  if (!canUseStorage()) return emptyTutorialProgress;

  try {
    const rawProgress = window.localStorage.getItem(STORAGE_KEY);
    if (!rawProgress) return emptyTutorialProgress;
    const parsed = JSON.parse(rawProgress) as Partial<TutorialProgressState>;

    return {
      completedSteps: parsed.completedSteps ?? {},
      completedChecklistItems: parsed.completedChecklistItems ?? {},
    };
  } catch (error) {
    console.warn("Progression tutoriels illisible :", error);
    return emptyTutorialProgress;
  }
}

export function saveTutorialProgress(progress: TutorialProgressState) {
  if (!canUseStorage()) return progress;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function setTutorialStepDone(
  progress: TutorialProgressState,
  tutorialId: string,
  stepId: string,
  done: boolean
) {
  const current = progress.completedSteps[tutorialId] ?? [];
  const nextSteps = done
    ? uniqueValues([...current, stepId])
    : current.filter((id) => id !== stepId);

  return saveTutorialProgress({
    ...progress,
    completedSteps: {
      ...progress.completedSteps,
      [tutorialId]: nextSteps,
    },
  });
}

export function setTutorialChecklistItemDone(
  progress: TutorialProgressState,
  tutorialId: string,
  item: string,
  done: boolean
) {
  const current = progress.completedChecklistItems[tutorialId] ?? [];
  const nextItems = done
    ? uniqueValues([...current, item])
    : current.filter((label) => label !== item);

  return saveTutorialProgress({
    ...progress,
    completedChecklistItems: {
      ...progress.completedChecklistItems,
      [tutorialId]: nextItems,
    },
  });
}

export function computeTutorialCompletion(tutorial: TutorialItem, progress: TutorialProgressState) {
  const completedSteps = progress.completedSteps[tutorial.id] ?? [];
  const completedItems = progress.completedChecklistItems[tutorial.id] ?? [];
  const total = tutorial.steps.length + tutorial.checklist.length;

  if (total === 0) return 0;

  return Math.round(((completedSteps.length + completedItems.length) / total) * 100);
}
