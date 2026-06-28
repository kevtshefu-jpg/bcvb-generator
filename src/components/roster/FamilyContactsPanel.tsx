import type { FamilyContact, RosterPermissionSet } from "../../types/roster";
import { MobileDetailCard, ResponsiveDataList } from "../ui/ResponsiveDataView";

export function FamilyContactsPanel({
  contacts,
  permissions,
}: {
  contacts: FamilyContact[];
  permissions: RosterPermissionSet;
}) {
  const primary = contacts.filter((contact) => contact.isPrimary).length;
  const parentReferents = contacts.filter((contact) => contact.isParentReferent).length;

  return (
    <section className="bcvb-tool-card roster-section">
      <div className="roster-section-header">
        <div>
          <span>Contacts familles</span>
          <h2>Parents, responsables et référents</h2>
        </div>
        <strong>{contacts.length} contacts</strong>
      </div>
      <div className="roster-contact-metrics">
        <span>Principaux <strong>{primary}</strong></span>
        <span>Parents réf. <strong>{parentReferents}</strong></span>
        <span>Visibles <strong>{permissions.canViewSensitiveContacts ? contacts.length : 0}</strong></span>
        <span>Masqués <strong>{permissions.canViewSensitiveContacts ? 0 : contacts.length}</strong></span>
      </div>
      <div className="bcvb-table-scroll responsive-data-table">
        <table className="bcvb-table-premium">
          <thead><tr><th>Relation</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Référent</th></tr></thead>
          <tbody>
            {contacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.relation}</td>
                <td>{contact.firstName} {contact.lastName}</td>
                <td>{permissions.canViewSensitiveContacts ? contact.email || "—" : "Masqué"}</td>
                <td>{permissions.canViewSensitiveContacts ? contact.phone || "—" : "Masqué"}</td>
                <td>{contact.isParentReferent ? "Oui" : "Non"}</td>
              </tr>
            ))}
            {contacts.length === 0 && <tr><td colSpan={5}>Aucun contact famille importé.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList empty={<p>Aucun contact famille importé.</p>}>
          {contacts.map((contact) => (
            <MobileDetailCard
              key={contact.id}
              eyebrow={contact.relation}
              title={`${contact.firstName} ${contact.lastName}`.trim() || "Contact famille"}
              badge={<span className="roster-chip">{contact.isParentReferent ? "Référent" : "Contact"}</span>}
              items={[
                { label: "Email", value: permissions.canViewSensitiveContacts ? contact.email || "—" : "Masqué", full: true },
                { label: "Téléphone", value: permissions.canViewSensitiveContacts ? contact.phone || "—" : "Masqué" },
                { label: "Principal", value: contact.isPrimary ? "Oui" : "Non" },
              ]}
            />
          ))}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
