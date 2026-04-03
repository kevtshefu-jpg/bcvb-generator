export interface FormState {
	title: string;
	category: string;
	theme: string;
	duration: string;
	objective: string;
	instructions: string;
	coachingPoints: string;
	variables: string;
	successCriteria: string;
}

type Props = FormState & {
	onChange: (patch: Partial<FormState>) => void;
};

export function SessionFormBCVB({
	title,
	category,
	theme,
	duration,
	objective,
	instructions,
	coachingPoints,
	variables,
	successCriteria,
	onChange,
}: Props) {
	return (
		<div className="bcvb-panel">
			<div className="bcvb-panel-title">Paramètres séance</div>
			<div className="bcvb-panel-subtitle">
				Version compacte du formulaire historique pour structurer rapidement la fiche.
			</div>
			<div className="bcvb-form-stack" style={{ marginTop: 14 }}>
				<label className="bcvb-label-block">
					<span>Titre</span>
					<input
						className="bcvb-input"
						value={title}
						onChange={(event) => onChange({ title: event.target.value })}
						placeholder="Ex. 1c1 à 45° après passe"
					/>
				</label>
				<div className="bcvb-form-grid">
					<label className="bcvb-label-block">
						<span>Catégorie</span>
						<input className="bcvb-input" value={category} onChange={(event) => onChange({ category: event.target.value })} placeholder="U11, U13, U15..." />
					</label>
					<label className="bcvb-label-block">
						<span>Thème</span>
						<input className="bcvb-input" value={theme} onChange={(event) => onChange({ theme: event.target.value })} placeholder="Lecture / avantage, tir, transition..." />
					</label>
				</div>
				<label className="bcvb-label-block">
					<span>Durée</span>
					<input className="bcvb-input" value={duration} onChange={(event) => onChange({ duration: event.target.value })} placeholder="12 min" />
				</label>
				<label className="bcvb-label-block">
					<span>Objectif</span>
					<textarea className="bcvb-textarea" value={objective} onChange={(event) => onChange({ objective: event.target.value })} placeholder="Créer un avantage rapide puis finir fort." />
				</label>
				<label className="bcvb-label-block">
					<span>Consignes</span>
					<textarea className="bcvb-textarea" value={instructions} onChange={(event) => onChange({ instructions: event.target.value })} placeholder="Une consigne par ligne." />
				</label>
				<label className="bcvb-label-block">
					<span>Points de coaching</span>
					<textarea className="bcvb-textarea" value={coachingPoints} onChange={(event) => onChange({ coachingPoints: event.target.value })} placeholder="Repères coach à faire ressortir." />
				</label>
				<label className="bcvb-label-block">
					<span>Variables</span>
					<textarea className="bcvb-textarea" value={variables} onChange={(event) => onChange({ variables: event.target.value })} placeholder="Contraintes, évolutions, bonus..." />
				</label>
				<label className="bcvb-label-block">
					<span>Critères de réussite</span>
					<textarea className="bcvb-textarea" value={successCriteria} onChange={(event) => onChange({ successCriteria: event.target.value })} placeholder="Indices observables de réussite." />
				</label>

				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Lecture rapide</div>
					<div>
						{category || "Catégorie à préciser"} · {theme || "Thème à préciser"} · {duration || "Durée libre"}
					</div>
				</div>
			</div>
		</div>
	);
}
