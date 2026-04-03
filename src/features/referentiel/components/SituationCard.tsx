import type { SituationRecord } from '../../../types/referentiel';
import { Tag } from '../../../components/ui/Tag';

interface Props {
  situation: SituationRecord;
}

export function SituationCard({ situation }: Props) {
  return (
    <article className="bcvb-panel">
      <h3>{situation.title}</h3>
      <p>{situation.objective}</p>
      <div className="bcvb-chip-row">
        <Tag label={situation.categoryIds.join(' / ')} />
        <Tag label={situation.themeIds.join(' / ')} />
        <Tag label={`${situation.durationMin} min`} />
      </div>
    </article>
  );
}
