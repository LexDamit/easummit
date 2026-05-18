import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  getCountryLabel,
  getFederationLabel,
  getRoleLabel,
} from '../data/participantOptions'

const buildTicketSvgMarkup = ({ registration, leadParticipant, qrCode, t, language }) => {
  const safe = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')

  const participantLines = (registration.participants || [])
    .map((participant, index) => {
      const label = t.admin.participantIndexed.replace('{index}', index + 1)
      return `${label}: ${participant.firstName} ${participant.lastName}`.trim()
    })
    .join(' • ')

  const addonLines = (registration.addons || [])
    .map((item) => `${item.name} - EUR ${item.price}`)
    .join(' • ')

  const locationLine = getCountryLabel(leadParticipant?.country, language)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="760" viewBox="0 0 1200 760" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="760" rx="32" fill="#F4F8FF"/>
  <rect x="24" y="24" width="1152" height="712" rx="28" fill="#FFFFFF" stroke="#D8E3F2"/>
  <rect x="56" y="56" width="732" height="648" rx="28" fill="#10233A"/>
  <rect x="822" y="56" width="322" height="648" rx="28" fill="#EEF4FF"/>
  <text x="98" y="118" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="2">${safe(t.success.ticketChip)}</text>
  <text x="98" y="188" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700">${safe(`${leadParticipant?.firstName || ''} ${leadParticipant?.lastName || ''}`.trim())}</text>
  <text x="98" y="228" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="22">${safe(leadParticipant?.email || '')}</text>
  <text x="98" y="298" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="18">${safe(t.success.reference)}</text>
  <text x="98" y="332" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">${safe(registration.bookingReference)}</text>
  <text x="98" y="390" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="18">${safe(t.success.category)}</text>
  <text x="98" y="420" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${safe(registration.variantName || '')}</text>
  <text x="98" y="472" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="18">${safe(t.success.package)}</text>
  <text x="98" y="502" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${safe(registration.packageName || '')}</text>
  <text x="98" y="554" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="18">${safe(t.success.total)}</text>
  <text x="98" y="584" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${safe(`EUR ${registration.totalAmount}`)}</text>
  <text x="98" y="636" fill="#A8C6F8" font-family="Arial, Helvetica, sans-serif" font-size="18">${safe(t.checkout.country)}</text>
  <text x="98" y="666" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${safe(locationLine)}</text>
  <rect x="876" y="108" width="214" height="214" rx="24" fill="#FFFFFF"/>
  <image href="${qrCode}" x="902" y="134" width="162" height="162"/>
  <text x="983" y="360" text-anchor="middle" fill="#10233A" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700">${safe(t.success.showQr)}</text>
  <text x="876" y="430" fill="#10233A" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${safe(t.success.participants)}</text>
  <foreignObject x="876" y="444" width="214" height="92">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #47617E;">${safe(participantLines || `${leadParticipant?.firstName || ''} ${leadParticipant?.lastName || ''}`)}</div>
  </foreignObject>
  <text x="876" y="584" fill="#10233A" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${safe(t.success.addons)}</text>
  <foreignObject x="876" y="598" width="214" height="72">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.5; color: #47617E;">${safe(addonLines || '—')}</div>
  </foreignObject>
</svg>`
}

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

  const paymentConfirmed = Boolean(registration?.paymentConfirmed)
  const confirmationEmailSent = Boolean(registration?.confirmationEmail?.sentAt)

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

        if (data.registration.paymentConfirmed) {
          const qr = await QRCode.toDataURL(
            JSON.stringify({
              ref: data.registration.bookingReference,
              name: `${data.registration.primaryParticipant?.firstName || ''} ${data.registration.primaryParticipant?.lastName || ''}`.trim(),
            }),
          )
          setQrCode(qr)
        }
      } catch (loadError) {
        setError(loadError.message || t.success.loadFailed)
      }
    }

    loadRegistration()
  }, [reference, t])

  const handleDownloadTicket = () => {
    if (!registration || !leadParticipant || !qrCode) {
      return
    }

    const svg = buildTicketSvgMarkup({
      registration,
      leadParticipant,
      qrCode,
      t,
      language,
    })
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${registration.bookingReference || 'ticket'}-official-ticket.svg`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handlePrintTicket = () => {
    if (!registration || !leadParticipant || !qrCode) {
      return
    }

    const svg = buildTicketSvgMarkup({
      registration,
      leadParticipant,
      qrCode,
      t,
      language,
    })
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900')

    if (!printWindow) {
      return
    }

    printWindow.document.write(`<!doctype html>
      <html>
        <head>
          <title>${registration.bookingReference || 'Ticket'}</title>
          <style>
            body { margin: 0; padding: 24px; background: #eef4ff; }
            .ticket-print { max-width: 1200px; margin: 0 auto; }
            svg { width: 100%; height: auto; display: block; }
            @media print {
              body { padding: 0; background: #fff; }
            }
          </style>
        </head>
        <body>
          <div class="ticket-print">${svg}</div>
        </body>
      </html>`)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => {
      printWindow.print()
    }, 200)
  }

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
          <p className="checkout-copy">
            {paymentConfirmed ? t.success.copy : t.success.pendingCopy}
          </p>
          {paymentConfirmed && confirmationEmailSent ? (
            <p className="checkout-copy">{t.success.emailSent}</p>
          ) : null}

          <div className="ticket-success-layout">
            <div className="ticket-success-main">
              <div className="ticket-summary-grid">
                <div className="ticket-summary-row">
                  <span>{t.success.reference}</span>
                  <strong>{registration.bookingReference}</strong>
                </div>
                <div className="ticket-summary-row">
                  <span>{t.success.participant}</span>
                  <strong>
                    {leadParticipant?.firstName} {leadParticipant?.lastName}
                  </strong>
                </div>
                <div className="ticket-summary-row">
                  <span>{t.success.category}</span>
                  <strong>{registration.variantName}</strong>
                </div>
                <div className="ticket-summary-row">
                  <span>{t.success.package}</span>
                  <strong>{registration.packageName}</strong>
                </div>
                <div className="ticket-summary-row">
                  <span>{t.success.total}</span>
                  <strong>EUR {registration.totalAmount}</strong>
                </div>
                <div className="ticket-summary-row">
                  <span>{t.success.paymentStatus}</span>
                  <strong>
                    {paymentConfirmed ? t.success.paymentConfirmed : t.success.paymentPending}
                  </strong>
                </div>
              </div>

              {paymentConfirmed ? (
                <div className="ticket-card ticket-card--featured">
                  <div className="ticket-card__content">
                    <span className="section-chip">{t.success.ticketChip}</span>
                    <h2>
                      {leadParticipant?.firstName} {leadParticipant?.lastName}
                    </h2>
                    <div className="ticket-card__meta">
                      <p>{leadParticipant?.email}</p>
                      <p>{getCountryLabel(leadParticipant?.country, language)}</p>
                      <p>
                        {registration.variantName} · {registration.packageName}
                      </p>
                    </div>
                    <p className="ticket-card__copy">{t.success.showQr}</p>
                    <div className="cta-row">
                      <button
                        className="button button--primary"
                        type="button"
                        onClick={handlePrintTicket}
                      >
                        {t.success.printTicket}
                      </button>
                      <button
                        className="button button--ghost"
                        type="button"
                        onClick={handleDownloadTicket}
                      >
                        {t.success.downloadTicket}
                      </button>
                    </div>
                  </div>
                  {qrCode ? (
                    <div className="ticket-card__qr-wrap">
                      <img className="ticket-card__qr" src={qrCode} alt="Ticket QR code" />
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="ticket-summary-card ticket-summary-card--pending">
                  <span className="section-chip">{t.success.pendingChip}</span>
                  <p className="checkout-copy">{t.success.pendingTicketNotice}</p>
                </div>
              )}

              {registration.participants?.length > 1 ? (
                <div className="ticket-addons">
                  <h3>{t.success.participants}</h3>
                  <ul className="bullet-list">
                    {registration.participants.map((participant, index) => (
                      <li key={`${registration.bookingReference}-participant-${index}`}>
                        {t.admin.participantIndexed.replace('{index}', index + 1)}:{' '}
                        {participant.firstName} {participant.lastName} - {participant.email} -{' '}
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

            <aside className="ticket-poster-card">
              <span className="section-chip">{t.success.posterChip}</span>
              <h3>{t.success.posterTitle}</h3>
              <p className="checkout-copy">{t.success.posterCopy}</p>
              <div className="ticket-poster-card__frame">
                <object
                  data="/ea-coaching-summit-poster.pdf#toolbar=0&navpanes=0&scrollbar=0"
                  type="application/pdf"
                  className="ticket-poster-card__embed"
                >
                  <a className="text-link" href="/ea-coaching-summit-poster.pdf" target="_blank" rel="noreferrer">
                    {t.success.posterFallback}
                  </a>
                </object>
              </div>
              <div className="cta-row">
                <a
                  className="button button--ghost"
                  href="/ea-coaching-summit-poster.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.success.posterOpen}
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Success
