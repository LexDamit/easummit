function PackageCard({ packageItem, onSelect }) {
  const isFeatured = packageItem.id === 'performance'

  return (
    <article className={`package-card ${isFeatured ? 'package-card--featured' : ''}`}>
      <div>
        <span className="package-card__eyebrow">{isFeatured ? 'Most selected' : 'Registration pass'}</span>
        <h3>{packageItem.name}</h3>
        <p className="package-card__price">
          EUR {packageItem.price}
          <small>per attendee</small>
        </p>
        <p className="package-card__description">{packageItem.description}</p>
      </div>

      <ul className="bullet-list">
        {packageItem.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <button className="button button--primary" onClick={() => onSelect(packageItem.id)}>
        Select package
      </button>
    </article>
  )
}

export default PackageCard
