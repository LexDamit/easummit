import { useMemo, useState } from 'react'
import {
  getCountryOptions,
  getFederationOptions,
  getRoleOptions,
} from '../data/participantOptions'

const initialParticipant = {
  firstName: '',
  lastName: '',
  email: '',
  country: '',
  memberFederation: '',
  role: '',
  gender: '',
}

const validateEmail = (value) => /\S+@\S+\.\S+/.test(value)

const readJsonSafely = async (response) => {
  const rawText = await response.text()

  if (!rawText) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    return {
      error: rawText.slice(0, 200) || 'Unexpected non-JSON response received.',
    }
  }
}

const getFunctionErrorMessage = (response, data, t) => {
  if (response.status === 404) {
    return t.checkout.errors.function404
  }

  return data.error || t.checkout.errors.checkoutFailed
}

const getAddonDescription = (packageType, addonId, t) => {
  if (packageType === 'double') {
    if (addonId === 'networking-dinner') {
      return t.checkout.dinnerDouble
    }

    if (addonId.startsWith('hotel-')) {
      return t.checkout.hotelDouble
    }
  }

  if (addonId === 'networking-dinner') {
    return t.checkout.dinnerSingle
  }

  if (addonId.startsWith('hotel-')) {
    return t.checkout.hotelSingle
  }

  return t.checkout.optionalAddon
}

function ParticipantPathIcon({ count }) {
  if (count > 1) {
    return (
      <span className="participant-path-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48" focusable="false">
          <circle cx="17" cy="16" r="5.5" />
          <circle cx="31" cy="16" r="5.5" opacity="0.85" />
          <path d="M8.5 34.5c0-5 3.9-9 8.8-9h.2c4.9 0 8.8 4 8.8 9" />
          <path d="M21.7 34.5c0-5 3.9-9 8.8-9h.2c4.9 0 8.8 4 8.8 9" opacity="0.85" />
        </svg>
      </span>
    )
  }

  return (
    <span className="participant-path-icon" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <circle cx="24" cy="16" r="6" />
        <path d="M14 34.5c0-5.5 4.3-10 9.8-10h.4c5.5 0 9.8 4.5 9.8 10" />
      </svg>
    </span>
  )
}

