type MobileSectionTab = {
  id: string
  label: string
  icon?: string
}

type MobileSectionTabsProps = {
  tabs: MobileSectionTab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export default function MobileSectionTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: MobileSectionTabsProps) {
  if (!tabs.length) return null

  return (
    <div
      className={`mobile-section-tabs ${className}`.trim()}
      role="tablist"
      aria-label="Sections"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTab

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={
              active
                ? 'mobile-section-tab mobile-section-tab--active'
                : 'mobile-section-tab'
            }
            onClick={() => onChange(tab.id)}
          >
            {tab.icon ? (
              <span aria-hidden="true">{tab.icon}</span>
            ) : null}

            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}