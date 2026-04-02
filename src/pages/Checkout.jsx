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

function Checkout({ navigate, selectedPackage }) {
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

      const data = await response.json()

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
        <div className="shell-section section-stack">
          <div>
            <span className="section-label">Checkout</span>
            <h1 className="page-title">Complete attendee details and continue to secure hosted payment.</h1>
            <p className="page-intro">
              Your card details will be collected on SumUp&apos;s external hosted checkout page after this step.
            </p>
          </div>

          <div className="checkout-layout">
            <div className="form-card">
              <form onSubmit={handleSubmit} noValidate>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="firstName">First name</label>
                    <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Alex" />
                    {errors.firstName ? <span className="field__error">{errors.firstName}</span> : null}
                  </div>

                  <div className="field">
                    <label htmlFor="lastName">Last name</label>
                    <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Dubois" />
                    {errors.lastName ? <span className="field__error">{errors.lastName}</span> : null}
                  </div>

                  <div className="field">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="alex@club.eu"
                    />
                    {errors.email ? <span className="field__error">{errors.email}</span> : null}
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+33 6 00 00 00 00" />
                  </div>

                  <div className="field field--full">
                    <label htmlFor="federation">Federation / club</label>
                    <input
                      id="federation"
                      name="federation"
                      value={formData.federation}
                      onChange={handleChange}
                      placeholder="Western Track Performance Club"
                    />
                    {errors.federation ? <span className="field__error">{errors.federation}</span> : null}
                  </div>

                  <div className="field field--full">
                    <label htmlFor="country">Country</label>
                    <input id="country" name="country" value={formData.country} onChange={handleChange} placeholder="France" />
                    {errors.country ? <span className="field__error">{errors.country}</span> : null}
                  </div>
                </div>

                <p className="form-helper">
                  By continuing, you&apos;ll leave the summit site and finish payment on the SumUp hosted checkout page.
                </p>

                {requestError ? <div className="error-box">{requestError}</div> : null}

                <div className="cta-row">
                  <button className="button button--primary" type="submit" disabled={isLoading}>
                    {isLoading ? 'Preparing payment...' : 'Continue to payment'}
                  </button>
                  <button className="button button--secondary" type="button" onClick={() => navigate('packages')} disabled={isLoading}>
                    Change package
                  </button>
                </div>
              </form>
            </div>

            <aside className="summary-card">
              <span className="section-label">Booking summary</span>
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
        </div>
      </section>
    </div>
  )
}

export default Checkout
