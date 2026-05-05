import { useMemo, useState } from 'react'

const initialForm = {
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

function RegistrationCheckout({ addons, navigate, variant }) {
  const [formData, setFormData] = useState(initialForm)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const selectedAddonObjects = useMemo(
    () => addons.filter((item) => selectedAddons.includes(item.id)),
    [addons, selectedAddons],
  )

  const totalAmount = useMemo(
    () =>
      variant.price +
      selectedAddonObjects.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selectedAddonObjects, variant.price],
  )

  const toggleAddon = (addonId) => {
    setSelectedAddons((current) =>
      current.includes(addonId)
        ? current.filter((item) => item !== addonId)
        : [...current, addonId],
    )
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.firstName.trim()) nextErrors.firstName = 'First name is required.'
    if (!formData.lastName.trim()) nextErrors.lastName = 'Last name is required.'
    if (!formData.email.trim()) nextErrors.email = 'Email is required.'
    else if (!validateEmail(formData.email)) nextErrors.email = 'Please enter a valid email.'
    if (!formData.country.trim()) nextErrors.country = 'Country is required.'
    if (!formData.memberFederation.trim()) nextErrors.memberFederation = 'Member Federation is required.'
    if (!formData.role.trim()) nextErrors.role = 'Role is required.'
    if (!formData.gender.trim()) nextErrors.gender = 'Gender is required.'

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
          addonIds: selectedAddons,
          customer: formData,
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
            <span className="preview-badge">Conference Access</span>
            <strong>EUR {variant.price}</strong>
          </div>
        </div>
      </section>

      <section className="shell-section checkout-grid">
        <form className="checkout-form-card" onSubmit={handleSubmit}>
          <div className="checkout-section">
            <h2>Base package</h2>
            <div className="selection-card selection-card--selected">
              <div>
                <strong>{variant.baseItemName}</strong>
                <p>{variant.pageLabel} category</p>
              </div>
              <span>EUR {variant.price}</span>
            </div>
          </div>

          <div className="checkout-section">
            <h2>Add-ons</h2>
            <div className="addon-grid">
              {addons.map((addon) => {
                const isSelected = selectedAddons.includes(addon.id)

                return (
                  <button
                    key={addon.id}
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

          <div className="checkout-section">
            <h2>Participant information</h2>
            <div className="form-grid">
              <label className="field">
                <span>First Name</span>
                <input name="firstName" value={formData.firstName} onChange={handleChange} />
                {errors.firstName ? <span className="field__error">{errors.firstName}</span> : null}
              </label>
              <label className="field">
                <span>Name</span>
                <input name="lastName" value={formData.lastName} onChange={handleChange} />
                {errors.lastName ? <span className="field__error">{errors.lastName}</span> : null}
              </label>
              <label className="field field--full">
                <span>Email</span>
                <input name="email" type="email" value={formData.email} onChange={handleChange} />
                {errors.email ? <span className="field__error">{errors.email}</span> : null}
              </label>
              <label className="field">
                <span>Country</span>
                <input name="country" value={formData.country} onChange={handleChange} />
                {errors.country ? <span className="field__error">{errors.country}</span> : null}
              </label>
              <label className="field">
                <span>Member Federation</span>
                <input name="memberFederation" value={formData.memberFederation} onChange={handleChange} />
                {errors.memberFederation ? <span className="field__error">{errors.memberFederation}</span> : null}
              </label>
              <label className="field">
                <span>Role</span>
                <input name="role" value={formData.role} onChange={handleChange} />
                {errors.role ? <span className="field__error">{errors.role}</span> : null}
              </label>
              <label className="field">
                <span>Gender</span>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender ? <span className="field__error">{errors.gender}</span> : null}
              </label>
            </div>
          </div>

          {requestError ? <div className="error-box">{requestError}</div> : null}

          <div className="cta-row">
            <button className="button button--primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Preparing payment...' : 'Continue to SumUp'}
            </button>
            <button className="button button--ghost" type="button" onClick={() => navigate('admin')}>
              Admin access
            </button>
          </div>
        </form>

        <aside className="order-summary-card">
          <h2>Order summary</h2>
          <div className="summary-line">
            <span>{variant.baseItemName}</span>
            <strong>EUR {variant.price}</strong>
          </div>
          {selectedAddonObjects.map((addon) => (
            <div className="summary-line" key={addon.id}>
              <span>{addon.name}</span>
              <strong>EUR {addon.price}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <strong>EUR {totalAmount}</strong>
          </div>
          <p className="summary-note">
            After SumUp checkout, the participant is redirected back to the summary and ticket view.
          </p>
        </aside>
      </section>
    </div>
  )
}

export default RegistrationCheckout
