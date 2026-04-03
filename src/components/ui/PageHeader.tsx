type Props = {
  title: string;
  subtitle: string;
};

export function PageHeader({ title, subtitle }: Props) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        <p className="page-header__subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
