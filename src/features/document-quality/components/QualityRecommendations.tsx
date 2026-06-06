import type { QualityScore } from "../types/quality.types";

type QualityRecommendationsProps = {
  score: QualityScore;
};

export default function QualityRecommendations({ score }: QualityRecommendationsProps) {
  return (
    <section className="quality-recommendations">
      <h3>Recommandations concrètes</h3>
      {score.recommendations.length === 0 ? (
        <p>Document prêt à être relu humainement pour publication.</p>
      ) : (
        <div>
          {score.recommendations.map((recommendation) => (
            <article key={recommendation.id}>
              <span>{recommendation.priority}</span>
              <strong>{recommendation.title}</strong>
              <p>{recommendation.description}</p>
              <em>Gain estimé +{recommendation.expectedGain}</em>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
