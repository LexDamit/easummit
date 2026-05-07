import { useEffect, useMemo, useState } from 'react'
import {
  getCountryLabel,
  getFederationLabel,
  getRoleLabel,
} from '../data/participantOptions'

const ADMIN_TABS = ['definitions', 'registrations', 'finance', 'hotels']

const isPaidStatus = (value) => {
  if (typeof value === 'object' && value !== null) {
    return Boolean(value.paymentConfirmed)
  }

  const status = String(value || '').toLowerCase()
  return (
    status.includes('paid') ||
    status.includes('success') ||
    status.includes('complete') ||
    status.includes('settled')
  )
}

const parseAmount = (value) => Number(value || 0)

const formatTimestamp = (value, language) => {
  if (!value) {
    return '—'
  }

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value?._seconds
        ? new Date(value._seconds * 1000)
        : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getPrimaryParticipant = (registration) =>
  registration.primaryParticipant ||
  registration.customer ||
  registration.participants?.[0] ||
  {}

const registrationNeedsHotel = (registration) =>
  (registration.addons || []).some((item) => item.id?.startsWith('hotel-'))

const buildPaymentProofMarkup = (registrations, language, ui) => {
  const title = ui.paymentProofTitle
  const generatedAt = formatTimestamp(new Date(), language)

  const cards = registrations
    .map((registration) => {
      const primary = getPrimaryParticipant(registration)
      const addons = (registration.addons || [])
        .map((item) => `<li>${item.name} - EUR ${parseAmount(item.price).toFixed(2)}</li>`)
        .join('')

      return `
        <section class="proof-card">
          <div class="proof-top">
            <div>
              <div class="proof-chip">${ui.paymentProof}</div>
              <h2>${primary.firstName || ''} ${primary.lastName || ''}</h2>
              <p>${primary.email || ''}</p>
            </div>
            <div class="proof-amount">EUR ${parseAmount(registration.totalAmount).toFixed(2)}</div>
          </div>
          <div class="proof-grid">
            <p><strong>${ui.referenceLabel}:</strong> ${registration.bookingReference || registration.id}</p>
            <p><strong>${ui.paymentStatusLabel}:</strong> ${registration.paymentStatus || ui.pendingLabel}</p>
            <p><strong>${ui.packageLabel}:</strong> ${registration.packageName || '—'}</p>
            <p><strong>${ui.registeredLabel}:</strong> ${formatTimestamp(registration.createdAt, language)}</p>
          </div>
          ${addons ? `<div><strong>${ui.addonsLabel}</strong><ul>${addons}</ul></div>` : ''}
        </section>
      `
    })
    .join('')

  return `<!doctype html>
  <html lang="${language}">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; background: #f5f7fb; color: #10233a; margin: 0; padding: 24px; }
        .proof-header { margin-bottom: 24px; }
        .proof-card { background: #fff; border: 1px solid #d8e0eb; border-radius: 18px; padding: 20px; margin-bottom: 18px; }
        .proof-top { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
        .proof-chip { display: inline-block; padding: 6px 10px; border-radius: 999px; background: #eaf2ff; color: #0f3f86; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
        .proof-amount { font-size: 28px; font-weight: 700; color: #0f3f86; }
        .proof-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 18px; margin: 18px 0; }
        h1, h2, p, ul { margin-top: 0; }
        ul { padding-left: 18px; }
      </style>
    </head>
    <body>
      <header class="proof-header">
        <h1>${title}</h1>
        <p>${ui.generatedOnLabel}: ${generatedAt}</p>
      </header>
      ${cards}
    </body>
  </html>`
}

const downloadTextFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const createEmptyHotel = () => ({
  id: `hotel-${Date.now()}`,
  name: '',
  contactName: '',
  contactEmail: '',
  singleRooms: 0,
  doubleRooms: 0,
})

function Admin({
  adminUser,
  catalog,
  firebaseEnabled,
  hotelSettings,
  language,
  onLogin,
  onLogout,
  onSaveCatalog,
  onSaveHotelSettings,
  onUpdateRegistration,
  registrations,
  t,
}) {
  const ui =
    language === 'fr'
      ? {
          tabs: {
            definitions: 'Package definitions',
            registrations: 'Registrations',
            finance: 'Financial overview',
            hotels: 'Hotels',
          },
          packageDefinitionsTitle: 'Package definitions',
          packageDefinitionsCopy:
            'Gerez ici les pages, packages et options tarifaires utilises dans le flux d inscription.',
          registrationsTitle: 'Registrations',
          registrationsCopy:
            'Consultez toutes les inscriptions avec filtres par colonne et suivi du paiement.',
          financeTitle: 'Financial overview',
          financeCopy:
            'Suivez les montants et exportez des justificatifs de paiement pour les transactions selectionnees.',
          hotelsTitle: 'Hotel management',
          hotelsCopy:
            'Configurez les hotels, le stock de chambres et affectez les participants aux chambres disponibles.',
          filterPlaceholder: 'Filter',
          clearFilters: 'Effacer les filtres',
          registeredAt: 'Registered at',
          paidAt: 'Paid at',
          paymentStatus: 'Payment status',
          paymentAmount: 'Paid amount',
          participantName: 'Participant',
          participantEmail: 'Email',
          country: 'Country',
          federation: 'Federation',
          role: 'Role',
          page: 'Page',
          packageLabel: 'Package',
          referenceLabel: 'Reference',
          statusAll: 'All',
          pendingLabel: 'Pending',
          paidLabel: 'Paid',
          selectedTransactions: 'Selected transactions',
          selectAll: 'Select all',
          downloadProofs: 'Download payment proofs',
          downloadCsv: 'Download CSV',
          totalCollected: 'Collected',
          totalBooked: 'Booked',
          totalPending: 'Pending',
          paidTransactions: 'Paid transactions',
          paymentProofTitle: 'Payment proofs',
          paymentProof: 'Payment proof',
          generatedOnLabel: 'Generated on',
          paymentStatusLabel: 'Payment status',
          packageTitleLabel: 'Package',
          registeredLabel: 'Registered',
          addonsLabel: 'Add-ons',
          hotelInventory: 'Hotel inventory',
          addHotel: 'Add hotel',
          saveHotels: 'Save hotels',
          hotelName: 'Hotel name',
          contactName: 'Contact name',
          contactEmail: 'Contact email',
          singleRooms: 'Single rooms',
          doubleRooms: 'Double rooms',
          roomsLeft: 'Rooms left',
          assignments: 'Assignments',
          roomType: 'Room type',
          roomLabel: 'Room / note',
          noHotelNeeded: 'No hotel add-on',
          notAssigned: 'Not assigned',
          assignHotel: 'Assign hotel',
          communicateHotel: 'Contact hotel',
          communicateParticipant: 'Contact participant',
          hotelSaved: 'Hotel settings saved.',
          saveFailed: 'Unable to save.',
          noRegistrations: 'No registrations yet.',
          singleLabel: 'Single',
          doubleLabel: 'Double',
          amountTaken: 'Amount taken',
        }
      : {
          tabs: {
            definitions: 'Package Definitions',
            registrations: 'Registrations',
            finance: 'Financial Overview',
            hotels: 'Hotels',
          },
          packageDefinitionsTitle: 'Package Definitions',
          packageDefinitionsCopy:
            'Manage the page definitions, package setup, and add-on pricing used by the registration flow.',
          registrationsTitle: 'Registrations',
          registrationsCopy:
            'Review all registrations with column filters and live payment follow-up.',
          financeTitle: 'Financial Overview',
          financeCopy:
            'Track amounts collected and export payment proofs for the selected transactions.',
          hotelsTitle: 'Hotel Management',
          hotelsCopy:
            'Configure hotels, room inventory, and participant room assignments in one place.',
          filterPlaceholder: 'Filter',
          clearFilters: 'Clear filters',
          registeredAt: 'Registered at',
          paidAt: 'Paid at',
          paymentStatus: 'Payment status',
          paymentAmount: 'Paid amount',
          participantName: 'Participant',
          participantEmail: 'Email',
          country: 'Country',
          federation: 'Federation',
          role: 'Role',
          page: 'Page',
          packageLabel: 'Package',
          referenceLabel: 'Reference',
          statusAll: 'All',
          pendingLabel: 'Pending',
          paidLabel: 'Paid',
          selectedTransactions: 'Selected transactions',
          selectAll: 'Select all',
          downloadProofs: 'Download payment proofs',
          downloadCsv: 'Download CSV',
          totalCollected: 'Collected',
          totalBooked: 'Booked',
          totalPending: 'Pending',
          paidTransactions: 'Paid transactions',
          paymentProofTitle: 'Payment proofs',
          paymentProof: 'Payment proof',
          generatedOnLabel: 'Generated on',
          paymentStatusLabel: 'Payment status',
          packageTitleLabel: 'Package',
          registeredLabel: 'Registered',
          addonsLabel: 'Add-ons',
          hotelInventory: 'Hotel inventory',
          addHotel: 'Add hotel',
          saveHotels: 'Save hotels',
          hotelName: 'Hotel name',
          contactName: 'Contact name',
          contactEmail: 'Contact email',
          singleRooms: 'Single rooms',
          doubleRooms: 'Double rooms',
          roomsLeft: 'Rooms left',
          assignments: 'Assignments',
          roomType: 'Room type',
          roomLabel: 'Room / note',
          noHotelNeeded: 'No hotel add-on',
          notAssigned: 'Not assigned',
          assignHotel: 'Assign hotel',
          communicateHotel: 'Contact hotel',
          communicateParticipant: 'Contact participant',
          hotelSaved: 'Hotel settings saved.',
          saveFailed: 'Unable to save.',
          noRegistrations: 'No registrations yet.',
          singleLabel: 'Single',
          doubleLabel: 'Double',
          amountTaken: 'Amount taken',
        }

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [catalogDraft, setCatalogDraft] = useState(catalog)
  const [hotelDraft, setHotelDraft] = useState(hotelSettings)
  const [saveMessage, setSaveMessage] = useState('')
  const [hotelSaveMessage, setHotelSaveMessage] = useState('')
  const [activeTab, setActiveTab] = useState('definitions')
  const [selectedRegistrationKey, setSelectedRegistrationKey] = useState('')
  const [selectedFinanceIds, setSelectedFinanceIds] = useState([])
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    country: '',
    federation: '',
    role: '',
    gender: '',
    page: '',
    packageName: '',
    paymentStatus: '',
    bookingReference: '',
  })

  useEffect(() => {
    setCatalogDraft(catalog)
  }, [catalog])

  useEffect(() => {
    setHotelDraft(hotelSettings)
  }, [hotelSettings])

  useEffect(() => {
    if (!selectedRegistrationKey && registrations[0]?.id) {
      setSelectedRegistrationKey(`${registrations[0].id}-0`)
    }
  }, [registrations, selectedRegistrationKey])

  const adminRegistrations = useMemo(
    () =>
      registrations.map((registration) => {
        const primary = getPrimaryParticipant(registration)
        return {
          ...registration,
          primary,
          participantName: [primary.firstName, primary.lastName].filter(Boolean).join(' ').trim(),
          participantEmail: primary.email || '',
          countryLabel: getCountryLabel(primary.country, language),
          federationLabel: getFederationLabel(primary.memberFederation, language),
          roleLabel: getRoleLabel(primary.role, language),
          registeredAtLabel: formatTimestamp(registration.createdAt, language),
          paidAtLabel: formatTimestamp(
            registration.paidAt || registration.updatedAt,
            language,
          ),
          totalAmountNumber: parseAmount(registration.totalAmount),
        }
      }),
    [language, registrations],
  )

  const participantRows = useMemo(
    () =>
      adminRegistrations.flatMap((registration) => {
        const participants =
          registration.participants?.length ? registration.participants : [registration.primary]

        return participants.map((participant, index) => ({
          key: `${registration.id}-${index}`,
          registration,
          registrationId: registration.id,
          bookingReference: registration.bookingReference || registration.id,
          participantIndex: index,
          participantName: [participant.firstName, participant.lastName]
            .filter(Boolean)
            .join(' ')
            .trim(),
          participantEmail: participant.email || '',
          countryLabel: getCountryLabel(participant.country, language),
          federationLabel: getFederationLabel(participant.memberFederation, language),
          roleLabel: getRoleLabel(participant.role, language),
          genderLabel: participant.gender || '',
          variantName: registration.variantName,
          packageName: registration.packageName,
          paymentStatus: registration.paymentStatus,
          totalAmountNumber: registration.totalAmountNumber,
          registeredAtLabel: registration.registeredAtLabel,
          paidAtLabel: registration.paidAtLabel,
        }))
      }),
    [adminRegistrations, language],
  )

  const filteredRegistrations = useMemo(
    () =>
      participantRows.filter((item) =>
        Object.entries(filters).every(([key, rawValue]) => {
          const value = String(rawValue || '').trim().toLowerCase()
          if (!value) {
            return true
          }

          const haystackMap = {
            name: item.participantName,
            email: item.participantEmail,
            country: item.countryLabel,
            federation: item.federationLabel,
            role: item.roleLabel,
            gender: item.genderLabel,
            page: item.variantName,
            packageName: item.packageName,
            paymentStatus: item.paymentStatus,
            bookingReference: item.bookingReference,
          }

          return String(haystackMap[key] || '')
            .toLowerCase()
            .includes(value)
        }),
      ),
    [filters, participantRows],
  )

  const selectedRegistrationRow = useMemo(
    () =>
      filteredRegistrations.find((item) => item.key === selectedRegistrationKey) ||
      filteredRegistrations[0] ||
      null,
    [filteredRegistrations, selectedRegistrationKey],
  )

  const selectedRegistration = selectedRegistrationRow?.registration || null

  const paidRegistrations = useMemo(
    () =>
      adminRegistrations.filter((item) =>
        item.paymentConfirmed ? true : isPaidStatus(item.paymentStatus),
      ),
    [adminRegistrations],
  )

  const totalCollected = useMemo(
    () => paidRegistrations.reduce((sum, item) => sum + item.totalAmountNumber, 0),
    [paidRegistrations],
  )

  const totalBooked = useMemo(
    () => adminRegistrations.reduce((sum, item) => sum + item.totalAmountNumber, 0),
    [adminRegistrations],
  )

  const totalPending = totalBooked - totalCollected

  const selectedFinanceRegistrations = useMemo(
    () =>
      adminRegistrations.filter((item) =>
        selectedFinanceIds.length
          ? selectedFinanceIds.includes(item.id)
          : item.paymentConfirmed || isPaidStatus(item.paymentStatus),
      ),
    [adminRegistrations, selectedFinanceIds],
  )

  const hotelAssignments = useMemo(
    () =>
      adminRegistrations.filter(
        (item) =>
          registrationNeedsHotel(item) &&
          (item.paymentConfirmed || isPaidStatus(item.paymentStatus)),
      ),
    [adminRegistrations],
  )

  const hotelStats = useMemo(() => {
    const hotels = hotelDraft?.hotels || []

    return hotels.map((hotel) => {
      const assignedSingles = adminRegistrations.filter(
        (item) => item.hotelId === hotel.id && item.roomType === 'single',
      ).length
      const assignedDoubles = adminRegistrations.filter(
        (item) => item.hotelId === hotel.id && item.roomType === 'double',
      ).length

      return {
        ...hotel,
        assignedSingles,
        assignedDoubles,
        singleRemaining: Number(hotel.singleRooms || 0) - assignedSingles,
        doubleRemaining: Number(hotel.doubleRooms || 0) - assignedDoubles,
      }
    })
  }, [adminRegistrations, hotelDraft])

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
        [packageType]: (current.addonsByPackage?.[packageType] || []).map((item) =>
          item.id === addonId
            ? { ...item, [key]: key === 'price' ? Number(value) : value }
            : item,
        ),
      },
    }))
  }

  const updateHotelDraft = (hotelId, key, value) => {
    setHotelDraft((current) => ({
      ...current,
      hotels: (current.hotels || []).map((hotel) =>
        hotel.id === hotelId
          ? {
              ...hotel,
              [key]:
                key === 'singleRooms' || key === 'doubleRooms'
                  ? Number(value)
                  : value,
            }
          : hotel,
      ),
    }))
  }

  const addHotel = () => {
    setHotelDraft((current) => ({
      ...current,
      hotels: [...(current.hotels || []), createEmptyHotel()],
    }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginError('')

    try {
      await onLogin(email, password)
      setPassword('')
    } catch (error) {
      setLoginError(error.message || t.admin.loginError)
    }
  }

  const handleSaveCatalog = async () => {
    try {
      await onSaveCatalog(catalogDraft)
      setSaveMessage(t.admin.catalogSaved)
    } catch (error) {
      setSaveMessage(error.message || t.admin.catalogSaveFailed)
    }
  }

  const handleSaveHotels = async () => {
    try {
      await onSaveHotelSettings(hotelDraft)
      setHotelSaveMessage(ui.hotelSaved)
    } catch (error) {
      setHotelSaveMessage(error.message || ui.saveFailed)
    }
  }

  const handleRegistrationChange = async (registrationId, field, value) => {
    await onUpdateRegistration(registrationId, { [field]: value })
  }

  const handleDownloadProofs = () => {
    if (!selectedFinanceRegistrations.length) {
      return
    }

    const markup = buildPaymentProofMarkup(
      selectedFinanceRegistrations,
      language,
      ui,
    )
    downloadTextFile('payment-proofs.html', markup, 'text/html;charset=utf-8')
  }

  const handleDownloadTransactionsCsv = () => {
    const rows = [
      [
        ui.referenceLabel,
        ui.participantName,
        ui.participantEmail,
        ui.page,
        ui.packageLabel,
        ui.paymentStatus,
        ui.amountTaken,
        ui.registeredAt,
        ui.paidAt,
      ],
      ...selectedFinanceRegistrations.map((item) => [
        item.bookingReference || item.id,
        item.participantName,
        item.participantEmail,
        item.variantName || '',
        item.packageName || '',
        item.paymentStatus || '',
        item.totalAmountNumber.toFixed(2),
        item.registeredAtLabel,
        item.paidAtLabel,
      ]),
    ]

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value || '').replaceAll('"', '""')}"`)
          .join(','),
      )
      .join('\n')

    downloadTextFile('transactions.csv', csv, 'text/csv;charset=utf-8')
  }

  if (!firebaseEnabled) {
    return (
      <div className="page">
        <section className="shell-section admin-blank">
          <h1 className="checkout-title">{t.admin.firebaseMissingTitle}</h1>
          <p className="checkout-copy">{t.admin.firebaseMissingCopy}</p>
        </section>
      </div>
    )
  }

  if (!adminUser) {
    return (
      <div className="page">
        <section className="shell-section admin-auth-card">
          <h1 className="checkout-title">{t.admin.signInTitle}</h1>
          <form className="admin-login-form" onSubmit={handleLogin}>
            <label className="field">
              <span>{t.admin.email}</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="field">
              <span>{t.admin.password}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {loginError ? <div className="error-box">{loginError}</div> : null}
            <button className="button button--primary" type="submit">
              {t.admin.signIn}
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
            <span className="section-chip">{t.admin.liveAdmin}</span>
            <h1 className="checkout-title">{t.admin.registrationsAndPricing}</h1>
            <p className="checkout-copy">
              {t.admin.signedInAs.replace('{email}', adminUser.email)}
            </p>
          </div>
          <button className="button button--ghost" onClick={onLogout}>
            {t.admin.signOut}
          </button>
        </div>

        <div className="admin-tabs">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab}
              className={`admin-tab ${activeTab === tab ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab)}
              type="button"
            >
              {ui.tabs[tab]}
            </button>
          ))}
        </div>

        {activeTab === 'definitions' ? (
          <div className="admin-layout admin-layout--single">
            <div className="admin-panel">
              <div className="admin-panel__top">
                <div>
                  <h2>{ui.packageDefinitionsTitle}</h2>
                  <p className="checkout-copy">{ui.packageDefinitionsCopy}</p>
                </div>
                <button className="button button--primary" onClick={handleSaveCatalog}>
                  {t.admin.savePrices}
                </button>
              </div>
              {saveMessage ? <p className="admin-status">{saveMessage}</p> : null}

              <div className="admin-subsection">
                <h3>{t.admin.basePages}</h3>
                {catalogDraft.variants.map((item, index) => (
                  <div className="admin-editor-card" key={item.id}>
                    <label className="field">
                      <span>{t.admin.pageLabel}</span>
                      <input
                        value={item.pageLabel}
                        onChange={(event) =>
                          updateVariantField(index, 'pageLabel', event.target.value)
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{t.admin.title}</span>
                      <input
                        value={item.title}
                        onChange={(event) =>
                          updateVariantField(index, 'title', event.target.value)
                        }
                      />
                    </label>
                    <label className="field field--full">
                      <span>{t.admin.description}</span>
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
                          <span>{t.admin.packageName}</span>
                          <input
                            value={option.name}
                            onChange={(event) =>
                              updatePackageOption(index, option.id, 'name', event.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{t.admin.conferencePrice}</span>
                          <input
                            type="number"
                            value={option.price}
                            onChange={(event) =>
                              updatePackageOption(index, option.id, 'price', event.target.value)
                            }
                          />
                        </label>
                        <label className="field field--full">
                          <span>{t.admin.packageDescription}</span>
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
                <h3>{t.admin.addons}</h3>
                {Object.entries(catalogDraft.addonsByPackage || {}).map(
                  ([packageType, addons]) => (
                    <div className="admin-editor-card" key={packageType}>
                      <h4>
                        {packageType === 'double'
                          ? t.admin.basePackageDouble
                          : t.admin.basePackageSingle}
                      </h4>
                      {addons.map((item) => (
                        <div className="admin-editor-card" key={`${packageType}-${item.id}`}>
                          <label className="field">
                            <span>{t.admin.name}</span>
                            <input
                              value={item.name}
                              onChange={(event) =>
                                updateAddon(packageType, item.id, 'name', event.target.value)
                              }
                            />
                          </label>
                          <label className="field">
                            <span>{t.admin.price}</span>
                            <input
                              type="number"
                              value={item.price}
                              onChange={(event) =>
                                updateAddon(packageType, item.id, 'price', event.target.value)
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
          </div>
        ) : null}

        {activeTab === 'registrations' ? (
          <div className="admin-layout admin-layout--single">
            <div className="admin-panel">
              <div className="admin-panel__top">
                <div>
                  <h2>{ui.registrationsTitle}</h2>
                  <p className="checkout-copy">{ui.registrationsCopy}</p>
                </div>
                <button
                  className="button button--ghost"
                  onClick={() =>
                    setFilters({
                      name: '',
                      email: '',
                      country: '',
                      federation: '',
                      role: '',
                      gender: '',
                      page: '',
                      packageName: '',
                      paymentStatus: '',
                      bookingReference: '',
                    })
                  }
                >
                  {ui.clearFilters}
                </button>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{ui.participantName}</th>
                      <th>{ui.participantEmail}</th>
                      <th>{ui.country}</th>
                      <th>{ui.federation}</th>
                      <th>{ui.role}</th>
                      <th>Gender</th>
                      <th>{ui.page}</th>
                      <th>{ui.packageLabel}</th>
                      <th>{ui.referenceLabel}</th>
                      <th>{ui.paymentStatus}</th>
                      <th>{ui.paymentAmount}</th>
                      <th>{ui.registeredAt}</th>
                      <th>{ui.paidAt}</th>
                    </tr>
                    <tr className="admin-table__filters">
                      {[
                        'name',
                        'email',
                        'country',
                        'federation',
                        'role',
                        'gender',
                        'page',
                        'packageName',
                        'bookingReference',
                        'paymentStatus',
                      ].map((key) => (
                        <th key={key}>
                          <input
                            value={filters[key]}
                            onChange={(event) =>
                              setFilters((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            placeholder={ui.filterPlaceholder}
                          />
                        </th>
                      ))}
                      <th />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((item) => (
                      <tr
                        key={item.key}
                        className={selectedRegistrationRow?.key === item.key ? 'is-active' : ''}
                        onClick={() => setSelectedRegistrationKey(item.key)}
                      >
                        <td>{item.participantName || '—'}</td>
                        <td>{item.participantEmail || '—'}</td>
                        <td>{item.countryLabel || '—'}</td>
                        <td>{item.federationLabel || '—'}</td>
                        <td>{item.roleLabel || '—'}</td>
                        <td>{item.genderLabel || '—'}</td>
                        <td>{item.variantName || '—'}</td>
                        <td>{item.packageName || '—'}</td>
                        <td>{item.bookingReference || item.id}</td>
                        <td>{item.paymentStatus || ui.pendingLabel}</td>
                        <td>EUR {item.totalAmountNumber.toFixed(2)}</td>
                        <td>{item.registeredAtLabel}</td>
                        <td>{item.paidAtLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedRegistration ? (
                <div className="registration-detail registration-detail--admin">
                  <h3>{selectedRegistrationRow?.participantName || '—'}</h3>
                  <div className="admin-kpi-grid">
                    <p>{selectedRegistrationRow?.participantEmail || '—'}</p>
                    <p>{ui.referenceLabel}: {selectedRegistration.bookingReference}</p>
                    <p>{ui.paymentStatus}: {selectedRegistration.paymentStatus || ui.pendingLabel}</p>
                    <p>EUR {selectedRegistration.totalAmountNumber.toFixed(2)}</p>
                  </div>

                  {selectedRegistration.participants?.length ? (
                    <div className="admin-subsection">
                      <h3>{t.admin.participants}</h3>
                      {selectedRegistration.participants.map((participant, index) => (
                        <div className="admin-editor-card" key={`${selectedRegistration.id}-${index}`}>
                          <strong>{t.admin.participantIndexed.replace('{index}', index + 1)}</strong>
                          <p>{participant.firstName} {participant.lastName}</p>
                          <p>{participant.email}</p>
                          <p>{getCountryLabel(participant.country, language)}</p>
                          <p>{getFederationLabel(participant.memberFederation, language)}</p>
                          <p>{getRoleLabel(participant.role, language)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="form-grid">
                    <label className="field">
                      <span>{t.admin.hotelRoom}</span>
                      <input
                        defaultValue={selectedRegistration.hotelRoom || ''}
                        onBlur={(event) =>
                          handleRegistrationChange(
                            selectedRegistration.id,
                            'hotelRoom',
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label className="field">
                      <span>{ui.paymentStatus}</span>
                      <input
                        defaultValue={selectedRegistration.paymentStatus || ''}
                        onBlur={(event) =>
                          handleRegistrationChange(
                            selectedRegistration.id,
                            'paymentStatus',
                            event.target.value,
                          )
                        }
                      />
                    </label>
                    <label className="field field--full">
                      <span>{t.admin.adminNotes}</span>
                      <textarea
                        defaultValue={selectedRegistration.adminNotes || ''}
                        onBlur={(event) =>
                          handleRegistrationChange(
                            selectedRegistration.id,
                            'adminNotes',
                            event.target.value,
                          )
                        }
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <p className="checkout-copy">{ui.noRegistrations}</p>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'finance' ? (
          <div className="admin-layout admin-layout--single">
            <div className="admin-panel">
              <div className="admin-panel__top">
                <div>
                  <h2>{ui.financeTitle}</h2>
                  <p className="checkout-copy">{ui.financeCopy}</p>
                </div>
                <div className="cta-row">
                  <button className="button button--ghost" onClick={handleDownloadTransactionsCsv}>
                    {ui.downloadCsv}
                  </button>
                  <button className="button button--primary" onClick={handleDownloadProofs}>
                    {ui.downloadProofs}
                  </button>
                </div>
              </div>

              <div className="admin-kpi-grid admin-kpi-grid--cards">
                <div className="admin-kpi-card">
                  <span>{ui.totalCollected}</span>
                  <strong>EUR {totalCollected.toFixed(2)}</strong>
                </div>
                <div className="admin-kpi-card">
                  <span>{ui.totalBooked}</span>
                  <strong>EUR {totalBooked.toFixed(2)}</strong>
                </div>
                <div className="admin-kpi-card">
                  <span>{ui.totalPending}</span>
                  <strong>EUR {totalPending.toFixed(2)}</strong>
                </div>
                <div className="admin-kpi-card">
                  <span>{ui.paidTransactions}</span>
                  <strong>{paidRegistrations.length}</strong>
                </div>
              </div>

              <div className="admin-panel__top">
                <h3>{ui.selectedTransactions}</h3>
                <label className="admin-inline-check">
                  <input
                    type="checkbox"
                    checked={
                      !!adminRegistrations.length &&
                      selectedFinanceIds.length === adminRegistrations.length
                    }
                    onChange={(event) =>
                      setSelectedFinanceIds(
                        event.target.checked ? adminRegistrations.map((item) => item.id) : [],
                      )
                    }
                  />
                  <span>{ui.selectAll}</span>
                </label>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th />
                      <th>{ui.referenceLabel}</th>
                      <th>{ui.participantName}</th>
                      <th>{ui.paymentStatus}</th>
                      <th>{ui.amountTaken}</th>
                      <th>{ui.paidAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminRegistrations.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedFinanceIds.includes(item.id)}
                            onChange={(event) =>
                              setSelectedFinanceIds((current) =>
                                event.target.checked
                                  ? [...current, item.id]
                                  : current.filter((id) => id !== item.id),
                              )
                            }
                          />
                        </td>
                        <td>{item.bookingReference || item.id}</td>
                        <td>{item.participantName || '—'}</td>
                        <td>{item.paymentStatus || ui.pendingLabel}</td>
                        <td>EUR {item.totalAmountNumber.toFixed(2)}</td>
                        <td>{item.paidAtLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'hotels' ? (
          <div className="admin-layout">
            <div className="admin-panel">
              <div className="admin-panel__top">
                <div>
                  <h2>{ui.hotelsTitle}</h2>
                  <p className="checkout-copy">{ui.hotelsCopy}</p>
                </div>
                <div className="cta-row">
                  <button className="button button--ghost" onClick={addHotel}>
                    {ui.addHotel}
                  </button>
                  <button className="button button--primary" onClick={handleSaveHotels}>
                    {ui.saveHotels}
                  </button>
                </div>
              </div>
              {hotelSaveMessage ? <p className="admin-status">{hotelSaveMessage}</p> : null}

              <div className="admin-subsection">
                <h3>{ui.hotelInventory}</h3>
                {(hotelDraft?.hotels || []).map((hotel) => {
                  const stats =
                    hotelStats.find((item) => item.id === hotel.id) || hotel

                  return (
                    <div className="admin-editor-card" key={hotel.id}>
                      <div className="form-grid">
                        <label className="field">
                          <span>{ui.hotelName}</span>
                          <input
                            value={hotel.name}
                            onChange={(event) =>
                              updateHotelDraft(hotel.id, 'name', event.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{ui.contactName}</span>
                          <input
                            value={hotel.contactName}
                            onChange={(event) =>
                              updateHotelDraft(hotel.id, 'contactName', event.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{ui.contactEmail}</span>
                          <input
                            value={hotel.contactEmail}
                            onChange={(event) =>
                              updateHotelDraft(hotel.id, 'contactEmail', event.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{ui.singleRooms}</span>
                          <input
                            type="number"
                            value={hotel.singleRooms}
                            onChange={(event) =>
                              updateHotelDraft(hotel.id, 'singleRooms', event.target.value)
                            }
                          />
                        </label>
                        <label className="field">
                          <span>{ui.doubleRooms}</span>
                          <input
                            type="number"
                            value={hotel.doubleRooms}
                            onChange={(event) =>
                              updateHotelDraft(hotel.id, 'doubleRooms', event.target.value)
                            }
                          />
                        </label>
                      </div>
                      <div className="admin-kpi-grid">
                        <p>{ui.roomsLeft}: {ui.singleLabel} {stats.singleRemaining ?? 0}</p>
                        <p>{ui.roomsLeft}: {ui.doubleLabel} {stats.doubleRemaining ?? 0}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="admin-panel">
              <div className="admin-panel__top">
                <h2>{ui.assignments}</h2>
                <span className="admin-status">
                  {t.admin.records.replace('{count}', hotelAssignments.length)}
                </span>
              </div>

              <div className="registration-list registration-list--plain">
                {hotelAssignments.map((item) => (
                  <div className="admin-editor-card" key={item.id}>
                    <strong>{item.participantName || '—'}</strong>
                    <p>{item.participantEmail || '—'}</p>
                    <p>{item.packageName || '—'}</p>
                    <div className="form-grid">
                      <label className="field">
                        <span>{ui.assignHotel}</span>
                        <select
                          value={item.hotelId || ''}
                          onChange={(event) =>
                            handleRegistrationChange(item.id, 'hotelId', event.target.value)
                          }
                        >
                          <option value="">{ui.notAssigned}</option>
                          {(hotelDraft?.hotels || []).map((hotel) => (
                            <option key={hotel.id} value={hotel.id}>
                              {hotel.name || hotel.id}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span>{ui.roomType}</span>
                        <select
                          value={item.roomType || ''}
                          onChange={(event) =>
                            handleRegistrationChange(item.id, 'roomType', event.target.value)
                          }
                        >
                          <option value="">{ui.notAssigned}</option>
                          <option value="single">{ui.singleLabel}</option>
                          <option value="double">{ui.doubleLabel}</option>
                        </select>
                      </label>
                      <label className="field field--full">
                        <span>{ui.roomLabel}</span>
                        <input
                          defaultValue={item.hotelRoom || ''}
                          onBlur={(event) =>
                            handleRegistrationChange(item.id, 'hotelRoom', event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <div className="cta-row">
                      {item.hotelId ? (
                        <a
                          className="text-link"
                          href={`mailto:${(hotelDraft?.hotels || []).find((hotel) => hotel.id === item.hotelId)?.contactEmail || ''}`}
                        >
                          {ui.communicateHotel}
                        </a>
                      ) : (
                        <span className="checkout-copy">{ui.noHotelNeeded}</span>
                      )}
                      {item.participantEmail ? (
                        <a className="text-link" href={`mailto:${item.participantEmail}`}>
                          {ui.communicateParticipant}
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default Admin
