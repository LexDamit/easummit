import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'

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

function Success({ navigate }) {
  const [registration, setRegistration] = useState(null)
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')
  const reference = useMemo(() => new URLSearchParams(window.location.search).get('ref'), [])
  const leadParticipant =
    registration?.primaryParticipant ??
    registration?.participants?.[0] ??
    registration?.customer ??
    null

  useEffect(() => {
    const loadRegistration = async () => {
      if (!reference) {
        setError('Missing booking reference.')
        return
      }

      try {
        const response = await fetch(`/.netlify/functions/get-registration?ref=${encodeURIComponent(reference)}`)
        const data = await readJsonSafely(response)

        if (!response.ok) {
          throw new Error(
            getFunctionErrorMessage(response, data, 'Unable to load registration.'),
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
        setError(loadError.message || 'Unable to load registration.')
      }
    }

    loadRegistration()
  }, [reference])

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
          <p className="checkout-copy">Loading order summary...</p>
        </section>
      </div>
    )
  }

  return (
    <div className="page">
      <section className="shell-section ticket-page">
        <div className="ticket-summary-card">
          <span className="section-chip">Order summary</span>
          <h1 className="checkout-title">Your registration has been created.</h1>
          <p className="checkout-copy">
            Payment return received. Final payment confirmation can still be verified by the team.
          </p>

          <div className="summary-line">
            <span>Reference</span>
            <strong>{registration.bookingReference}</strong>
          </div>
          <div className="summary-line">
            <span>Participant</span>
            <strong>{leadParticipant?.firstName} {leadParticipant?.lastName}</strong>
          </div>
          <div className="summary-line">
            <span>Category</span>
            <strong>{registration.variantName}</strong>
          </div>
          <div className="summary-line">
            <span>Package</span>
            <strong>{registration.packageName}</strong>
          </div>
          <div className="summary-line">
            <span>Total</span>
            <strong>EUR {registration.totalAmount}</strong>
          </div>

          <div className="ticket-card">
            <div>
              <span className="section-chip">Official ticket</span>
              <h2>{leadParticipant?.firstName} {leadParticipant?.lastName}</h2>
              <p>{leadParticipant?.email}</p>
              <p>{leadParticipant?.country}</p>
              <p>{registration.variantName} · {registration.packageName}</p>
              <p>Show this QR code on arrival.</p>
            </div>
            {qrCode ? <img className="ticket-card__qr" src={qrCode} alt="Ticket QR code" /> : null}
          </div>

          {registration.participants?.length > 1 ? (
            <div className="ticket-addons">
              <h3>Participants</h3>
              <ul className="bullet-list">
                {registration.participants.map((participant, index) => (
                  <li key={`${registration.bookingReference}-participant-${index}`}>
                    Participant {index + 1}: {participant.firstName} {participant.lastName} - {participant.email}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {registration.addons?.length ? (
            <div className="ticket-addons">
              <h3>Add-ons</h3>
              <ul className="bullet-list">
                {registration.addons.map((item) => (
                  <li key={item.id}>{item.name} - EUR {item.price}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="cta-row">
            <button className="button button--primary" onClick={() => navigate('local')}>
              New registration
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Success
