import type { ParentReferentDocument, ParentReferentMessageTemplate } from "../../types/parentReferent";

export function filterParentReferentDocuments(
  documents: ParentReferentDocument[],
  filters: { category?: string; teamId?: string; season?: string; type?: string; audience?: string }
) {
  return documents.filter((document) => {
    const matchCategory = !filters.category || filters.category === "all" || document.category === filters.category;
    const matchTeam = !filters.teamId || filters.teamId === "all" || !document.teamId || document.teamId === filters.teamId;
    const matchSeason = !filters.season || filters.season === "all" || document.season === filters.season;
    const matchType = !filters.type || filters.type === "all" || document.type === filters.type;
    const matchAudience = !filters.audience || filters.audience === "all" || document.audience === filters.audience;
    return matchCategory && matchTeam && matchSeason && matchType && matchAudience && ["published", "club_validated"].includes(document.status);
  });
}

export function getValidatedParentMessages(messages: ParentReferentMessageTemplate[]) {
  return messages.filter((message) => ["validated_by_coach", "coach_validated", "club_validated"].includes(message.status));
}

export function buildMessageCopyPayload(message: ParentReferentMessageTemplate) {
  return `${message.title}\n\n${message.body}\n\nMessage validé coach - BCVB`;
}
