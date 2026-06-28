import { useState } from "react";
import type { LogisticsStatus, PlayerLogisticsAvailability, TeamLogisticsEvent } from "../../types/parentReferent";
import { getLogisticsStatusLabel, sanitizeParentReferentNote } from "../../lib/parentReferents/parentReferentLogistics";
import { MobileDetailCard, ResponsiveDataList } from "../ui/ResponsiveDataView";

const statusOptions: LogisticsStatus[] = ["present", "absent", "to_confirm", "not_filled"];

export function ParentReferentAvailabilityPanel({
  initialAvailabilities,
  event,
  canManage,
}: {
  initialAvailabilities: PlayerLogisticsAvailability[];
  event?: TeamLogisticsEvent;
  canManage: boolean;
}) {
  const [availabilities, setAvailabilities] = useState(initialAvailabilities);
  const [copied, setCopied] = useState(false);
  const [coachNotified, setCoachNotified] = useState(false);

  function updateAvailability(id: string, patch: Partial<PlayerLogisticsAvailability>) {
    if (!canManage) return;
    setAvailabilities((current) => current.map((item) => item.id === id ? {
      ...item,
      ...patch,
      note: patch.note ? sanitizeParentReferentNote(patch.note) : patch.note ?? item.note,
      updatedAt: new Date().toISOString(),
    } : item));
  }

  function buildWhatsAppSummary() {
    const available = availabilities.filter((item) => item.status === "present").length;
    const toConfirm = availabilities.filter((item) => item.status === "to_confirm" || item.status === "not_filled").length;
    const transportNeeded = availabilities.filter((item) => item.transportNeeded).length;
    const seats = availabilities.reduce((sum, item) => sum + (item.availableSeats || 0), 0);
    const tableNames = availabilities.filter((item) => item.tableHelp).map((item) => item.playerName).join(", ") || "à compléter";
    const snackNames = availabilities.filter((item) => item.snackContribution).map((item) => item.playerName).join(", ") || "à compléter";

    return [
      "Bonjour à tous,",
      `Petit point organisation pour ${event?.title || "le prochain événement"} du ${event?.date ? new Date(event.date).toLocaleDateString("fr-FR") : "à confirmer"}.`,
      `RDV : ${event?.meetingTime || "à confirmer"} à ${event?.location || "lieu à confirmer"}.`,
      `Disponibles : ${available}.`,
      `À confirmer : ${toConfirm}.`,
      `Transport nécessaire : ${transportNeeded}.`,
      `Places proposées : ${seats}.`,
      `Aide table : ${tableNames}.`,
      `Goûter : ${snackNames}.`,
      "Merci de confirmer rapidement si besoin.",
    ].join("\n");
  }

  async function copyWhatsAppSummary() {
    await navigator.clipboard.writeText(buildWhatsAppSummary());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function exportLogisticsSheet() {
    const rows = [
      "joueur;statut;transport;voiture;places;accompagnateur;maillots;gouter;table;remarque",
      ...availabilities.map((item) => [
        item.playerName,
        getLogisticsStatusLabel(item.status),
        item.transportNeeded ? "oui" : "non",
        item.carAvailable ? "oui" : "non",
        item.availableSeats || 0,
        item.accompanyingParent || "",
        item.jerseyWash ? "oui" : "non",
        item.snackContribution ? "oui" : "non",
        item.tableHelp ? "oui" : "non",
        item.note || "",
      ].join(";")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `feuille-logistique-${event?.id || "match"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="parent-referent-section">
      <div className="parent-referent-section__title">
        <span>Présences logistiques</span>
        <h2>Disponibilités et aide week-end</h2>
      </div>

      <div className="parent-referent-action-row">
        <button type="button" onClick={copyWhatsAppSummary}>{copied ? "Résumé copié" : "Copier résumé WhatsApp"}</button>
        <button type="button" onClick={exportLogisticsSheet}>Exporter feuille logistique</button>
        <button type="button" onClick={() => setCoachNotified(true)}>{coachNotified ? "Coach informé" : "Signaler au coach"}</button>
        <button type="button" onClick={() => setAvailabilities(initialAvailabilities)}>Réinitialiser filtres</button>
      </div>

      <div className="parent-referent-table-wrap responsive-data-table">
        <table className="parent-referent-availability-table">
          <thead>
            <tr>
              <th>Joueur</th>
              <th>Statut</th>
              <th>Transport</th>
              <th>Voiture</th>
              <th>Places</th>
              <th>Accompagnateur</th>
              <th>Maillots</th>
              <th>Goûter</th>
              <th>Table</th>
              <th>Remarque</th>
            </tr>
          </thead>
          <tbody>
            {availabilities.map((availability) => (
              <tr key={availability.id}>
                <td>{availability.playerName}</td>
                <td>
                  {availability.status === "unavailable" ? (
                    <span className="parent-referent-status-badge parent-referent-status-badge--unavailable">Non disponible</span>
                  ) : (
                    <select
                      disabled={!canManage}
                      value={availability.status}
                      onChange={(event) => updateAvailability(availability.id, { status: event.target.value as LogisticsStatus })}
                    >
                      {statusOptions.map((status) => <option key={status} value={status}>{getLogisticsStatusLabel(status)}</option>)}
                    </select>
                  )}
                </td>
                <td><input type="checkbox" disabled={!canManage} checked={Boolean(availability.transportNeeded)} onChange={(event) => updateAvailability(availability.id, { transportNeeded: event.target.checked })} /></td>
                <td><input type="checkbox" disabled={!canManage} checked={Boolean(availability.carAvailable)} onChange={(event) => updateAvailability(availability.id, { carAvailable: event.target.checked })} /></td>
                <td><input type="number" min={0} max={8} disabled={!canManage} value={availability.availableSeats || 0} onChange={(event) => updateAvailability(availability.id, { availableSeats: Number(event.target.value) })} /></td>
                <td><input disabled={!canManage} value={availability.accompanyingParent || ""} onChange={(event) => updateAvailability(availability.id, { accompanyingParent: event.target.value })} /></td>
                <td><input type="checkbox" disabled={!canManage} checked={Boolean(availability.jerseyWash)} onChange={(event) => updateAvailability(availability.id, { jerseyWash: event.target.checked })} /></td>
                <td><input type="checkbox" disabled={!canManage} checked={Boolean(availability.snackContribution)} onChange={(event) => updateAvailability(availability.id, { snackContribution: event.target.checked })} /></td>
                <td><input type="checkbox" disabled={!canManage} checked={Boolean(availability.tableHelp)} onChange={(event) => updateAvailability(availability.id, { tableHelp: event.target.checked })} /></td>
                <td><input disabled={!canManage} value={availability.note || ""} onChange={(event) => updateAvailability(availability.id, { note: event.target.value })} placeholder="Remarque courte" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList empty={<p>Aucune disponibilité logistique à afficher.</p>}>
          {availabilities.map((availability) => (
            <MobileDetailCard
              key={availability.id}
              eyebrow="Logistique"
              title={availability.playerName}
              badge={<span className="bcvb-status-pill">{getLogisticsStatusLabel(availability.status)}</span>}
              items={[
                {
                  label: "Statut",
                  value: availability.status === "unavailable" ? (
                    <span className="parent-referent-status-badge parent-referent-status-badge--unavailable">Non disponible</span>
                  ) : (
                    <select
                      disabled={!canManage}
                      value={availability.status}
                      onChange={(event) => updateAvailability(availability.id, { status: event.target.value as LogisticsStatus })}
                    >
                      {statusOptions.map((status) => <option key={status} value={status}>{getLogisticsStatusLabel(status)}</option>)}
                    </select>
                  ),
                  full: true,
                },
                { label: "Transport", value: <input type="checkbox" disabled={!canManage} checked={Boolean(availability.transportNeeded)} onChange={(event) => updateAvailability(availability.id, { transportNeeded: event.target.checked })} /> },
                { label: "Voiture", value: <input type="checkbox" disabled={!canManage} checked={Boolean(availability.carAvailable)} onChange={(event) => updateAvailability(availability.id, { carAvailable: event.target.checked })} /> },
                { label: "Places", value: <input type="number" min={0} max={8} disabled={!canManage} value={availability.availableSeats || 0} onChange={(event) => updateAvailability(availability.id, { availableSeats: Number(event.target.value) })} /> },
                { label: "Maillots", value: <input type="checkbox" disabled={!canManage} checked={Boolean(availability.jerseyWash)} onChange={(event) => updateAvailability(availability.id, { jerseyWash: event.target.checked })} /> },
                { label: "Goûter", value: <input type="checkbox" disabled={!canManage} checked={Boolean(availability.snackContribution)} onChange={(event) => updateAvailability(availability.id, { snackContribution: event.target.checked })} /> },
                { label: "Table", value: <input type="checkbox" disabled={!canManage} checked={Boolean(availability.tableHelp)} onChange={(event) => updateAvailability(availability.id, { tableHelp: event.target.checked })} /> },
                { label: "Accompagnateur", value: <input disabled={!canManage} value={availability.accompanyingParent || ""} onChange={(event) => updateAvailability(availability.id, { accompanyingParent: event.target.value })} />, full: true },
                { label: "Remarque", value: <input disabled={!canManage} value={availability.note || ""} onChange={(event) => updateAvailability(availability.id, { note: event.target.value })} placeholder="Remarque courte" />, full: true },
              ]}
            />
          ))}
        </ResponsiveDataList>
      </div>
      <p className="parent-referent-muted">Les informations médicales ne peuvent pas être créées ici. Un statut indisponible vient du coach ou de l’admin.</p>
    </section>
  );
}
