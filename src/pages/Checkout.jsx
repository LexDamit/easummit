import { useEffect, useState } from 'react'

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  federation: '',
  country: '',
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

function Checkout({ content, navigate, selectedPackage }) {
  const [formData, setFormData] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [requestError, setRequestError] = useState('')

  useEffect(() => {
    if (!selectedPackage) {
      navigate('packages')
    }
  }, [navigate, selectedPackage])

  if (!selectedPackage) {
    return null
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
    if (!formData.federation.trim()) nextErrors.federation = 'Federation or club is required.'
    if (!formData.country.trim()) nextErrors.country = 'Country is required.'

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
          packageId: selectedPackage.id,
          customer: {
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            federation: formData.federation.trim(),
            country: formData.country.trim(),
          },
        }),
      })

      const data = await readJsonSafely(response)

      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || 'Unable to create the payment session right now.')
      }

      window.location.href = data.checkoutUrl
    } catch (error) {
      setRequestError(error.message || 'Something went wrong while preparing payment.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="page">
      <section className="section">
        <div className="shell-section checkout-layout">
          <div className="form-card">
            <span className="section-label">{content.label}</span>
            <h1 className="page-title">{content.title}</h1>
            <p className="page-intro">{content.intro}</p>

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label className="field">
                  <span>First name</span>
                  <input name="firstName" value={formData.firstName} onChange={handleChange} />
                  {errors.firstName ? <span className="field__error">{errors.firstName}</span> : null}
                </label>
                <label className="field">
                  <span>Last name</span>
                  <input name="lastName" value={formData.lastName} onChange={handleChange} />
                  {errors.lastName ? <span className="field__error">{errors.lastName}</span> : null}
                </label>
                <label className="field">
                  <span>Email</span>
                  <input name="email" type="email" value={formData.email} onChange={handleChange} />
                  {errors.email ? <span className="field__error">{errors.email}</span> : null}
                </label>
                <label className="field">
                  <span>Phone (optional)</span>
                  <input name="phone" value={formData.phone} onChange={handleChange} />
                </label>
                <label className="field field--full">
                  <span>Federation / club</span>
                  <input name="federation" value={formData.federation} onChange={handleChange} />
                  {errors.federation ? <span className="field__error">{errors.federation}</span> : null}
                </label>
                <label className="field field--full">
                  <span>Country</span>
                  <input name="country" value={formData.country} onChange={handleChange} />
                  {errors.country ? <span className="field__error">{errors.country}</span> : null}
                </label>
              </div>

              <p className="form-helper">{content.helper}</p>
              {requestError ? <div className="error-box">{requestError}</div> : null}

              <div className="cta-row">
                <button className="button button--primary" type="submit" disabled={isLoading}>
                  {isLoading ? content.loadingLabel : content.submitLabel}
                </button>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => navigate('packages')}
                  disabled={isLoading}
                >
                  {content.changePackageLabel}
                </button>
              </div>
            </form>
          </div>

          <aside className="summary-card">
            <span className="section-label">Resume</span>
            <h3>{selectedPackage.name}</h3>
            <div className="summary-card__price">EUR {selectedPackage.price}</div>
            <p className="package-card__description">{selectedPackage.description}</p>
            <ul className="bullet-list">
              {selectedPackage.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default Checkout
