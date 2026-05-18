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

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildPrintableTicketDocument = ({
  registration,
  leadParticipant,
  qrCode,
  t,
  language,
  origin,
}) => {
  const summaryRows = [
    [t.success.reference, registration.bookingReference],
    [t.success.participant, `${leadParticipant?.firstName || ''} ${leadParticipant?.lastName || ''}`.trim()],
    [t.success.category, registration.variantName],
    [t.success.package, registration.packageName],
    [t.success.total, `EUR ${registration.totalAmount}`],
    [t.success.paymentStatus, t.success.paymentConfirmed],
  ]

  const summaryMarkup = summaryRows
    .map(
      ([label, value]) => `
        <div class="print-summary-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>`,
    )
    .join('')

  const participantsMarkup = (registration.participants || [])
    .map(
      (participant, index) => `
        <li>
          ${escapeHtml(t.admin.participantIndexed.replace('{index}', index + 1))}: 
          ${escapeHtml(participant.firstName)} ${escapeHtml(participant.lastName)}
        </li>`,
    )
    .join('')

  const addonsMarkup = (registration.addons || [])
    .map(
      (item) => `<li>${escapeHtml(item.name)} - EUR ${escapeHtml(item.price)}</li>`,
    )
    .join('')

  return `<!doctype html>
    <html lang="${language}">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(registration.bookingReference || 'Ticket')}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          * { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: #eef4ff;
            color: #10233a;
          }

          .print-sheet {
            width: 190mm;
            min-height: 277mm;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #d8e3f2;
            border-radius: 8mm;
            overflow: hidden;
          }

          .print-topbar {
            padding: 10mm 12mm 6mm;
            background: linear-gradient(180deg, #f7faff 0%, #ffffff 100%);
            border-bottom: 1px solid #d8e3f2;
          }

          .print-chip {
            display: inline-flex;
            padding: 2.5mm 5mm;
            border-radius: 999px;
            background: #dfeaf9;
            color: #0f4ea8;
            font-size: 10pt;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .print-title {
            margin: 5mm 0 2.5mm;
            font-size: 28pt;
            line-height: 1.02;
            letter-spacing: -0.05em;
          }

          .print-copy {
            margin: 0;
            color: #58708f;
            font-size: 12pt;
            line-height: 1.55;
          }

          .print-grid {
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 8mm;
            padding: 10mm 12mm 12mm;
          }

          .print-panel {
            display: grid;
            gap: 6mm;
            align-content: start;
          }

          .print-summary {
            border: 1px solid #d8e3f2;
            border-radius: 6mm;
            overflow: hidden;
          }

          .print-summary-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 5mm;
            padding: 4mm 5mm;
            border-bottom: 1px solid #e4ebf7;
          }

          .print-summary-row:last-child { border-bottom: 0; }
          .print-summary-row span { color: #607793; font-weight: 700; }
          .print-summary-row strong { text-align: right; }

          .print-ticket {
            border: 1px solid #d8e3f2;
            border-radius: 6mm;
            background: linear-gradient(180deg, #ffffff 0%, #f6f9ff 100%);
            padding: 6mm;
          }

          .print-ticket-grid {
            display: grid;
            grid-template-columns: 1fr 38mm;
            gap: 5mm;
            align-items: center;
          }

          .print-ticket-title {
            margin: 0 0 3mm;
            font-size: 18pt;
            letter-spacing: -0.03em;
          }

          .print-ticket p {
            margin: 0 0 2mm;
            color: #58708f;
            font-size: 11pt;
            line-height: 1.45;
          }

          .print-qr-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3mm;
            border-radius: 5mm;
            background: #ffffff;
            border: 1px solid #d8e3f2;
          }

          .print-qr {
            width: 32mm;
            height: 32mm;
          }

          .print-section-title {
            margin: 0;
            font-size: 12pt;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #0f4ea8;
          }

          .print-list {
            margin: 0;
            padding-left: 4.5mm;
            color: #58708f;
            font-size: 10.5pt;
            line-height: 1.5;
          }

          .print-poster {
            border: 1px solid #d8e3f2;
            border-radius: 6mm;
            overflow: hidden;
            background: linear-gradient(180deg, #f7faff 0%, #ffffff 100%);
            display: grid;
            grid-template-rows: auto 1fr;
          }

          .print-poster-copy {
            padding: 6mm 6mm 0;
          }

          .print-poster-copy p {
            margin: 2.5mm 0 0;
            color: #58708f;
            font-size: 10.5pt;
            line-height: 1.5;
          }

          .print-poster-frame {
            padding: 6mm;
            height: 178mm;
          }

          .print-poster-frame object {
            width: 100%;
            height: 100%;
            border: 1px solid #d8e3f2;
            border-radius: 5mm;
            display: block;
            background: #eef4ff;
          }

          @media print {
            body { background: #fff; }
            .print-sheet { border: 0; margin: 0; width: auto; min-height: auto; }
          }
        </style>
      </head>
      <body>
        <article class="print-sheet">
          <header class="print-topbar">
            <span class="print-chip">${escapeHtml(t.success.chip)}</span>
            <h1 class="print-title">${escapeHtml(t.success.title)}</h1>
            <p class="print-copy">${escapeHtml(t.success.copy)}</p>
          </header>
          <section class="print-grid">
            <div class="print-panel">
              <div class="print-summary">${summaryMarkup}</div>
              <div class="print-ticket">
                <span class="print-chip">${escapeHtml(t.success.ticketChip)}</span>
                <div class="print-ticket-grid">
                  <div>
                    <h2 class="print-ticket-title">${escapeHtml(`${leadParticipant?.firstName || ''} ${leadParticipant?.lastName || ''}`.trim())}</h2>
                    <p>${escapeHtml(leadParticipant?.email || '')}</p>
                    <p>${escapeHtml(getCountryLabel(leadParticipant?.country, language))}</p>
                    <p>${escapeHtml(`${registration.variantName} · ${registration.packageName}`)}</p>
                    <p>${escapeHtml(t.success.showQr)}</p>
                  </div>
                  <div class="print-qr-wrap">
                    <img class="print-qr" src="${qrCode}" alt="QR code" />
                  </div>
                </div>
              </div>
              ${
                participantsMarkup
                  ? `<div><h3 class="print-section-title">${escapeHtml(t.success.participants)}</h3><ul class="print-list">${participantsMarkup}</ul></div>`
                  : ''
              }
              ${
                addonsMarkup
                  ? `<div><h3 class="print-section-title">${escapeHtml(t.success.addons)}</h3><ul class="print-list">${addonsMarkup}</ul></div>`
                  : ''
              }
            </div>
            <aside class="print-poster">
              <div class="print-poster-copy">
                <span class="print-chip">${escapeHtml(t.success.posterChip)}</span>
                <h3 class="print-section-title" style="margin-top:4mm;">${escapeHtml(t.success.posterTitle)}</h3>
                <p>${escapeHtml(t.success.posterCopy)}</p>
              </div>
              <div class="print-poster-frame">
                <object data="${origin}/ea-coaching-summit-poster.pdf#toolbar=0&navpanes=0&scrollbar=0&view=FitH" type="application/pdf">
                  <div>${escapeHtml(t.success.posterFallback)}</div>
                </object>
              </div>
            </aside>
          </section>
        </article>
      </body>
    </html>`
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
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1100,height=900')

    if (!printWindow) {
      return
    }

    printWindow.document.write(
      buildPrintableTicketDocument({
        registration,
        leadParticipant,
        qrCode,
        t,
        language,
        origin: window.location.origin,
      }),
    )
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => {
      printWindow.print()
    }, 350)
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
            <div className="ticket-success-main ticket-success-main--full">
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
          </div>
        </div>
      </section>
    </div>
  )
}

export default Success
