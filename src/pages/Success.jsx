import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  getCountryLabel,
  getFederationLabel,
  getRoleLabel,
} from '../data/participantOptions'

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

const getFunctionErrorMessage = (response, data, fallbackMessage, t) => {
  if (response.status === 404) {
    return t.checkout.errors.function404
  }

  return data.error || fallbackMessage
}

function Success({ language, navigate, t }) {
  const [registration, setRegistration] = useState(null)
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')
  const reference = useMemo(
    () => new URLSearchParams(window.location.search).get('ref'),
    [],
  )
  const leadParticipant =
    registration?.primaryParticipant ??
    registration?.participants?.[0] ??
    registration?.customer ??
    null

  useEffect(() => {
    const loadRegistration = async () => {
      if (!reference) {
        setError(t.success.missingReference)
        return
      }

      try {
        const response = await fetch(
          `/.netlify/functions/get-registration?ref=${encodeURIComponent(reference)}`,
        )
        const data = await readJsonSafely(response)

        if (!response.ok) {
          throw new Error(
            getFunctionErrorMessage(response, data, t.success.loadFailed, t),
          )
        }

        setRegistration(data.registration)
        const qr = await QRCode.toDataURL(
          JSON.stringify({
            ref: data.registration.bookingReference,
            name: `${data.registration.primaryParticipant?.firstName || ''} ${data.registration.primaryParticipant?.lastName || ''}`.trim(),
          }),
        )
        setQrCode(qr)
      } catch (loadError) {
        setError(loadError.message || t.success.loadFailed)
      }
    }

    loadRegistration()
  }, [reference, t])

  if (error) {
    return (
      <div className="page">
        <section className="shell-section ticket-page">
          <div className="error-box">{error}</div>
        </section>
      </div>
    )
  }

  if (!registration) {
    return (
      <div className="page">
        <section className="shell-section ticket-page">
          <p className="checkout-copy">{t.success.loading}</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="shell-section ticket-page">
        <div className="ticket-summary-card">
          <span className="section-chip">{t.success.chip}</span>
          <h1 className="checkout-title">{t.success.title}</h1>
          <p className="checkout-copy">{t.success.copy}</p>

          <div className="summary-line">
            <span>{t.success.reference}</span>
            <strong>{registration.bookingReference}</strong>
          </div>
          <div className="summary-line">
            <span>{t.success.participant}</span>
            <strong>
              {leadParticipant?.firstName} {leadParticipant?.lastName}
            </strong>
          </div>
          <div className="summary-line">
            <span>{t.success.category}</span>
            <strong>{registration.variantName}</strong>
          </div>
          <div className="summary-line">
            <span>{t.success.package}</span>
            <strong>{registration.packageName}</strong>
          </div>
          <div className="summary-line">
            <span>{t.success.total}</span>
            <strong>EUR {registration.totalAmount}</strong>
          </div>

          <div className="ticket-card">
            <div>
              <span className="section-chip">{t.success.ticketChip}</span>
              <h2>
                {leadParticipant?.firstName} {leadParticipant?.lastName}
              </h2>
              <p>{leadParticipant?.email}</p>
              <p>{getCountryLabel(leadParticipant?.country, language)}</p>
              <p>
                {registration.variantName} · {registration.packageName}
              </p>
              <p>{t.success.showQr}</p>
            </div>
            {qrCode ? (
              <img className="ticket-card__qr" src={qrCode} alt="Ticket QR code" />
            ) : null}
          </div>

          {registration.participants?.length > 1 ? (
            <div className="ticket-addons">
              <h3>{t.success.participants}</h3>
              <ul className="bullet-list">
                {registration.participants.map((participant, index) => (
                  <li key={`${registration.bookingReference}-participant-${index}`}>
                    {t.admin.participantIndexed.replace('{index}', index + 1)}:{' '}
                    {participant.firstName} {participant.lastName} -{' '}
                    {participant.email} -{' '}
                    {getCountryLabel(participant.country, language)} -{' '}
                    {getFederationLabel(participant.memberFederation, language)} -{' '}
                    {getRoleLabel(participant.role, language)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {registration.addons?.length ? (
            <div className="ticket-addons">
              <h3>{t.success.addons}</h3>
              <ul className="bullet-list">
                {registration.addons.map((item) => (
                  <li key={item.id}>
                    {item.name} - EUR {item.price}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="cta-row">
            <button className="button button--primary" onClick={() => navigate('local')}>
              {t.success.newRegistration}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Success
