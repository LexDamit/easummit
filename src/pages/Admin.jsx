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
    () =>
      registrations.find((item) => item.id === selectedRegistrationId) ??
      registrations[0] ??
      null,
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

  const updateVariantField = (index, key, value) => {
    setCatalogDraft((current) => ({
      ...current,
      variants: current.variants.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }))
  }

  const updatePackageOption = (variantIndex, packageId, key, value) => {
    setCatalogDraft((current) => ({
      ...current,
      variants: current.variants.map((item, itemIndex) => {
        if (itemIndex !== variantIndex) {
          return item
        }

        return {
          ...item,
          packageOptions: item.packageOptions.map((option) =>
            option.id === packageId
              ? { ...option, [key]: key === 'price' ? Number(value) : value }
              : option,
          ),
        }
      }),
    }))
  }

  const updateAddon = (packageType, addonId, key, value) => {
    setCatalogDraft((current) => ({
      ...current,
      addonsByPackage: {
        ...current.addonsByPackage,
        [packageType]: (current.addonsByPackage?.[packageType] ?? []).map((item) =>
          item.id === addonId
            ? { ...item, [key]: key === 'price' ? Number(value) : value }
            : item,
        ),
      },
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
            Add the Firebase frontend and server environment variables to
            activate the live admin area.
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
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
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
                    <input
                      value={item.pageLabel}
                      onChange={(event) =>
                        updateVariantField(index, 'pageLabel', event.target.value)
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Title</span>
                    <input
                      value={item.title}
                      onChange={(event) =>
                        updateVariantField(index, 'title', event.target.value)
                      }
                    />
                  </label>
                  <label className="field field--full">
                    <span>Description</span>
                    <textarea
                      value={item.description}
                      onChange={(event) =>
                        updateVariantField(index, 'description', event.target.value)
                      }
                    />
                  </label>

                  {item.packageOptions.map((option) => (
                    <div className="admin-editor-card" key={`${item.id}-${option.id}`}>
                      <label className="field">
                        <span>Package name</span>
                        <input
                          value={option.name}
                          onChange={(event) =>
                            updatePackageOption(
                              index,
                              option.id,
                              'name',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Conference access price</span>
                        <input
                          type="number"
                          value={option.price}
                          onChange={(event) =>
                            updatePackageOption(
                              index,
                              option.id,
                              'price',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="field field--full">
                        <span>Package description</span>
                        <textarea
                          value={option.baseDescription}
                          onChange={(event) =>
                            updatePackageOption(
                              index,
                              option.id,
                              'baseDescription',
                              event.target.value,
                            )
                          }
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="admin-subsection">
              <h3>Add-ons</h3>
              {Object.entries(catalogDraft.addonsByPackage ?? {}).map(
                ([packageType, addons]) => (
                  <div className="admin-editor-card" key={packageType}>
                    <h4>
                      {packageType === 'double'
                        ? 'Base package 2 people'
                        : 'Base package 1 person'}
                    </h4>
                    {addons.map((item) => (
                      <div
                        className="admin-editor-card"
                        key={`${packageType}-${item.id}`}
                      >
                        <label className="field">
                          <span>Name</span>
                          <input
                            value={item.name}
                            onChange={(event) =>
                              updateAddon(
                                packageType,
                                item.id,
                                'name',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                        <label className="field">
                          <span>Price</span>
                          <input
                            type="number"
                            value={item.price}
                            onChange={(event) =>
                              updateAddon(
                                packageType,
                                item.id,
                                'price',
                                event.target.value,
                              )
                            }
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                ),
              )}
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
                  className={`registration-list__item ${
                    selectedRegistration?.id === item.id ? 'is-active' : ''
                  }`}
                  onClick={() => setSelectedRegistrationId(item.id)}
                >
                  <strong>
                    {item.primaryParticipant?.firstName || item.customer?.firstName}{' '}
                    {item.primaryParticipant?.lastName || item.customer?.lastName}
                  </strong>
                  <span>
                    {item.variantName} · {item.packageName}
                  </span>
                  <span>{item.paymentStatus || 'pending'}</span>
                </button>
              ))}
            </div>

            {selectedRegistration ? (
              <div className="registration-detail">
                <h3>
                  {selectedRegistration.primaryParticipant?.firstName ||
                    selectedRegistration.customer?.firstName}{' '}
                  {selectedRegistration.primaryParticipant?.lastName ||
                    selectedRegistration.customer?.lastName}
                </h3>
                <p>
                  {selectedRegistration.primaryParticipant?.email ||
                    selectedRegistration.customer?.email}
                </p>
                <p>Total: EUR {selectedRegistration.totalAmount}</p>
                <p>Reference: {selectedRegistration.bookingReference}</p>
                <p>Package: {selectedRegistration.packageName}</p>

                {selectedRegistration.participants?.length ? (
                  <div className="admin-subsection">
                    <h3>Participants</h3>
                    {selectedRegistration.participants.map((participant, index) => (
                      <div
                        className="admin-editor-card"
                        key={`${selectedRegistration.id}-participant-${index}`}
                      >
                        <strong>Participant {index + 1}</strong>
                        <p>
                          {participant.firstName} {participant.lastName}
                        </p>
                        <p>{participant.email}</p>
                        <p>{participant.country}</p>
                        <p>{participant.memberFederation}</p>
                        <p>{participant.role}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <label className="field">
                  <span>Hotel room</span>
                  <input
                    defaultValue={selectedRegistration.hotelRoom || ''}
                    onBlur={(event) =>
                      handleRegistrationChange('hotelRoom', event.target.value)
                    }
                  />
                </label>
                <label className="field">
                  <span>Admin notes</span>
                  <textarea
                    defaultValue={selectedRegistration.adminNotes || ''}
                    onBlur={(event) =>
                      handleRegistrationChange('adminNotes', event.target.value)
                    }
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
