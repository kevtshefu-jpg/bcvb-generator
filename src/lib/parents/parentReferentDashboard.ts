import {
  parentReferentAvailabilities,
  parentReferentDocuments,
  parentReferentMessageTemplates,
  parentReferentTeamInfos,
} from "../parentReferents/parentReferentMockData";
import { computeParentReferentKpis } from "../parentReferents/parentReferentLogistics";
import { getValidatedParentMessages } from "../parentReferents/parentReferentMessages";

export function buildParentReferentDashboard(teamId = parentReferentTeamInfos[0]?.teamId) {
  const teamInfo = parentReferentTeamInfos.find((team) => team.teamId === teamId) || parentReferentTeamInfos[0];
  const event = teamInfo?.nextEvent;
  const availabilities = parentReferentAvailabilities.filter((item) => item.eventId === event?.id);
  const validatedMessages = getValidatedParentMessages(parentReferentMessageTemplates);

  return {
    teamInfo,
    event,
    availabilities,
    documents: parentReferentDocuments.filter((document) => !document.teamId || document.teamId === teamInfo?.teamId),
    messages: parentReferentMessageTemplates,
    kpis: computeParentReferentKpis(event, availabilities, parentReferentDocuments.length, validatedMessages.length),
  };
}
