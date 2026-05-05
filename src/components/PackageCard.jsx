function PackageCard({ packageItem, onSelect }) {
  return (
    <article className="package-card">
      <div className="package-card__main">
        <span className="package-card__eyebrow">Formule</span>
        <h3>{packageItem.name}</h3>
        <p className="package-card__description">{packageItem.description}</p>
        <ul className="bullet-list">
          {packageItem.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="package-card__side">
        <p className="package-card__price">
          EUR {packageItem.price}
          <small>par participant</small>
        </p>
        <button className="button button--primary" onClick={() => onSelect(packageItem.id)}>
          Choisir cette formule
        </button>
      </div>
    </article>
  )
}

export default PackageCard
