import { useEffect, useMemo, useState } from 'react'

function Admin({
  adminUser,
  catalog,
  firebaseEnabled,
  onLogin,
  onLogout,
  onSaveCatalog,
  onUpdateRegistration,
  registrations,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [catalogDraft, setCatalogDraft] = useState(catalog)
  const [saveMessage, setSaveMessage] = useState('')
  const [selectedRegistrationId, setSelectedRegistrationId] = useState('')
  const selectedRegistration = useMemo(
    () => registrations.find((item) => item.id === selectedRegistrationId) ?? registrations[0] ?? null,
    [registrations, selectedRegistrationId],
  )

  useEffect(() => {
    setCatalogDraft(catalog)
  }, [catalog])

  useEffect(() => {
    if (!selectedRegistrationId && registrations[0]?.id) {
      setSelectedRegistrationId(registrations[0].id)
    }
  }, [registrations, selectedRegistrationId])

  const updateVariant = (index, key, value) => {
    setCatalogDraft((current) => ({
      ...current,
      variants: current.variants.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: key === 'price' ? Number(value) : value } : item,
      ),
    }))
  }

  const updateAddon = (index, key, value) => {
    setCatalogDraft((current) => ({
      ...current,
      addons: current.addons.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: key === 'price' ? Number(value) : value } : item,
      ),
    }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')

    try {
      await onLogin(email, password)
      setPassword('')
    } catch (error) {
      setLoginError(error.message || 'Unable to sign in.')
    }
  }

  const handleSaveCatalog = async () => {
    try {
      await onSaveCatalog(catalogDraft)
      setSaveMessage('Catalog saved.')
    } catch (error) {
      setSaveMessage(error.message || 'Unable to save catalog.')
    }
  }

  const handleRegistrationChange = async (field, value) => {
    if (!selectedRegistration) {
      return
    }

    await onUpdateRegistration(selectedRegistration.id, { [field]: value })
  }

  if (!firebaseEnabled) {
    return (
      <div className="page">
        <section className="shell-section admin-blank">
          <h1 className="checkout-title">Firebase is not configured.</h1>
          <p className="checkout-copy">
            Add the Firebase frontend and server environment variables to activate the live admin area.
          </p>
        </section>
      </div>
    )
  }

  if (!adminUser) {
    return (
      <div className="page">
        <section className="shell-section admin-auth-card">
          <h1 className="checkout-title">Admin sign in</h1>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="field">
              <span>Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            {loginError ? <div className="error-box">{loginError}</div> : null}
            <button className="button button--primary" type="submit">
              Sign in
            </button>
          </form>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="shell-section admin-page">
        <div className="admin-header">
          <div>
            <span className="section-chip">Live admin</span>
            <h1 className="checkout-title">Registrations and pricing</h1>
            <p className="checkout-copy">Signed in as {adminUser.email}</p>
          </div>
          <button className="button button--ghost" onClick={onLogout}>
            Sign out
          </button>
        </div>

        <div className="admin-layout">
          <div className="admin-panel">
            <div className="admin-panel__top">
              <h2>Pricing catalog</h2>
              <button className="button button--primary" onClick={handleSaveCatalog}>
                Save prices
              </button>
            </div>
            {saveMessage ? <p className="admin-status">{saveMessage}</p> : null}

            <div className="admin-subsection">
              <h3>Base pages</h3>
              {catalogDraft.variants.map((item, index) => (
                <div className="admin-editor-card" key={item.id}>
                  <label className="field">
                    <span>Page label</span>
                    <input value={item.pageLabel} onChange={(event) => updateVariant(index, 'pageLabel', event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input value={item.title} onChange={(event) => updateVariant(index, 'title', event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Conference access price</span>
                    <input type="number" value={item.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} />
                  </label>
                </div>
              ))}
            </div>

            <div className="admin-subsection">
              <h3>Add-ons</h3>
              {catalogDraft.addons.map((item, index) => (
                <div className="admin-editor-card" key={item.id}>
                  <label className="field">
                    <span>Name</span>
                    <input value={item.name} onChange={(event) => updateAddon(index, 'name', event.target.value)} />
                  </label>
                  <label className="field">
                    <span>Price</span>
                    <input type="number" value={item.price} onChange={(event) => updateAddon(index, 'price', event.target.value)} />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-panel__top">
              <h2>Live registrations</h2>
              <span className="admin-status">{registrations.length} records</span>
            </div>

            <div className="registration-list">
              {registrations.map((item) => (
                <button
                  key={item.id}
                  className={`registration-list__item ${selectedRegistration?.id === item.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedRegistrationId(item.id)}
                >
                  <strong>{item.customer?.firstName} {item.customer?.lastName}</strong>
                  <span>{item.variantName}</span>
                  <span>{item.paymentStatus || 'pending'}</span>
                </button>
              ))}
            </div>

            {selectedRegistration ? (
              <div className="registration-detail">
                <h3>{selectedRegistration.customer?.firstName} {selectedRegistration.customer?.lastName}</h3>
                <p>{selectedRegistration.customer?.email}</p>
                <p>Total: EUR {selectedRegistration.totalAmount}</p>
                <p>Reference: {selectedRegistration.bookingReference}</p>
                <label className="field">
                  <span>Hotel room</span>
                  <input
                    defaultValue={selectedRegistration.hotelRoom || ''}
                    onBlur={(event) => handleRegistrationChange('hotelRoom', event.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Admin notes</span>
                  <textarea
                    defaultValue={selectedRegistration.adminNotes || ''}
                    onBlur={(event) => handleRegistrationChange('adminNotes', event.target.value)}
                  />
                </label>
              </div>
            ) : (
              <p className="checkout-copy">No registrations yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Admin
