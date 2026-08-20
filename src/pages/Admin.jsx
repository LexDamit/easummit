import { useEffect, useMemo, useState } from 'react'
import {
  getCountryFlag,
  getCountryOptions,
  getCountryLabel,
  getFederationOptions,
  getFederationLabel,
  getRoleOptions,
  getRoleLabel,
} from '../data/participantOptions'

const ADMIN_TABS = ['definitions', 'registrations', 'finance', 'hotels']

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

const isInvitedStatus = (value) => {
  const status = String(value || '').toLowerCase()
  return (
    status.includes('invite') ||
    status.includes('guest') ||
    status.includes('complimentary')
  )
}

const isAttendanceConfirmed = (registration) =>
  registration?.orderStatus === 'confirmed' ||
  Boolean(registration?.paymentConfirmed) ||
  isPaidStatus(registration?.paymentStatus) ||
  isInvitedStatus(registration?.paymentStatus)

const parseAmount = (value) => Number(value || 0)

const getPaymentTone = (value) => {
  const status = String(value || '').toLowerCase()

  if (
    status.includes('paid') ||
    status.includes('success') ||
    status.includes('complete') ||
    status.includes('confirmed') ||
    status.includes('settled') ||
    status.includes('free') ||
    isInvitedStatus(status)
  ) {
    return 'paid'
  }

  if (status.includes('cancel') || status.includes('expired')) {
    return 'cancelled'
  }

  if (status.includes('fail') || status.includes('declin') || status.includes('error')) {
    return 'failed'
  }

  return 'pending'
}

const toTitleCase = (value) =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

const getPaymentStatusDisplay = (registration, ui) => {
  if (isAttendanceConfirmed(registration)) {
    return ui.validLabel
  }

  const tone = getPaymentTone(registration?.paymentStatus)

  if (tone === 'pending') {
    return ui.pendingLabel
  }

  if (tone === 'failed') {
    return ui.failedLabel
  }

  if (tone === 'cancelled') {
    return ui.cancelledLabel
  }

  return toTitleCase(registration?.paymentStatus) || ui.pendingLabel
}

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

const formatAddonSummary = (addons = []) => {
  if (!addons.length) {
    return ''
  }

  return addons
    .map((item) =>
      [item.name, item.price ? `EUR ${parseAmount(item.price).toFixed(2)}` : '']
        .filter(Boolean)
        .join(' - '),
    )
    .join(' • ')
}

const formatAddonLine = (addon) =>
  [addon?.name, addon?.price ? `EUR ${parseAmount(addon.price).toFixed(2)}` : '']
    .filter(Boolean)
    .join(' - ')

