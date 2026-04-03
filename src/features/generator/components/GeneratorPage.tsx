import { useEffect, useMemo, useState } from "react";
import { useGeneratorStore } from "../hooks/useGeneratorStore";
import { LeftPanel } from "./LeftPanel";
import { CourtCanvas } from "./CourtCanvas";
import { RightPanel } from "./RightPanel";
import { TopBar } from "./TopBar";
import { toSessionText } from "../utils/exportText";

const DRAFT_KEY = "bcvb.generator.draft.v1";

type SaveStatus = "idle" | "saved" | "loaded" | "error";

function slugify(value: string) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function GeneratorPage() {
	const store = useGeneratorStore();

	const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
	const [lastSavedAt, setLastSavedAt] = useState<string>("");

	const pageTitle = useMemo(() => {
		return store.state.meta.title?.trim() || "Nouvelle situation";
	}, [store.state.meta.title]);

	const exportFileName = useMemo(() => {
		return slugify(pageTitle) || "situation-bcvb";
	}, [pageTitle]);

	const summaryStats = useMemo(() => {
		return {
			nodes: store.state.nodes.length,
			actions: store.state.actions.length,
			format: store.state.meta.baskets === 2 ? "Plein terrain" : "Demi-terrain",
			duration: store.state.meta.duration || 0,
			players: store.state.meta.players || 0,
		};
	}, [
		store.state.nodes.length,
		store.state.actions.length,
		store.state.meta.baskets,
		store.state.meta.duration,
		store.state.meta.players,
	]);

	function updateSavedTime() {
		const now = new Date().toLocaleTimeString("fr-FR", {
			hour: "2-digit",
			minute: "2-digit",
		});
		setLastSavedAt(now);
	}

	function handleSave() {
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify(store.state));
			updateSavedTime();
			setSaveStatus("saved");
		} catch (e) {
			console.error("Erreur sauvegarde draft", e);
			setSaveStatus("error");
		}
	}

	function handleLoad() {
		const raw = localStorage.getItem(DRAFT_KEY);
		if (!raw) return;

		try {
			const parsed = JSON.parse(raw) as typeof store.state;

			if (parsed?.meta) {
				store.replaceStatePartial({
					selectedTool: parsed.selectedTool ?? store.state.selectedTool,
					selectedNodeId: parsed.selectedNodeId ?? null,
					selectedActionId: parsed.selectedActionId ?? null,
					meta: {
						...store.state.meta,
						...parsed.meta,
					},
					nodes: parsed.nodes ?? store.state.nodes,
					actions: parsed.actions ?? store.state.actions,
				});

				setSaveStatus("loaded");
			}
		} catch (e) {
			console.error("Erreur chargement draft", e);
			setSaveStatus("error");
		}
	}

	function handleExportText() {
		try {
			const text = toSessionText(store.state);
			const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");

			a.href = url;
			a.download = `${exportFileName}.txt`;
			a.click();

			URL.revokeObjectURL(url);
		} catch (e) {
			console.error("Erreur export texte", e);
			setSaveStatus("error");
		}
	}

	function handlePrintSheet() {
		window.print();
	}

	useEffect(() => {
		document.title = `${pageTitle} · BCVB`;
	}, [pageTitle]);

	const statusLabel =
		saveStatus === "saved"
			? `État sauvegardé${lastSavedAt ? ` à ${lastSavedAt}` : ""}`
			: saveStatus === "loaded"
			? "État chargé"
			: saveStatus === "error"
			? "Une erreur est survenue"
			: "Prêt à construire";

	return (
		<div className="bcvb-site-main bcvb-site-main--premium">
			<div className="bcvb-page-shell">
				<TopBar
					title={pageTitle}
					onSave={handleSave}
					onLoad={handleLoad}
					onExportText={handleExportText}
					onPrintSheet={handlePrintSheet}
				/>

				<section className="bcvb-page-banner">
					<div className="bcvb-page-banner__main">
						<div className="bcvb-page-banner__eyebrow">BCVB · Smart Coach Builder</div>
						<h2 className="bcvb-page-banner__title">
							Construis une situation lisible, coachable et exploitable immédiatement
						</h2>
						<p className="bcvb-page-banner__text">
							Pose la structure, place les joueurs, relie les actions, puis transforme
							le diagramme en une fiche claire pour le terrain.
						</p>
					</div>

					<div className="bcvb-page-banner__side">
						<div className="bcvb-status-card">
							<div className="bcvb-status-card__label">Statut</div>
							<div className={`bcvb-status-card__value is-${saveStatus}`}>{statusLabel}</div>
						</div>

						<div className="bcvb-page-banner__chips">
							<span className="bcvb-info-chip">Lecture rapide</span>
							<span className="bcvb-info-chip">Diagramme FIBA</span>
							<span className="bcvb-info-chip">Vue coach</span>
							<span className="bcvb-info-chip">Export texte</span>
						</div>
					</div>
				</section>

				<section className="bcvb-overview-strip">
					<div className="bcvb-overview-card">
						<div className="bcvb-overview-card__label">Format</div>
						<div className="bcvb-overview-card__value">{summaryStats.format}</div>
					</div>

					<div className="bcvb-overview-card">
						<div className="bcvb-overview-card__label">Durée</div>
						<div className="bcvb-overview-card__value">
							{summaryStats.duration ? `${summaryStats.duration} min` : "—"}
						</div>
					</div>

					<div className="bcvb-overview-card">
						<div className="bcvb-overview-card__label">Joueurs</div>
						<div className="bcvb-overview-card__value">
							{summaryStats.players || "—"}
						</div>
					</div>

					<div className="bcvb-overview-card">
						<div className="bcvb-overview-card__label">Éléments</div>
						<div className="bcvb-overview-card__value">{summaryStats.nodes}</div>
					</div>

					<div className="bcvb-overview-card">
						<div className="bcvb-overview-card__label">Actions</div>
						<div className="bcvb-overview-card__value">{summaryStats.actions}</div>
					</div>
				</section>

				<section className="bcvb-builder-grid v18">
					<div className="bcvb-col-params">
						<LeftPanel store={store} />
					</div>

					<div className="bcvb-col-court">
						<CourtCanvas
							state={store.state}
							onAddNode={store.addNode}
							onMoveNode={store.moveNode}
							onSelectNode={store.selectNode}
							onSelectAction={store.selectAction}
							onNodeAction={store.startOrCompleteActionFromNode}
						/>
					</div>

					<div className="bcvb-col-seance">
						<RightPanel store={store} />
					</div>
				</section>

				<section className="bcvb-page-footer-note">
					<div className="bcvb-page-footer-note__title">Méthode conseillée</div>
					<div className="bcvb-page-footer-note__text">
						1. Définir le cadre de la situation. 2. Régler les repères rapides.
						3. Poser les joueurs et les éléments terrain. 4. Tracer les actions.
						5. Compléter la lecture coach et les points de coaching. 6. Exporter.
					</div>
				</section>
			</div>
		</div>
	);
}
