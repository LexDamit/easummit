import { useMemo, useState } from 'react'

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

const getFunctionErrorMessage = (response, data, fallbackMessage) => {
  if (response.status === 404) {
    return 'Netlify Functions are not available on this dev server. Run the app with `netlify dev` instead of plain `vite`.'
  }

  return data.error || fallbackMessage
}

function RegistrationCheckout({ variant, addonsByPackage }) {
  const [packageType, setPackageType] = useState('single')
  const [participants, setParticipants] = useState([initialParticipant, initialParticipant])
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
    if (!participant.firstName.trim()) nextErrors[`firstName-${index}`] = 'First name is required.'
    if (!participant.lastName.trim()) nextErrors[`lastName-${index}`] = 'Name is required.'
    if (!participant.email.trim()) nextErrors[`email-${index}`] = 'Email is required.'
    else if (!validateEmail(participant.email)) nextErrors[`email-${index}`] = 'Please enter a valid email.'
    if (!participant.country.trim()) nextErrors[`country-${index}`] = 'Country is required.'
    if (!participant.memberFederation.trim()) nextErrors[`memberFederation-${index}`] = 'Member Federation is required.'
    if (!participant.role.trim()) nextErrors[`role-${index}`] = 'Role is required.'
    if (!participant.gender.trim()) nextErrors[`gender-${index}`] = 'Gender is required.'
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
          participants: participants.slice(0, participantCount),
        }),
      })

      const data = await readJsonSafely(response)

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(
          getFunctionErrorMessage(response, data, 'Unable to create checkout.'),
        )
      }

      window.location.href = data.checkoutUrl
    } catch (error) {
      setRequestError(error.message || 'Unable to create checkout.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page">
      <section className="checkout-hero shell-section">
        <div>
          <span className="section-chip">{variant.pageLabel}</span>
          <h1 className="checkout-title">{variant.title}</h1>
          <p className="checkout-copy">{variant.description}</p>
        </div>
        <div className="checkout-preview">
          <div className="checkout-preview__inner">
            <span className="preview-badge">{selectedPackage?.baseItemName}</span>
            <strong>EUR {selectedPackage?.price}</strong>
          </div>
        </div>
      </section>

      <section className="shell-section checkout-grid">
        <form className="checkout-form-card" onSubmit={handleSubmit}>
          <div className="checkout-section">
            <h2>Package selection</h2>
            <div className="addon-grid">
              {packageOptions.map((item) => {
                const isSelected = item.id === packageType

                return (
                  <button
                    key={item.id}
                    className={`selection-card ${isSelected ? 'selection-card--selected' : ''}`}
                    type="button"
                    onClick={() => handlePackageChange(item.id)}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.baseDescription}</p>
                    </div>
                    <span>EUR {item.price}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="checkout-section">
            <h2>Add-ons</h2>
            <div className="addon-grid">
              {activeAddons.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id)

                return (
                  <button
                    key={`${packageType}-${addon.id}`}
                    className={`selection-card ${isSelected ? 'selection-card--selected' : ''}`}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                  >
                    <div>
                      <strong>{addon.name}</strong>
                      <p>Optional add-on</p>
                    </div>
                    <span>EUR {addon.price}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {Array.from({ length: participantCount }).map((_, index) => {
            const participant = participants[index]
            const title =
              participantCount === 2
                ? `Information participant ${index + 1}`
                : 'Participant information'

            return (
              <div className="checkout-section" key={`participant-${index}`}>
                <h2>{title}</h2>
                <div className="form-grid">
                  <label className="field">
                    <span>First Name</span>
                    <input name="firstName" value={participant.firstName} onChange={(event) => handleParticipantChange(index, event)} />
                    {errors[`firstName-${index}`] ? <span className="field__error">{errors[`firstName-${index}`]}</span> : null}
                  </label>
                  <label className="field">
                    <span>Name</span>
                    <input name="lastName" value={participant.lastName} onChange={(event) => handleParticipantChange(index, event)} />
                    {errors[`lastName-${index}`] ? <span className="field__error">{errors[`lastName-${index}`]}</span> : null}
                  </label>
                  <label className="field field--full">
                    <span>Email</span>
                    <input name="email" type="email" value={participant.email} onChange={(event) => handleParticipantChange(index, event)} />
                    {errors[`email-${index}`] ? <span className="field__error">{errors[`email-${index}`]}</span> : null}
                  </label>
                  <label className="field">
                    <span>Country</span>
                    <input name="country" value={participant.country} onChange={(event) => handleParticipantChange(index, event)} />
                    {errors[`country-${index}`] ? <span className="field__error">{errors[`country-${index}`]}</span> : null}
                  </label>
                  <label className="field">
                    <span>Member Federation</span>
                    <input name="memberFederation" value={participant.memberFederation} onChange={(event) => handleParticipantChange(index, event)} />
                    {errors[`memberFederation-${index}`] ? <span className="field__error">{errors[`memberFederation-${index}`]}</span> : null}
                  </label>
                  <label className="field">
                    <span>Role</span>
                    <input name="role" value={participant.role} onChange={(event) => handleParticipantChange(index, event)} />
                    {errors[`role-${index}`] ? <span className="field__error">{errors[`role-${index}`]}</span> : null}
                  </label>
                  <label className="field">
                    <span>Gender</span>
                    <select name="gender" value={participant.gender} onChange={(event) => handleParticipantChange(index, event)}>
                      <option value="">Select</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                    {errors[`gender-${index}`] ? <span className="field__error">{errors[`gender-${index}`]}</span> : null}
                  </label>
                </div>
              </div>
            )
          })}

          {requestError ? <div className="error-box">{requestError}</div> : null}

          <div className="cta-row">
            <button className="button button--primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Preparing payment...' : 'Continue to payment'}
            </button>
          </div>
        </form>

        <aside className="order-summary-card">
          <h2>Order summary</h2>
          <div className="summary-line">
            <span>{selectedPackage?.name}</span>
            <strong>EUR {selectedPackage?.price}</strong>
          </div>
          <div className="summary-line">
            <span>{selectedPackage?.baseItemName}</span>
            <strong>{participantCount} participant{participantCount > 1 ? 's' : ''}</strong>
          </div>
          {selectedAddonObjects.map((addon) => (
            <div className="summary-line" key={`${packageType}-${addon.id}`}>
              <span>{addon.name}</span>
              <strong>EUR {addon.price}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>EUR {totalAmount}</strong>
          </div>
        </aside>
      </section>
    </div>
  )
}

export default RegistrationCheckout
