type MobileStickyStatusProps = {
  eyebrow?: string
  title: string
  details?: string
  primaryActionLabel?: string
  secondaryActionLabel?: string
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
  className?: string
}

export default function MobileStickyStatus({
  eyebrow,
  title,
  details,
  primaryActionLabel,
  secondaryActionLabel,
  onPrimaryAction,
  onSecondaryAction,
  className = '',
}: MobileStickyStatusProps) {
  return (
    <aside className={`mobile-sticky-status ${className}`.trim()}>
      <div className="mobile-sticky-status__content">
        {eyebrow ? (
          <span className="mobile-sticky-status__eyebrow">
            {eyebrow}
          </span>
        ) : null}

        <strong className="mobile-sticky-status__title">
          {title}
        </strong>

        {details ? (
          <small className="mobile-sticky-status__details">
            {details}
          </small>
        ) : null}
      </div>

      {(primaryActionLabel || secondaryActionLabel) ? (
        <div className="mobile-sticky-status__actions">
          {secondaryActionLabel ? (
            <button
              type="button"
              className="mobile-sticky-status__button mobile-sticky-status__button--secondary"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </button>
          ) : null}

          {primaryActionLabel ? (
            <button
              type="button"
              className="mobile-sticky-status__button mobile-sticky-status__button--primary"
              onClick={onPrimaryAction}
            >
              {primaryActionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}