const getRegistrationOptionItems = (registration, ui) => {
  const optionItems = []

  if (registration?.baseItem?.name) {
    optionItems.push({
      id: 'base-item',
      name: registration.baseItem.name,
      price: parseAmount(registration.baseItem.price),
      isBase: true,
      label: ui.baseIncludedLabel,
    })
  }

  return [...optionItems, ...(registration?.addons || [])]
}

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
            <p><strong>${ui.paymentStatusLabel}:</strong> ${getPaymentStatusDisplay(registration, ui)}</p>
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
  onCreateManualRegistration,
  onDeleteRegistration,
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
          validLabel: 'Valide',
          pendingLabel: 'Pending',
          failedLabel: 'Failed',
          cancelledLabel: 'Cancelled',
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
          profileColumn: 'Profil',
          registrationColumn: 'Reservation',
          noAddonsSelected: 'Aucune option selectionnee',
          selectedOptions: 'Options choisies',
          baseIncludedLabel: 'Base',
          attendanceColumn: 'Presence',
          timelineColumn: 'Suivi',
          totalAttendees: 'Participants',
          readyToAttend: 'Prets a participer',
          awaitingPayment: 'Paiement en attente',
          hotelFollowUp: 'Hotel a suivre',
          sharedBookings: 'Reservations a 2',
          readyBadge: 'Confirme',
          pendingBadge: 'En attente',
          hotelBadge: 'Hotel',
          oneParticipant: '1 participant',
          multipleParticipants: '{count} participants',
          paidOnLabel: 'Paye',
          quickAll: 'Tous',
          quickReady: 'Confirmes',
          quickPending: 'En attente',
          quickHotel: 'Hotel',
          quickShared: 'A 2',
          countryOverview: 'Vue par pays',
          countryOverviewCopy:
            'Repartition des participants selon la selection et les filtres actifs.',
          countryParticipants: '{count} participants',
          countryParticipantsSingle: '{count} participant',
          noCountries: 'Aucun pays dans cette selection.',
          actionsLabel: 'Actions',
          deleteShort: 'Supprimer',
          detailsLabel: 'Details',
          profileSummaryLabel: 'Profil',
          registrationSummaryLabel: 'Options',
          addManualRegistration: 'Ajouter une inscription manuelle',
          hideManualRegistration: 'Masquer le formulaire',
          manualRegistrationTitle: 'Inscription manuelle',
          manualRegistrationCopy:
            "Ajoutez ici les participants inscrits par un autre canal pour qu'ils apparaissent dans le meme suivi.",
          createManualRegistration: "Creer l'inscription",
          manualRegistrationSaved: 'Inscription manuelle ajoutee.',
          manualRegistrationFailed: "Impossible d'ajouter l'inscription.",
          manualSourceLabel: 'Source externe / note',
          categoryLabel: 'Categorie',
          packageTypeLabel: 'Type de package',
          addonSelectionLabel: 'Options choisies',
          participantDetailsLabel: 'Informations participants',
          paymentStateLabel: 'Statut de paiement',
          selectPackage: 'Choisir un package',
          manualPaid: 'Paye',
          manualPending: 'En attente',
          manualInvited: 'Invite',
          markAsPaid: 'Marquer comme paye',
          markAsPending: 'Remettre en attente',
          markAsInvited: 'Marquer comme invite',
          removePackage: 'Supprimer le package',
          removePackageConfirm:
            'Voulez-vous vraiment supprimer ce package ? Cette action sera enregistree a la prochaine sauvegarde.',
          removeLastPackageBlocked:
            'Au moins un package doit rester disponible sur cette page.',
          deleteRegistration: "Supprimer l'inscription",
          deleteRegistrationConfirm:
            "Voulez-vous vraiment supprimer cette inscription ? Cette action est definitive.",
          deleteRegistrationFailed: "Impossible de supprimer l'inscription.",
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
          validLabel: 'Valid',
          pendingLabel: 'Pending',
          failedLabel: 'Failed',
          cancelledLabel: 'Cancelled',
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
          profileColumn: 'Profile',
          registrationColumn: 'Registration',
          noAddonsSelected: 'No add-ons selected',
          selectedOptions: 'Selected options',
          baseIncludedLabel: 'Base',
          attendanceColumn: 'Attendance',
          timelineColumn: 'Timeline',
          totalAttendees: 'Participants',
          readyToAttend: 'Ready to attend',
          awaitingPayment: 'Awaiting payment',
          hotelFollowUp: 'Hotel follow-up',
          sharedBookings: '2-person bookings',
          readyBadge: 'Confirmed',
          pendingBadge: 'Pending',
          hotelBadge: 'Hotel',
          oneParticipant: '1 participant',
          multipleParticipants: '{count} participants',
          paidOnLabel: 'Paid',
          quickAll: 'All',
          quickReady: 'Confirmed',
          quickPending: 'Pending',
          quickHotel: 'Hotel',
          quickShared: '2 people',
          countryOverview: 'Country overview',
          countryOverviewCopy:
            'Participant distribution for the current selection and active filters.',
          countryParticipants: '{count} participants',
          countryParticipantsSingle: '{count} participant',
          noCountries: 'No countries in this selection.',
          actionsLabel: 'Actions',
          deleteShort: 'Delete',
          detailsLabel: 'Details',
          profileSummaryLabel: 'Profile',
          registrationSummaryLabel: 'Options',
          addManualRegistration: 'Add manual registration',
          hideManualRegistration: 'Hide form',
          manualRegistrationTitle: 'Manual registration',
          manualRegistrationCopy:
            'Add here participants who registered through another channel so they appear in the same live tracking.',
          createManualRegistration: 'Create registration',
          manualRegistrationSaved: 'Manual registration added.',
          manualRegistrationFailed: 'Unable to add manual registration.',
          manualSourceLabel: 'External source / note',
          categoryLabel: 'Category',
          packageTypeLabel: 'Package type',
          addonSelectionLabel: 'Selected add-ons',
          participantDetailsLabel: 'Participant details',
          paymentStateLabel: 'Payment status',
          selectPackage: 'Select a package',
          manualPaid: 'Paid',
          manualPending: 'Pending',
          manualInvited: 'Invited',
          markAsPaid: 'Mark as paid',
          markAsPending: 'Mark as pending',
          markAsInvited: 'Mark as invited',
          removePackage: 'Remove package',
          removePackageConfirm:
            'Do you really want to remove this package? This change will be saved the next time you save the catalog.',
          removeLastPackageBlocked:
            'At least one package must remain available on this page.',
          deleteRegistration: 'Delete registration',
          deleteRegistrationConfirm:
            'Do you really want to delete this registration? This action cannot be undone.',
          deleteRegistrationFailed: 'Unable to delete this registration.',
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
  const [registrationView, setRegistrationView] = useState('all')
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualSaveMessage, setManualSaveMessage] = useState('')
  const [manualErrors, setManualErrors] = useState({})
  const [isManualSaving, setIsManualSaving] = useState(false)
  const [manualRegistration, setManualRegistration] = useState({
    variantId: catalog?.variants?.[0]?.id || 'local',
    packageType: catalog?.variants?.[0]?.packageOptions?.[0]?.id || 'single',
    addonIds: [],
    paymentStatus: 'paid',
    adminNotes: '',
    participants: [{ ...initialParticipant }, { ...initialParticipant }],
  })
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    profile: '',
    registration: '',
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
    const firstVariant = catalog?.variants?.[0]
    if (!firstVariant) {
      return
    }

    setManualRegistration((current) => {
      const nextVariantId =
        catalog.variants.some((variant) => variant.id === current.variantId)
          ? current.variantId
          : firstVariant.id
      const variant = catalog.variants.find((item) => item.id === nextVariantId) || firstVariant
      const nextPackageType =
        variant.packageOptions?.some((option) => option.id === current.packageType)
          ? current.packageType
          : variant.packageOptions?.[0]?.id || 'single'

      return {
        ...current,
        variantId: nextVariantId,
        packageType: nextPackageType,
      }
    })
  }, [catalog])

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
          addonSummary: formatAddonSummary(registration.addons),
        }
      }),
    [language, registrations],
  )

  const variantOptions = useMemo(() => catalog?.variants || [], [catalog])
  const manualVariant =
    variantOptions.find((item) => item.id === manualRegistration.variantId) || variantOptions[0]
  const manualPackageOptions = manualVariant?.packageOptions || []
  const manualPackage =
    manualPackageOptions.find((item) => item.id === manualRegistration.packageType) ||
    manualPackageOptions[0]
  const manualParticipantCount = manualPackage?.participantCount || 1
  const countryOptions = useMemo(() => getCountryOptions(language), [language])
  const federationOptions = useMemo(() => getFederationOptions(language), [language])
  const roleOptions = useMemo(() => getRoleOptions(language), [language])
  const manualAddonOptions = useMemo(() => {
    const baseAddons = catalog?.addonsByPackage?.[manualRegistration.packageType] || []
    const variantAddons =
      catalog?.addonsByVariant?.[manualRegistration.variantId]?.[manualRegistration.packageType] || []

    return [...variantAddons, ...baseAddons]
  }, [catalog, manualRegistration.packageType, manualRegistration.variantId])

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
          countryCode: participant.country || '',
          countryLabel: getCountryLabel(participant.country, language),
          federationLabel: getFederationLabel(participant.memberFederation, language),
          roleLabel: getRoleLabel(participant.role, language),
          genderLabel: participant.gender || '',
          variantName: registration.variantName,
          packageName: registration.packageName,
          addonSummary: registration.addonSummary,
          selectedOptions: getRegistrationOptionItems(registration, ui),
          participantCount: participants.length,
          otherParticipants: participants
            .filter((_, participantIndex) => participantIndex !== index)
            .map((item) => [item.firstName, item.lastName].filter(Boolean).join(' ').trim())
            .filter(Boolean),
          isReady: isAttendanceConfirmed(registration),
          needsHotel: registrationNeedsHotel(registration),
          paymentTone: getPaymentTone(registration.paymentStatus),
          profileSummary: [
            getCountryLabel(participant.country, language),
            getFederationLabel(participant.memberFederation, language),
            getRoleLabel(participant.role, language),
            participant.gender || '',
          ]
            .filter(Boolean)
            .join(' • '),
          registrationSummary: [
            registration.variantName,
            registration.packageName,
            registration.addonSummary,
          ]
            .filter(Boolean)
            .join(' • '),
          paymentStatus: getPaymentStatusDisplay(registration, ui),
          paymentStatusRaw: registration.paymentStatus,
          totalAmountNumber: registration.totalAmountNumber,
          registeredAtLabel: registration.registeredAtLabel,
          paidAtLabel: registration.paidAtLabel,
        }))
      }),
    [adminRegistrations, language, ui],
  )

  const filteredRegistrations = useMemo(
    () =>
      participantRows
        .filter((item) => {
          if (registrationView === 'ready') {
            return item.isReady
          }

          if (registrationView === 'pending') {
            return !item.isReady
          }

          if (registrationView === 'hotel') {
            return item.needsHotel
          }

          if (registrationView === 'shared') {
            return item.participantCount > 1
          }

          return true
        })
        .filter((item) =>
          Object.entries(filters).every(([key, rawValue]) => {
            const value = String(rawValue || '').trim().toLowerCase()
            if (!value) {
              return true
            }

            const haystackMap = {
              name: [item.participantName, item.participantEmail, ...item.otherParticipants].join(' '),
              email: item.participantEmail,
              profile: item.profileSummary,
              registration: item.registrationSummary,
              paymentStatus: item.paymentStatus,
              bookingReference: item.bookingReference,
            }

            return String(haystackMap[key] || '')
              .toLowerCase()
              .includes(value)
          }),
        ),
    [filters, participantRows, registrationView],
  )

  const selectedRegistrationRow = useMemo(
    () =>
      filteredRegistrations.find((item) => item.key === selectedRegistrationKey) ||
      filteredRegistrations[0] ||
      null,
    [filteredRegistrations, selectedRegistrationKey],
  )

  const countryOverview = useMemo(
    () =>
      Object.values(
        filteredRegistrations.reduce((accumulator, item) => {
          const key = item.countryLabel || 'Unknown'

          if (!accumulator[key]) {
            accumulator[key] = {
              country: key,
              flag: getCountryFlag(item.countryCode),
              count: 0,
              variants: new Set(),
            }
          }

          accumulator[key].count += 1

          if (item.variantName) {
            accumulator[key].variants.add(item.variantName)
          }

          return accumulator
        }, {}),
      )
        .map((item) => ({
          ...item,
          variants: Array.from(item.variants),
        }))
        .sort((left, right) => right.count - left.count || left.country.localeCompare(right.country)),
    [filteredRegistrations],
  )

  const selectedRegistration = selectedRegistrationRow?.registration || null

  const paidRegistrations = useMemo(
    () =>
      adminRegistrations.filter((item) =>
        isAttendanceConfirmed(item),
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
          isAttendanceConfirmed(item),
      ),
    [adminRegistrations],
  )

  const registrationMonitorStats = useMemo(
    () => ({
      totalParticipants: participantRows.length,
      readyParticipants: participantRows.filter((item) => item.isReady).length,
      pendingParticipants: participantRows.filter((item) => !item.isReady).length,
      hotelParticipants: participantRows.filter((item) => item.needsHotel).length,
      sharedParticipants: participantRows.filter((item) => item.participantCount > 1).length,
    }),
    [participantRows],
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

  const removePackageOption = (variantIndex, packageId) => {
    setCatalogDraft((current) => {
      const variant = current.variants[variantIndex]

      if (!variant) {
        return current
      }

      if ((variant.packageOptions || []).length <= 1) {
        setSaveMessage(ui.removeLastPackageBlocked)
        return current
      }

      return {
        ...current,
        variants: current.variants.map((item, itemIndex) => {
          if (itemIndex !== variantIndex) {
            return item
          }

          return {
            ...item,
            packageOptions: (item.packageOptions || []).filter(
              (option) => option.id !== packageId,
            ),
          }
        }),
      }
    })
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

  const handleManualRegistrationChange = (key, value) => {
    setManualRegistration((current) => {
      if (key === 'variantId') {
        const nextVariant = variantOptions.find((item) => item.id === value) || variantOptions[0]
        return {
          ...current,
          variantId: value,
          packageType: nextVariant?.packageOptions?.[0]?.id || 'single',
          addonIds: [],
        }
      }

      if (key === 'packageType') {
        return {
          ...current,
          packageType: value,
          addonIds: [],
        }
      }

      return {
        ...current,
        [key]: value,
      }
    })
  }

  const handleManualParticipantChange = (index, key, value) => {
    setManualRegistration((current) => ({
      ...current,
      participants: current.participants.map((participant, participantIndex) =>
        participantIndex === index ? { ...participant, [key]: value } : participant,
      ),
    }))
    setManualErrors((current) => ({ ...current, [`${key}-${index}`]: '' }))
  }

  const toggleManualAddon = (addonId) => {
    setManualRegistration((current) => ({
      ...current,
      addonIds: current.addonIds.includes(addonId)
        ? current.addonIds.filter((item) => item !== addonId)
        : [...current.addonIds, addonId],
    }))
  }

  const resetManualRegistration = () => {
    setManualRegistration({
      variantId: variantOptions[0]?.id || 'local',
      packageType: variantOptions[0]?.packageOptions?.[0]?.id || 'single',
      addonIds: [],
    paymentStatus: 'paid',
      adminNotes: '',
      participants: [{ ...initialParticipant }, { ...initialParticipant }],
    })
    setManualErrors({})
  }

  const validateManualRegistration = () => {
    const nextErrors = {}

    manualRegistration.participants
      .slice(0, manualParticipantCount)
      .forEach((participant, index) => {
        if (!participant.firstName.trim()) nextErrors[`firstName-${index}`] = t.checkout.errors.firstNameRequired
        if (!participant.lastName.trim()) nextErrors[`lastName-${index}`] = t.checkout.errors.lastNameRequired
        if (!participant.email.trim()) {
          nextErrors[`email-${index}`] = t.checkout.errors.emailRequired
        } else if (!validateEmail(participant.email)) {
          nextErrors[`email-${index}`] = t.checkout.errors.emailInvalid
        }
        if (!participant.country.trim()) nextErrors[`country-${index}`] = t.checkout.errors.countryRequired
        if (!participant.memberFederation.trim()) nextErrors[`memberFederation-${index}`] = t.checkout.errors.federationRequired
        if (!participant.role.trim()) nextErrors[`role-${index}`] = t.checkout.errors.roleRequired
        if (!participant.gender.trim()) nextErrors[`gender-${index}`] = t.checkout.errors.genderRequired
      })

    setManualErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleCreateManualRegistration = async () => {
    if (!manualVariant || !manualPackage || !validateManualRegistration()) {
      return
    }

    setIsManualSaving(true)
    setManualSaveMessage('')

    try {
      const selectedAddons = manualAddonOptions.filter((addon) =>
        manualRegistration.addonIds.includes(addon.id),
      )
      const participants = manualRegistration.participants.slice(0, manualParticipantCount)
      const totalAmount =
        parseAmount(manualPackage.price) +
        selectedAddons.reduce((sum, addon) => sum + parseAmount(addon.price), 0)
      const isInvited = manualRegistration.paymentStatus === 'invited'
      const paymentConfirmed = isPaidStatus(manualRegistration.paymentStatus)

      await onCreateManualRegistration({
        variantId: manualVariant.id,
        variantName: manualVariant.title,
        packageType: manualPackage.id,
        packageName: manualPackage.name,
        participantCount: manualParticipantCount,
        baseItem: {
          name: manualPackage.baseItemName,
          price: parseAmount(manualPackage.price),
        },
        addons: selectedAddons,
        totalAmount,
        currency: 'EUR',
        language,
        participants,
        primaryParticipant: participants[0],
        paymentStatus: manualRegistration.paymentStatus,
        paymentConfirmed,
        orderStatus: paymentConfirmed || isInvited ? 'confirmed' : 'pending_payment',
        paymentStage: isInvited ? 'manual_invited_entry' : 'manual_entry',
        paidAt: paymentConfirmed ? new Date().toISOString() : null,
        hotelRoom: '',
        adminNotes: manualRegistration.adminNotes,
      })

      setManualSaveMessage(ui.manualRegistrationSaved)
      resetManualRegistration()
      setShowManualForm(false)
    } catch (error) {
      setManualSaveMessage(error.message || ui.manualRegistrationFailed)
    } finally {
      setIsManualSaving(false)
    }
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

  const handlePaymentStateUpdate = async (registrationId, nextState) => {
    const isPaid = nextState === 'paid'
    const isInvited = nextState === 'invited'

    await onUpdateRegistration(registrationId, {
      paymentStatus: nextState,
      paymentConfirmed: isPaid,
      orderStatus: isPaid || isInvited ? 'confirmed' : 'pending_payment',
      paymentStage: isPaid
        ? 'manual_marked_paid'
        : isInvited
          ? 'manual_marked_invited'
          : 'manual_marked_pending',
      paidAt: isPaid ? new Date().toISOString() : null,
    })
  }

  const handleDeleteRegistration = async (registration) => {
    if (!registration?.id) {
      return
    }

    if (!window.confirm(ui.deleteRegistrationConfirm)) {
      return
    }

    try {
      await onDeleteRegistration(registration.id)
      setSelectedRegistrationKey('')
    } catch (error) {
      window.alert(error.message || ui.deleteRegistrationFailed)
    }
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
                        <div className="cta-row">
                          <button
                            className="button button--ghost"
                            type="button"
                            onClick={() => {
                              if (!window.confirm(ui.removePackageConfirm)) {
                                return
                              }

                              removePackageOption(index, option.id)
                            }}
                          >
                            {ui.removePackage}
                          </button>
                        </div>
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
                <div className="cta-row">
                  <button
                    className="button button--ghost"
                    onClick={() => setShowManualForm((current) => !current)}
                    type="button"
                  >
                    {showManualForm ? ui.hideManualRegistration : ui.addManualRegistration}
                  </button>
                  <button
                    className="button button--ghost"
                    onClick={() =>
                      setFilters({
                        name: '',
                        email: '',
                        profile: '',
                        registration: '',
                        paymentStatus: '',
                        bookingReference: '',
                      })
                    }
                    type="button"
                  >
                    {ui.clearFilters}
                  </button>
                </div>
              </div>

              {showManualForm ? (
                <div className="admin-editor-card">
                  <h3>{ui.manualRegistrationTitle}</h3>
                  <p className="checkout-copy">{ui.manualRegistrationCopy}</p>
                  {manualSaveMessage ? <p className="admin-status">{manualSaveMessage}</p> : null}

                  <div className="form-grid">
                    <label className="field">
                      <span>{ui.categoryLabel}</span>
                      <select
                        value={manualRegistration.variantId}
                        onChange={(event) =>
                          handleManualRegistrationChange('variantId', event.target.value)
                        }
                      >
                        {variantOptions.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>{ui.packageTypeLabel}</span>
                      <select
                        value={manualRegistration.packageType}
                        onChange={(event) =>
                          handleManualRegistrationChange('packageType', event.target.value)
                        }
                      >
                        {manualPackageOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>{ui.paymentStateLabel}</span>
                      <select
                        value={manualRegistration.paymentStatus}
                        onChange={(event) =>
                          handleManualRegistrationChange('paymentStatus', event.target.value)
                        }
                      >
                        <option value="paid">{ui.manualPaid}</option>
                        <option value="pending">{ui.manualPending}</option>
                        <option value="invited">{ui.manualInvited}</option>
                      </select>
                    </label>
                    <label className="field field--full">
                      <span>{ui.manualSourceLabel}</span>
                      <input
                        value={manualRegistration.adminNotes}
                        onChange={(event) =>
                          handleManualRegistrationChange('adminNotes', event.target.value)
                        }
                        placeholder="Email, phone, federation office, paper form..."
                      />
                    </label>
                  </div>

                  {manualAddonOptions.length ? (
                    <div className="admin-subsection">
                      <h4>{ui.addonSelectionLabel}</h4>
                      <div className="registration-list registration-list--plain">
                        {manualAddonOptions.map((addon) => (
                          <label className="registration-list__item" key={addon.id}>
                            <span className="admin-inline-check">
                              <input
                                type="checkbox"
                                checked={manualRegistration.addonIds.includes(addon.id)}
                                onChange={() => toggleManualAddon(addon.id)}
                              />
                              {addon.name}
                            </span>
                            <span>EUR {parseAmount(addon.price).toFixed(2)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="admin-subsection">
                    <h4>{ui.participantDetailsLabel}</h4>
                    {Array.from({ length: manualParticipantCount }).map((_, index) => {
                      const participant = manualRegistration.participants[index]

                      return (
                        <div className="admin-editor-card" key={`manual-participant-${index}`}>
                          <strong>{t.admin.participantIndexed.replace('{index}', index + 1)}</strong>
                          <div className="form-grid">
                            <label className="field">
                              <span>{t.checkout.firstName}</span>
                              <input
                                value={participant.firstName}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'firstName', event.target.value)
                                }
                              />
                              {manualErrors[`firstName-${index}`] ? <small className="field-error">{manualErrors[`firstName-${index}`]}</small> : null}
                            </label>
                            <label className="field">
                              <span>{t.checkout.lastName}</span>
                              <input
                                value={participant.lastName}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'lastName', event.target.value)
                                }
                              />
                              {manualErrors[`lastName-${index}`] ? <small className="field-error">{manualErrors[`lastName-${index}`]}</small> : null}
                            </label>
                            <label className="field field--full">
                              <span>{t.checkout.email}</span>
                              <input
                                type="email"
                                value={participant.email}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'email', event.target.value)
                                }
                              />
                              {manualErrors[`email-${index}`] ? <small className="field-error">{manualErrors[`email-${index}`]}</small> : null}
                            </label>
                            <label className="field">
                              <span>{t.checkout.country}</span>
                              <select
                                value={participant.country}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'country', event.target.value)
                                }
                              >
                                <option value="">{t.checkout.selectCountry}</option>
                                {countryOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {manualErrors[`country-${index}`] ? <small className="field-error">{manualErrors[`country-${index}`]}</small> : null}
                            </label>
                            <label className="field">
                              <span>{t.checkout.memberFederation}</span>
                              <select
                                value={participant.memberFederation}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'memberFederation', event.target.value)
                                }
                              >
                                <option value="">{t.checkout.selectFederation}</option>
                                {federationOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {manualErrors[`memberFederation-${index}`] ? <small className="field-error">{manualErrors[`memberFederation-${index}`]}</small> : null}
                            </label>
                            <label className="field">
                              <span>{t.checkout.role}</span>
                              <select
                                value={participant.role}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'role', event.target.value)
                                }
                              >
                                <option value="">{t.checkout.selectRole}</option>
                                {roleOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              {manualErrors[`role-${index}`] ? <small className="field-error">{manualErrors[`role-${index}`]}</small> : null}
                            </label>
                            <label className="field">
                              <span>{t.checkout.gender}</span>
                              <select
                                value={participant.gender}
                                onChange={(event) =>
                                  handleManualParticipantChange(index, 'gender', event.target.value)
                                }
                              >
                                <option value="">{t.checkout.gender}</option>
                                <option value="Female">{t.checkout.female}</option>
                                <option value="Male">{t.checkout.male}</option>
                              </select>
                              {manualErrors[`gender-${index}`] ? <small className="field-error">{manualErrors[`gender-${index}`]}</small> : null}
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="cta-row">
                    <button
                      className="button button--primary"
                      type="button"
                      disabled={isManualSaving}
                      onClick={handleCreateManualRegistration}
                    >
                      {isManualSaving ? `${ui.createManualRegistration}...` : ui.createManualRegistration}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="admin-kpi-grid admin-kpi-grid--cards">
                <div className="admin-kpi-card">
                  <span>{ui.totalAttendees}</span>
                  <strong>{registrationMonitorStats.totalParticipants}</strong>
                </div>
                <div className="admin-kpi-card">
                  <span>{ui.readyToAttend}</span>
                  <strong>{registrationMonitorStats.readyParticipants}</strong>
                </div>
                <div className="admin-kpi-card">
                  <span>{ui.awaitingPayment}</span>
                  <strong>{registrationMonitorStats.pendingParticipants}</strong>
                </div>
                <div className="admin-kpi-card">
                  <span>{ui.hotelFollowUp}</span>
                  <strong>{registrationMonitorStats.hotelParticipants}</strong>
                </div>
              </div>

              <div className="admin-quick-filters">
                {[
                  ['all', ui.quickAll],
                  ['ready', ui.quickReady],
                  ['pending', ui.quickPending],
                  ['hotel', ui.quickHotel],
                  ['shared', ui.quickShared],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={`admin-quick-filter ${registrationView === value ? 'is-active' : ''}`}
                    onClick={() => setRegistrationView(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="admin-country-overview">
                <div className="admin-panel__top admin-panel__top--compact">
                  <div>
                    <h3>{ui.countryOverview}</h3>
                    <p className="checkout-copy">{ui.countryOverviewCopy}</p>
                  </div>
                </div>
                {countryOverview.length ? (
                  <div className="admin-country-grid">
                    {countryOverview.map((item) => (
                      <div className="admin-country-card" key={item.country}>
                        <div className="admin-country-card__top">
                          <span className="admin-country-card__flag" aria-hidden="true">
                            {item.flag || '🌍'}
                          </span>
                          <strong>{item.country}</strong>
                        </div>
                        <span>
                          {item.count === 1
                            ? ui.countryParticipantsSingle.replace('{count}', item.count)
                            : ui.countryParticipants.replace('{count}', item.count)}
                        </span>
                        {item.variants.length ? (
                          <small>{item.variants.join(' · ')}</small>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="checkout-copy">{ui.noCountries}</p>
                )}
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{ui.participantName}</th>
                      <th>{ui.participantEmail}</th>
                      <th>{ui.profileColumn}</th>
                      <th>{ui.registrationColumn}</th>
                      <th>{ui.referenceLabel}</th>
                      <th>{ui.paymentStatus}</th>
                      <th>{ui.paymentAmount}</th>
                      <th>{ui.registeredAt}</th>
                      <th>{ui.paidAt}</th>
                      <th className="admin-table__actions-head">{ui.actionsLabel}</th>
                    </tr>
                    <tr className="admin-table__filters">
                      {[
                        'name',
                        'email',
                        'profile',
                        'registration',
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
                        <td className="admin-table__participant-cell">
                          <strong>{item.participantName || '—'}</strong>
                        </td>
                        <td className="admin-table__stack-cell">
                          {item.participantEmail || '—'}
                        </td>
                        <td className="admin-table__stack-cell">
                          <strong>{item.countryLabel || '-'}</strong>
                          <details
                            className="admin-inline-details"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <summary>{ui.detailsLabel}</summary>
                            <div className="admin-inline-details__body">
                              <span className="admin-inline-details__label">
                                {ui.profileSummaryLabel}
                              </span>
                              <span>{item.federationLabel || '-'}</span>
                              <span>
                                {[item.roleLabel, item.genderLabel].filter(Boolean).join(' / ') || '-'}
                              </span>
                              <span>{item.participantEmail || '-'}</span>
                            </div>
                          </details>
                        </td>
                        <td className="admin-table__stack-cell admin-table__stack-cell--wide">
                          <strong>{item.packageName || '-'}</strong>
                          <span>{item.variantName || '-'}</span>
                          <details
                            className="admin-inline-details"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <summary>{ui.detailsLabel}</summary>
                            <div className="admin-inline-details__body">
                              <span className="admin-inline-details__label">
                                {ui.registrationSummaryLabel}
                              </span>
                              <div className="admin-registration-options">
                                {item.selectedOptions?.length ? (
                                  item.selectedOptions.map((option, index) => (
                                    <span
                                      key={`${item.key}-option-${index}`}
                                      className={`admin-registration-options__item${
                                        option.isBase ? ' is-base' : ''
                                      }`}
                                    >
                                      {formatAddonLine(option)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="admin-registration-options__empty">
                                    {ui.noAddonsSelected}
                                  </span>
                                )}
                              </div>
                            </div>
                          </details>
                        </td>
                        <td className="admin-table__reference-cell">
                          {item.bookingReference || item.id}
                        </td>
                        <td>
                          <span
                            className={`status-pill status-pill--${getPaymentTone(
                              item.paymentStatusRaw,
                            )}`}
                          >
                            {item.paymentStatus || ui.pendingLabel}
                          </span>
                        </td>
                        <td className="admin-table__amount-cell">
                          EUR {item.totalAmountNumber.toFixed(2)}
                        </td>
                        <td className="admin-table__date-cell">{item.registeredAtLabel}</td>
                        <td className="admin-table__date-cell">{item.paidAtLabel}</td>
                        <td className="admin-table__actions-cell">
                          <button
                            className="admin-row-action admin-row-action--danger"
                            type="button"
                            aria-label={ui.deleteRegistration}
                            title={ui.deleteRegistration}
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteRegistration(item.registration)
                            }}
                          >
                            {ui.deleteShort}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedRegistration ? (
                <div className="registration-detail registration-detail--admin">
                  <div className="registration-detail__header">
                    <div>
                      <span className="order-summary-card__eyebrow">{ui.referenceLabel}</span>
                      <h3>{selectedRegistrationRow?.participantName || '—'}</h3>
                    </div>
                    <span
                      className={`status-pill status-pill--${getPaymentTone(
                        selectedRegistration.paymentStatus,
                      )}`}
                    >
                      {getPaymentStatusDisplay(selectedRegistration, ui)}
                    </span>
                  </div>
                  <div className="admin-kpi-grid registration-detail__stats">
                    <div className="admin-kpi-card">
                      <span>{ui.participantEmail}</span>
                      <strong>{selectedRegistrationRow?.participantEmail || '—'}</strong>
                    </div>
                    <div className="admin-kpi-card">
                      <span>{ui.referenceLabel}</span>
                      <strong>{selectedRegistration.bookingReference}</strong>
                    </div>
                    <div className="admin-kpi-card">
                      <span>{ui.paymentStatus}</span>
                      <strong>{getPaymentStatusDisplay(selectedRegistration, ui)}</strong>
                    </div>
                    <div className="admin-kpi-card">
                      <span>{ui.paymentAmount}</span>
                      <strong>EUR {selectedRegistration.totalAmountNumber.toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="cta-row">
                    <button
                      className="button button--primary"
                      type="button"
                      onClick={() => handlePaymentStateUpdate(selectedRegistration.id, 'paid')}
                    >
                      {ui.markAsPaid}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => handlePaymentStateUpdate(selectedRegistration.id, 'invited')}
                    >
                      {ui.markAsInvited}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => handlePaymentStateUpdate(selectedRegistration.id, 'pending')}
                    >
                      {ui.markAsPending}
                    </button>
                    <button
                      className="button button--ghost"
                      type="button"
                      onClick={() => handleDeleteRegistration(selectedRegistration)}
                    >
                      {ui.deleteRegistration}
                    </button>
                  </div>

                  <div className="admin-subsection">
                    <h3>{ui.packageLabel}</h3>
                    <div className="admin-editor-card">
                      <strong>{selectedRegistration.packageName || '-'}</strong>
                      <p>{selectedRegistration.variantName || '-'}</p>
                      <div className="admin-selection-breakdown">
                        {getRegistrationOptionItems(selectedRegistration, ui).length ? (
                          getRegistrationOptionItems(selectedRegistration, ui).map((option, index) => (
                            <div
                              className={`admin-selection-breakdown__row${
                                option.isBase ? ' is-base' : ''
                              }`}
                              key={`${selectedRegistration.id}-option-${index}`}
                            >
                              <div className="admin-selection-breakdown__copy">
                                <strong>{option.name}</strong>
                                <span>
                                  {option.isBase ? ui.baseIncludedLabel : ui.selectedOptions}
                                </span>
                              </div>
                              <strong>EUR {parseAmount(option.price).toFixed(2)}</strong>
                            </div>
                          ))
                        ) : (
                          <p>{ui.noAddonsSelected}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedRegistration.participants?.length ? (
                    <div className="admin-subsection">
                      <h3>{t.admin.participants}</h3>
                      {selectedRegistration.participants.map((participant, index) => (
                        <div className="admin-editor-card" key={`${selectedRegistration.id}-${index}`}>
                          <strong>{t.admin.participantIndexed.replace('{index}', index + 1)}</strong>
                          <p>{participant.firstName} {participant.lastName}</p>
                          <p>
                            {participant.email ? (
                              <a className="text-link" href={`mailto:${participant.email}`}>
                                {participant.email}
                              </a>
                            ) : (
                              'â€”'
                            )}
                          </p>
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
                        <td>{getPaymentStatusDisplay(item, ui)}</td>
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
