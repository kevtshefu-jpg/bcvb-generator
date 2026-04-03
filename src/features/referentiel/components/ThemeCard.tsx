import type { ThemeRecord } from '../../../types/referentiel';
import { SectionCard } from '../../../components/ui/SectionCard';

interface Props {
  theme: ThemeRecord;
}

export function ThemeCard({ theme }: Props) {
  return (
    <SectionCard title={theme.title}>
      <p>{theme.summary}</p>
      <a className="bcvb-link" href={`#/themes/${theme.id}`}>Explorer</a>
    </SectionCard>
  );
}
