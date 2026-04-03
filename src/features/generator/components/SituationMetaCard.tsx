import type { useGeneratorStore } from "../hooks/useGeneratorStore";
import type { CategoryId, PedagogicStep, ThemeId } from "../../../types/referentiel";
import { BCVB_THEMES } from "../data/bcvbThemes";

type Store = ReturnType<typeof useGeneratorStore>;

interface Props {
	store: Store;
}

const CATEGORIES: CategoryId[] = [
	"U7",
	"U9",
	"U11",
	"U13",
	"U15",
	"U18",
	"SENIORS",
];

const ETAPES: { value: PedagogicStep; label: string; hint: string }[] = [
	{
		value: "Je découvre",
		label: "Découvrir",
		hint: "Première exposition au contenu",
	},
	{
		value: "Je m'exerce",
		label: "S'exercer",
		hint: "Stabiliser la compétence par répétition",
	},
	{
		value: "Je retranscris",
		label: "Retranscrire",
		hint: "Réutiliser le contenu dans une forme plus ouverte",
	},
	{
		value: "Je régule",
		label: "Réguler",
		hint: "Ajuster, corriger et renforcer",
	},
];

export function SituationMetaCard({ store }: Props) {
	const { state, updateMeta } = store;

	const selectedTheme = BCVB_THEMES.find((theme) => theme.id === state.meta.themeId);
	const selectedEtape = ETAPES.find((step) => step.value === state.meta.step);

	return (
		<div className="bcvb-panel">
			<div className="bcvb-panel-title">Structure de la situation</div>
			<div className="bcvb-panel-subtitle">
				Définis le cadre pédagogique avant de construire le terrain
			</div>

			<div className="bcvb-form-stack" style={{ marginTop: 14 }}>
				<div className="bcvb-label-block">
					<span>Nom</span>
					<input
						className="bcvb-input"
						value={state.meta.title}
						onChange={(e) => updateMeta({ title: e.target.value })}
						placeholder="Nom de la situation"
					/>
				</div>

				<div className="bcvb-form-grid">
					<div className="bcvb-label-block">
						<span>Catégorie</span>
						<select
							className="bcvb-input"
							value={state.meta.categoryId}
							onChange={(e) => updateMeta({ categoryId: e.target.value as CategoryId })}
						>
							<option value="">— Choisir —</option>
							{CATEGORIES.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>

					<div className="bcvb-label-block">
						<span>Thème</span>
						<select
							className="bcvb-input"
							value={state.meta.themeId}
							onChange={(e) => updateMeta({ themeId: e.target.value as ThemeId })}
						>
							<option value="">— Choisir —</option>
							{BCVB_THEMES.map((theme) => (
								<option key={theme.id} value={theme.id}>
									{theme.label}
								</option>
							))}
						</select>
					</div>
				</div>

				<div className="bcvb-label-block">
					<span>Étape pédagogique</span>
					<select
						className="bcvb-input"
						value={state.meta.step}
						onChange={(e) => updateMeta({ step: e.target.value as PedagogicStep })}
					>
						<option value="">— Choisir —</option>
						{ETAPES.map((step) => (
							<option key={step.value} value={step.value}>
								{step.label}
							</option>
						))}
					</select>
				</div>

				<div className="bcvb-label-block">
					<span>Objectif</span>
					<textarea
						className="bcvb-textarea"
						value={state.meta.objective}
						onChange={(e) => updateMeta({ objective: e.target.value })}
						placeholder="Objectif principal de la situation..."
					/>
				</div>

				<div className="bcvb-form-grid">
					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Thème sélectionné</div>
						<strong>{selectedTheme?.label || "Aucun thème sélectionné"}</strong>
					</div>

					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Étape sélectionnée</div>
						<strong>{selectedEtape?.label || "Aucune étape sélectionnée"}</strong>
					</div>
				</div>

				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Repère pédagogique</div>
					<div>
						{selectedEtape?.hint ||
							"Choisis une étape pour clarifier l’intention pédagogique de la situation."}
					</div>
				</div>
			</div>
		</div>
	);
}