function SearchableSelect({
  name,
  value,
  options,
  placeholder,
  onChange,
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) || null,
    [options, value],
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return options.slice(0, 12)
    }

    return options
      .filter((option) => option.label.toLowerCase().includes(normalizedQuery))
      .slice(0, 12)
  }, [options, query])

  const handlePick = (optionValue) => {
    onChange({
      target: {
        name,
        value: optionValue,
      },
    })
    setIsOpen(false)
  }

  return (
    <div
      className={`searchable-select ${isOpen ? 'is-open' : ''}`}
      onBlur={() => {
        window.setTimeout(() => {
          setIsOpen(false)
          setQuery(selectedOption?.label || '')
        }, 120)
      }}
    >
      <input
        name={name}
        value={isOpen ? query : selectedOption?.label || query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value)
          setIsOpen(true)
          if (!event.target.value.trim()) {
            onChange({
              target: {
                name,
                value: '',
              },
            })
          }
        }}
      />
      <button
        className="searchable-select__toggle"
        type="button"
        aria-label="Toggle options"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsOpen((current) => !current)}
      >
        ▾
      </button>
      {isOpen ? (
        <div className="searchable-select__menu">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                className={`searchable-select__option ${
                  option.value === value ? 'is-selected' : ''
                }`}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handlePick(option.value)}
              >
                {option.label}
              </button>
            ))
          ) : (
            <div className="searchable-select__empty">No result</div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function RegistrationCheckout({ addonsByPackage, language, t, variant }) {
  const [packageType, setPackageType] = useState('single')
  const [participants, setParticipants] = useState([
    initialParticipant,
    initialParticipant,
  ])
  const [selectedAddons, setSelectedAddons] = useState([])
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const packageOptions = variant.packageOptions || []
  const selectedPackage =
    packageOptions.find((item) => item.id === packageType) || packageOptions[0]
  const activeAddons = useMemo(
    () => addonsByPackage[packageType] || [],
    [addonsByPackage, packageType],
  )
  const countryOptions = useMemo(() => getCountryOptions(language), [language])
  const federationOptions = useMemo(
    () => getFederationOptions(language),
    [language],
  )
  const roleOptions = useMemo(() => getRoleOptions(language), [language])
  const conditionItems = t.checkout.conditionsByVariant?.[variant.id] || []
  const includesCopy = t.checkout.includesByVariant?.[variant.id] || ''

  const selectedAddonObjects = useMemo(
    () => activeAddons.filter((item) => selectedAddons.includes(item.id)),
    [activeAddons, selectedAddons],
  )

  const totalAmount = useMemo(
    () =>
      Number(selectedPackage?.price || 0) +
      selectedAddonObjects.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selectedAddonObjects, selectedPackage],
  )

  const participantCount = selectedPackage?.participantCount || 1
  const participantSections = Array.from({ length: participantCount })

  const getParticipantIncludedLabel = (item) =>
    item.participantCount > 1
      ? t.checkout.participantsIncludedPlural.replace(
          '{count}',
          item.participantCount,
        )
      : t.checkout.participantsIncluded.replace('{count}', item.participantCount)

  const handleParticipantChange = (index, event) => {
    const { name, value } = event.target

    setParticipants((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [name]: value } : item,
      ),
    )

    setErrors((current) => ({ ...current, [`${name}-${index}`]: '' }))
  }

  const handlePackageChange = (nextPackageType) => {
    setPackageType(nextPackageType)
    setSelectedAddons([])
  }

  const toggleAddon = (addonId) => {
    setSelectedAddons((current) =>
      current.includes(addonId)
        ? current.filter((item) => item !== addonId)
        : [...current, addonId],
    )
  }

  const validateParticipant = (participant, index, nextErrors) => {
    if (!participant.firstName.trim()) {
      nextErrors[`firstName-${index}`] = t.checkout.errors.firstNameRequired
    }
    if (!participant.lastName.trim()) {
      nextErrors[`lastName-${index}`] = t.checkout.errors.lastNameRequired
    }
    if (!participant.email.trim()) {
      nextErrors[`email-${index}`] = t.checkout.errors.emailRequired
    } else if (!validateEmail(participant.email)) {
      nextErrors[`email-${index}`] = t.checkout.errors.emailInvalid
    }
    if (!participant.country.trim()) {
      nextErrors[`country-${index}`] = t.checkout.errors.countryRequired
    }
    if (!participant.memberFederation.trim()) {
      nextErrors[`memberFederation-${index}`] =
        t.checkout.errors.federationRequired
    }
    if (!participant.role.trim()) {
      nextErrors[`role-${index}`] = t.checkout.errors.roleRequired
    }
    if (!participant.gender.trim()) {
      nextErrors[`gender-${index}`] = t.checkout.errors.genderRequired
    }
  }

  const validateForm = () => {
    const nextErrors = {}

    participants.slice(0, participantCount).forEach((participant, index) => {
      validateParticipant(participant, index, nextErrors)
    })

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setRequestError('')

    try {
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: variant.id,
          packageType,
          addonIds: selectedAddons,
          language,
          participants: participants.slice(0, participantCount),
        }),
      })

      const data = await readJsonSafely(response)

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(getFunctionErrorMessage(response, data, t))
      }

      window.location.href = data.checkoutUrl
    } catch (error) {
      setRequestError(error.message || t.checkout.errors.checkoutFailed)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page">
      <section className="checkout-hero shell-section">
        <div className="checkout-hero__headline">
          <span className="checkout-hero__eyebrow">{t.checkout.packageIntroLabel}</span>
          <h1 className="checkout-title checkout-title--inline">
            {t.checkout.packageHeroPrefix}
            <span className="checkout-title__accent checkout-title__accent--inline">
              {variant.title}
            </span>
          </h1>
        </div>
        <div className="checkout-info-grid">
          {conditionItems.length ? (
            <div className="checkout-info-card">
              <span className="checkout-conditions-label">{t.checkout.eligibilityLabel}</span>
              <ul className="checkout-conditions">
                {conditionItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {includesCopy ? (
            <div className="checkout-info-card checkout-info-card--soft">
              <span className="checkout-conditions-label">{t.checkout.includesLabel}</span>
              <p className="checkout-includes-note">{includesCopy}</p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="shell-section checkout-grid">
        <form className="checkout-form-card" onSubmit={handleSubmit}>
          <div className="checkout-section">
            <div className="checkout-section__header">
              <span className="checkout-section__index">01</span>
              <div className="checkout-section__heading-block">
                <h2>{t.checkout.packageSelection}</h2>
                <p className="checkout-section__help">{t.checkout.packageSelectionHelp}</p>
              </div>
            </div>
            <div className="addon-grid">
              {packageOptions.map((item) => {
                const isSelected = item.id === packageType

                return (
                  <button
                    key={item.id}
                    className={`selection-card ${
                      isSelected ? 'selection-card--selected' : ''
                    }`}
                    type="button"
                    onClick={() => handlePackageChange(item.id)}
                  >
                    <div className="selection-card__body">
                      <div className="selection-card__visual-row">
                        <ParticipantPathIcon count={item.participantCount} />
                        <span className="selection-card__count-badge">
                          {item.participantCount > 1 ? '2P' : '1P'}
                        </span>
                      </div>
                      <strong>{item.name}</strong>
                      <p>{item.baseDescription}</p>
                      <span className="selection-card__meta">
                        {getParticipantIncludedLabel(item)}
                      </span>
                    </div>
                    <span className="selection-card__price">EUR {item.price}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="checkout-section">
            <div className="checkout-section__header">
              <span className="checkout-section__index">02</span>
              <h2>{t.checkout.addons}</h2>
            </div>
            <div className="addon-stack">
              {activeAddons.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id)

                return (
                  <button
                    key={`${packageType}-${addon.id}`}
                    className={`selection-card ${
                      isSelected ? 'selection-card--selected' : ''
                    }`}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <div>
                      <strong>{addon.name}</strong>
                      <p>{getAddonDescription(packageType, addon.id, t)}</p>
                    </div>
                    <span>EUR {addon.price}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {participantSections.map((_, index) => {
            const participant = participants[index]
            const title =
              participantCount === 2
                ? t.checkout.participantInformationIndexed.replace(
                    '{index}',
                    index + 1,
                  )
                : t.checkout.participantInformation

            return (
              <div className="checkout-section" key={`participant-${index}`}>
                <div className="checkout-section__header">
                  <span className="checkout-section__index">
                    {String(index + 3).padStart(2, '0')}
                  </span>
                  <h2>{title}</h2>
                </div>
                <div className="form-grid">
                  <label className="field">
                    <span>{t.checkout.firstName}</span>
                    <input
                      name="firstName"
                      value={participant.firstName}
                      onChange={(event) => handleParticipantChange(index, event)}
                    />
                    {errors[`firstName-${index}`] ? (
                      <span className="field__error">
                        {errors[`firstName-${index}`]}
                      </span>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>{t.checkout.lastName}</span>
                    <input
                      name="lastName"
                      value={participant.lastName}
                      onChange={(event) => handleParticipantChange(index, event)}
                    />
                    {errors[`lastName-${index}`] ? (
                      <span className="field__error">
                        {errors[`lastName-${index}`]}
                      </span>
                    ) : null}
                  </label>
                  <label className="field field--full">
                    <span>{t.checkout.email}</span>
                    <input
                      name="email"
                      type="email"
                      value={participant.email}
                      onChange={(event) => handleParticipantChange(index, event)}
                    />
                    {errors[`email-${index}`] ? (
                      <span className="field__error">
                        {errors[`email-${index}`]}
                      </span>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>{t.checkout.country}</span>
                    <SearchableSelect
                      name="country"
                      value={participant.country}
                      options={countryOptions}
                      placeholder={t.checkout.selectCountry}
                      onChange={(event) => handleParticipantChange(index, event)}
                    />
                    {errors[`country-${index}`] ? (
                      <span className="field__error">
                        {errors[`country-${index}`]}
                      </span>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>{t.checkout.memberFederation}</span>
                    <SearchableSelect
                      name="memberFederation"
                      value={participant.memberFederation}
                      options={federationOptions}
                      placeholder={t.checkout.selectFederation}
                      onChange={(event) => handleParticipantChange(index, event)}
                    />
                    {errors[`memberFederation-${index}`] ? (
                      <span className="field__error">
                        {errors[`memberFederation-${index}`]}
                      </span>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>{t.checkout.role}</span>
                    <select
                      name="role"
                      value={participant.role}
                      onChange={(event) => handleParticipantChange(index, event)}
                    >
                      <option value="">{t.checkout.selectRole}</option>
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {errors[`role-${index}`] ? (
                      <span className="field__error">
                        {errors[`role-${index}`]}
                      </span>
                    ) : null}
                  </label>
                  <label className="field">
                    <span>{t.checkout.gender}</span>
                    <select
                      name="gender"
                      value={participant.gender}
                      onChange={(event) => handleParticipantChange(index, event)}
                    >
                      <option value="">{t.checkout.select}</option>
                      <option value="Female">{t.checkout.female}</option>
                      <option value="Male">{t.checkout.male}</option>
                      <option value="Non-binary">{t.checkout.nonBinary}</option>
                      <option value="Prefer not to say">{t.checkout.preferNotToSay}</option>
                    </select>
                    {errors[`gender-${index}`] ? (
                      <span className="field__error">
                        {errors[`gender-${index}`]}
                      </span>
                    ) : null}
                  </label>
                </div>
              </div>
            )
          })}

          {requestError ? <div className="error-box">{requestError}</div> : null}

          <div className="cta-row">
            <button className="button button--primary" type="submit" disabled={isLoading}>
              {isLoading ? t.checkout.preparingPayment : t.checkout.continueToPayment}
            </button>
          </div>
        </form>

        <aside className="order-summary-card">
          <span className="order-summary-card__eyebrow">{t.checkout.orderSummaryEyebrow}</span>
          <h2>{t.checkout.orderSummary}</h2>
          <div className="summary-line">
            <span>{selectedPackage?.name}</span>
            <strong>EUR {selectedPackage?.price}</strong>
          </div>
          <div className="summary-line">
            <span>{selectedPackage?.baseItemName}</span>
            <strong>
              {participantCount > 1
                ? t.checkout.participantCountPlural.replace(
                    '{count}',
                    participantCount,
                  )
                : t.checkout.participantCount.replace('{count}', participantCount)}
            </strong>
          </div>
          {selectedAddonObjects.map((addon) => (
            <div className="summary-line" key={`${packageType}-${addon.id}`}>
              <span>{addon.name}</span>
              <strong>EUR {addon.price}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>{t.checkout.total}</span>
            <strong>EUR {totalAmount}</strong>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default RegistrationCheckout
