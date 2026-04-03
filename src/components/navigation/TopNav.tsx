import { referentielPages } from '../../data/referentielPages';

interface Props {
  currentPath: string;
}

export function TopNav({ currentPath }: Props) {
  return (
    <div className="main-nav">
      <div className="main-nav__brand">
        <strong>BCVB</strong>
      </div>
      <div className="main-nav__actions">
        {referentielPages.map((item) => {
          const active = item.path.replace('#', '') === currentPath;
          return (
            <a key={item.id} className={`nav-tab${active ? ' is-active' : ''}`} href={item.path}>
              {item.title}
            </a>
          );
        })}
      </div>
    </div>
  );
}
