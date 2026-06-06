type BCVBKeyPointGridProps = {
  items: string[]
}

export function BCVBKeyPointGrid({ items }: BCVBKeyPointGridProps) {
  return (
    <div className="bcvb-keypoint-grid">
      {items.map((item, index) => {
        const [title, ...rest] = item.split(':')
        const hasTitle = rest.length > 0

        return (
          <article className="bcvb-keypoint-card" key={`${item}-${index}`}>
            <span>{index + 1}</span>
            <h3>{hasTitle ? title.trim() : `Repère ${index + 1}`}</h3>
            <p>{(hasTitle ? rest.join(':') : item).trim()}</p>
          </article>
        )
      })}
    </div>
  )
}

