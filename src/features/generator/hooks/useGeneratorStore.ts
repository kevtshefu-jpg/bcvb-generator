import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { STORAGE_KEYS } from "../../../data/storageKeys";
import { situations } from "../../../data/situations";
import type {
  ActionKind,
  GeneratorState,
  NodeKind,
  Position,
  ToolType
} from "../../../types/generator";
import { situationToGeneratorStateSeed } from "../utils/generatorMapping";

const INITIAL_STATE: GeneratorState = {
  selectedTool: "select",
  selectedNodeId: null,
  selectedActionId: null,
  meta: {
    title: "",
    categoryId: "U11",
    themeId: "jeu-rapide",
    step: "Je découvre",
    duration: 12,
    players: 10,
    baskets: 1,
    objective: "",
    intentions: [],
    coachingPoints: [],
    material: [],
    setup: "",
    instructions: "",
    successCriteria: "",
    variables: ""
  },
  nodes: [],
  actions: []
};

const ACTION_TOOLS: ActionKind[] = ["move", "pass", "dribble", "screen", "shot"];

function buildId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useGeneratorStore() {
  const [state, setState] = useState<GeneratorState>(INITIAL_STATE);
  const [pendingActionStartNodeId, setPendingActionStartNodeId] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const situationId = searchParams.get("situationId");
    if (!situationId) return;

    const sourceSituation = situations.find((item) => item.id === situationId);
    if (!sourceSituation) return;

    const patch = situationToGeneratorStateSeed(sourceSituation);

    setState((prev) => ({
      ...prev,
      ...patch,
      meta: patch.meta ? { ...prev.meta, ...patch.meta } : prev.meta
    }));
  }, [searchParams]);

  function setTool(tool: ToolType) {
    setPendingActionStartNodeId(null);
    setState((prev) => ({ ...prev, selectedTool: tool }));
  }

  function updateMeta(patch: Partial<GeneratorState["meta"]>) {
    setState((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        ...patch
      }
    }));
  }

  function addNode(kind: NodeKind, position: Position) {
    setState((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id: buildId("node"), kind, position }]
    }));
  }

  function moveNode(nodeId: string, position: Position) {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
    }));
  }

  function selectNode(nodeId: string | null) {
    setState((prev) => ({ ...prev, selectedNodeId: nodeId }));
  }

  function selectAction(actionId: string | null) {
    setState((prev) => ({ ...prev, selectedActionId: actionId }));
  }

  function startOrCompleteActionFromNode(nodeId: string) {
    setState((prev) => {
      const tool = prev.selectedTool;
      if (!ACTION_TOOLS.includes(tool as ActionKind)) {
        setPendingActionStartNodeId(null);
        return { ...prev, selectedNodeId: nodeId };
      }

      if (!pendingActionStartNodeId) {
        setPendingActionStartNodeId(nodeId);
        return { ...prev, selectedNodeId: nodeId };
      }

      const nextAction = {
        id: buildId("action"),
        kind: tool as ActionKind,
        fromNodeId: pendingActionStartNodeId,
        toNodeId: nodeId
      };

      setPendingActionStartNodeId(null);

      return {
        ...prev,
        actions: [...prev.actions, nextAction],
        selectedNodeId: null,
        selectedActionId: nextAction.id
      };
    });
  }

  function deleteSelected() {
    setState((prev) => {
      if (prev.selectedActionId) {
        return {
          ...prev,
          actions: prev.actions.filter((action) => action.id !== prev.selectedActionId),
          selectedActionId: null
        };
      }

      if (prev.selectedNodeId) {
        return {
          ...prev,
          nodes: prev.nodes.filter((node) => node.id !== prev.selectedNodeId),
          actions: prev.actions.filter(
            (action) =>
              action.fromNodeId !== prev.selectedNodeId && action.toNodeId !== prev.selectedNodeId
          ),
          selectedNodeId: null
        };
      }

      return prev;
    });
  }

  function clearAll() {
    setState((prev) => ({
      ...prev,
      nodes: [],
      actions: [],
      selectedNodeId: null,
      selectedActionId: null
    }));
  }

  function replaceStatePartial(patch: Partial<GeneratorState>) {
    setState((prev) => ({
      ...prev,
      ...patch,
      meta: {
        ...prev.meta,
        ...(patch.meta ?? {})
      }
    }));
  }

  function saveToLocal() {
    localStorage.setItem(STORAGE_KEYS.GENERATOR_STATE, JSON.stringify(state));
  }

  function loadFromLocal() {
    const raw = localStorage.getItem(STORAGE_KEYS.GENERATOR_STATE);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<GeneratorState>;
      replaceStatePartial(parsed);
    } catch {
      // Ignore malformed local data.
    }
  }

  return {
    state,
    setTool,
    updateMeta,
    addNode,
    moveNode,
    selectNode,
    selectAction,
    startOrCompleteActionFromNode,
    deleteSelected,
    clearAll,
    replaceStatePartial,
    saveToLocal,
    loadFromLocal
  };
}
