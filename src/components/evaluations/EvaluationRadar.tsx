import type { EvaluationDomain } from "../../types/evaluations";
import { bcvbRadarDomains, evaluationDomainLabels } from "../../lib/evaluations/evaluationTemplates";

const radarDomains: EvaluationDomain[] = bcvbRadarDomains;

function pointFor(index: number, value: number, radius: number, cx: number, cy: number) {
  const angle = (Math.PI * 2 * index) / radarDomains.length - Math.PI / 2;
  const scaledRadius = radius * (Math.max(0, Math.min(value, 5)) / 5);
  return {
    x: cx + Math.cos(angle) * scaledRadius,
    y: cy + Math.sin(angle) * scaledRadius,
  };
}

export function EvaluationRadar({
  domainScores,
  title = "Profil radar joueur",
}: {
  domainScores: Record<EvaluationDomain, number>;
  title?: string;
}) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 92;
  const points = radarDomains.map((domain, index) => pointFor(index, domainScores[domain] || 0, radius, cx, cy));
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <figure className="evaluation-radar">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title}>
        {[1, 2, 3, 4, 5].map((level) => {
          const ring = radarDomains.map((_, index) => pointFor(index, level, radius, cx, cy));
          return <polygon key={level} points={ring.map((point) => `${point.x},${point.y}`).join(" ")} className="evaluation-radar-grid" />;
        })}
        {radarDomains.map((domain, index) => {
          const edge = pointFor(index, 5, radius, cx, cy);
          const label = pointFor(index, 5.9, radius, cx, cy);
          return (
            <g key={domain}>
              <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} className="evaluation-radar-axis" />
              <text x={label.x} y={label.y} textAnchor="middle">{evaluationDomainLabels[domain]}</text>
            </g>
          );
        })}
        <polygon points={polygon} className="evaluation-radar-area" />
        <polyline points={`${polygon} ${points[0]?.x},${points[0]?.y}`} className="evaluation-radar-line" />
        {points.map((point, index) => <circle key={radarDomains[index]} cx={point.x} cy={point.y} r="4" className="evaluation-radar-dot" />)}
      </svg>
    </figure>
  );
}
