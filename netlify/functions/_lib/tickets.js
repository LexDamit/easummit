const QRCode = require('qrcode')

const ticketCopy = {
  en: {
    summitName: 'EA European Athletics Coaching Summit 2026',
    confirmationSubject: 'Your registration is confirmed',
    greeting: 'Your payment has been confirmed.',
    body:
      'Please find your official event ticket attached. Keep it with you and present the QR code on arrival for check-in.',
    ticketLabel: 'Official admission ticket',
    reference: 'Reference',
    category: 'Category',
    packageName: 'Package',
    total: 'Paid amount',
    participant: 'Lead participant',
    participants: 'Participants',
    addons: 'Selected add-ons',
    checkIn: 'Scan this QR code at the event desk.',
    footer:
      'This is an automated confirmation email. Please do not reply to this address.',
    viewOnline: 'You can also view your confirmation online',
  },
  fr: {
    summitName: 'EA European Athletics Coaching Summit 2026',
    confirmationSubject: 'Votre inscription est confirmee',
    greeting: 'Votre paiement a bien ete confirme.',
    body:
      'Veuillez trouver ci-joint votre billet officiel. Merci de le conserver et de presenter le QR code a votre arrivee pour le check-in.',
    ticketLabel: 'Billet officiel d admission',
    reference: 'Reference',
    category: 'Categorie',
    packageName: 'Package',
    total: 'Montant paye',
    participant: 'Participant principal',
    participants: 'Participants',
    addons: 'Options selectionnees',
    checkIn: 'Scannez ce QR code a l accueil de l evenement.',
    footer:
      'Cet email de confirmation a ete envoye automatiquement. Merci de ne pas repondre a cette adresse.',
    viewOnline: 'Vous pouvez aussi consulter votre confirmation en ligne',
  },
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatAmount = (value) => `EUR ${Number(value || 0).toFixed(2)}`

const getTicketLanguage = (registration) =>
  registration?.language === 'fr' ? 'fr' : 'en'

const getLeadParticipant = (registration) =>
  registration?.primaryParticipant ||
  registration?.participants?.[0] ||
  registration?.customer ||
  {}

const buildParticipantsMarkup = (registration) =>
  (registration.participants || [])
    .map(
      (participant) =>
        `<li>${escapeHtml(participant.firstName)} ${escapeHtml(participant.lastName)}${participant.email ? ` - ${escapeHtml(participant.email)}` : ''}</li>`,
    )
    .join('')

const buildAddonsMarkup = (registration) =>
  (registration.addons || [])
    .map(
      (addon) =>
        `<li>${escapeHtml(addon.name)} - ${formatAmount(addon.price)}</li>`,
    )
    .join('')

const buildQrPayload = (registration, leadParticipant) =>
  JSON.stringify({
    ref: registration.bookingReference,
    packageName: registration.packageName,
    name: `${leadParticipant.firstName || ''} ${leadParticipant.lastName || ''}`.trim(),
    email: leadParticipant.email || '',
  })

const buildOnlineConfirmationUrl = (registration, baseUrl) => {
  if (!baseUrl || !registration?.variantId || !registration?.bookingReference) {
    return ''
  }

  return `${String(baseUrl).replace(/\/+$/, '')}/${registration.variantId}?status=success&ref=${encodeURIComponent(
    registration.bookingReference,
  )}`
}

const buildTicketSvg = ({
  registration,
  qrDataUrl,
  language,
}) => {
  const copy = ticketCopy[language]
  const leadParticipant = getLeadParticipant(registration)
  const participants = buildParticipantsMarkup(registration)
  const addons = buildAddonsMarkup(registration)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="720" viewBox="0 0 1200 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="720" rx="36" fill="#F4F8FF"/>
  <rect x="28" y="28" width="1144" height="664" rx="28" fill="#FFFFFF" stroke="#D6E1F5" stroke-width="2"/>
  <rect x="64" y="64" width="720" height="592" rx="28" fill="#0F2B4D"/>
  <rect x="818" y="64" width="318" height="592" rx="28" fill="#EDF4FF"/>
  <text x="108" y="128" fill="#A9C7FF" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="700" letter-spacing="2">EA COACHING SUMMIT 2026</text>
  <text x="108" y="196" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="700">${escapeHtml(copy.ticketLabel)}</text>
  <text x="108" y="254" fill="#8AB4FF" font-family="Arial, Helvetica, sans-serif" font-size="22">${escapeHtml(copy.reference)}: ${escapeHtml(registration.bookingReference)}</text>
  <text x="108" y="320" fill="#A9C7FF" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeHtml(copy.participant)}</text>
  <text x="108" y="356" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${escapeHtml(`${leadParticipant.firstName || ''} ${leadParticipant.lastName || ''}`.trim())}</text>
  <text x="108" y="410" fill="#A9C7FF" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeHtml(copy.category)}</text>
  <text x="108" y="440" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${escapeHtml(registration.variantName || '')}</text>
  <text x="108" y="492" fill="#A9C7FF" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeHtml(copy.packageName)}</text>
  <text x="108" y="522" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${escapeHtml(registration.packageName || '')}</text>
  <text x="108" y="574" fill="#A9C7FF" font-family="Arial, Helvetica, sans-serif" font-size="18">${escapeHtml(copy.total)}</text>
  <text x="108" y="604" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="24">${escapeHtml(formatAmount(registration.totalAmount))}</text>

  <rect x="862" y="110" width="230" height="230" rx="24" fill="#FFFFFF"/>
  <image href="${qrDataUrl}" x="886" y="134" width="182" height="182"/>
  <text x="977" y="376" text-anchor="middle" fill="#0F2B4D" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700">${escapeHtml(copy.checkIn)}</text>

  <text x="862" y="446" fill="#0F2B4D" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${escapeHtml(copy.participants)}</text>
  <foreignObject x="862" y="462" width="238" height="88">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #284E7A;">
      <ul style="padding-left: 18px; margin: 0;">${participants || '<li>1 participant</li>'}</ul>
    </div>
  </foreignObject>

  <text x="862" y="580" fill="#0F2B4D" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${escapeHtml(copy.addons)}</text>
  <foreignObject x="862" y="596" width="238" height="48">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, Helvetica, sans-serif; font-size: 15px; color: #284E7A;">
      <ul style="padding-left: 18px; margin: 0;">${addons || '<li>None</li>'}</ul>
    </div>
  </foreignObject>
</svg>`
}

const buildEmailHtml = ({ registration, baseUrl, language, qrDataUrl }) => {
  const copy = ticketCopy[language]
  const leadParticipant = getLeadParticipant(registration)
  const participants = buildParticipantsMarkup(registration)
  const addons = buildAddonsMarkup(registration)
  const confirmationUrl = buildOnlineConfirmationUrl(registration, baseUrl)

  return `<!doctype html>
  <html lang="${language}">
    <body style="margin:0;padding:32px;background:#f4f8ff;font-family:Arial,Helvetica,sans-serif;color:#10233a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #d6e1f5;border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 20px;background:#0f2b4d;">
            <div style="font-size:13px;letter-spacing:1.8px;text-transform:uppercase;color:#a9c7ff;font-weight:700;">${escapeHtml(copy.summitName)}</div>
            <h1 style="margin:12px 0 0;color:#ffffff;font-size:34px;line-height:1.15;">${escapeHtml(copy.confirmationSubject)}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:18px;font-weight:700;">${escapeHtml(copy.greeting)}</p>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4f6787;">${escapeHtml(copy.body)}</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:20px;border:1px solid #d6e1f5;border-radius:18px;background:#f9fbff;">
                  <p style="margin:0 0 10px;"><strong>${escapeHtml(copy.reference)}:</strong> ${escapeHtml(registration.bookingReference)}</p>
                  <p style="margin:0 0 10px;"><strong>${escapeHtml(copy.participant)}:</strong> ${escapeHtml(`${leadParticipant.firstName || ''} ${leadParticipant.lastName || ''}`.trim())}</p>
                  <p style="margin:0 0 10px;"><strong>${escapeHtml(copy.category)}:</strong> ${escapeHtml(registration.variantName || '')}</p>
                  <p style="margin:0 0 10px;"><strong>${escapeHtml(copy.packageName)}:</strong> ${escapeHtml(registration.packageName || '')}</p>
                  <p style="margin:0;"><strong>${escapeHtml(copy.total)}:</strong> ${escapeHtml(formatAmount(registration.totalAmount))}</p>
                </td>
              </tr>
            </table>
            <div style="text-align:center;margin:0 0 24px;">
              <img src="${qrDataUrl}" alt="QR code" style="width:180px;height:180px;border-radius:18px;border:1px solid #d6e1f5;background:#fff;padding:12px;" />
              <p style="margin:12px 0 0;font-size:15px;color:#4f6787;">${escapeHtml(copy.checkIn)}</p>
            </div>
            ${participants ? `<div style="margin:0 0 16px;"><strong>${escapeHtml(copy.participants)}:</strong><ul style="margin:8px 0 0;padding-left:18px;color:#4f6787;">${participants}</ul></div>` : ''}
            ${addons ? `<div style="margin:0 0 24px;"><strong>${escapeHtml(copy.addons)}:</strong><ul style="margin:8px 0 0;padding-left:18px;color:#4f6787;">${addons}</ul></div>` : ''}
            ${confirmationUrl ? `<p style="margin:0 0 16px;"><a href="${confirmationUrl}" style="color:#0f4ea8;font-weight:700;">${escapeHtml(copy.viewOnline)}</a></p>` : ''}
            <p style="margin:0;font-size:13px;color:#6a7f99;">${escapeHtml(copy.footer)}</p>
          </td>
        </tr>
      </table>
    </body>
  </html>`
}

const buildEmailText = ({ registration, baseUrl, language }) => {
  const copy = ticketCopy[language]
  const leadParticipant = getLeadParticipant(registration)
  const confirmationUrl = buildOnlineConfirmationUrl(registration, baseUrl)

  return [
    copy.confirmationSubject,
    '',
    copy.greeting,
    copy.body,
    '',
    `${copy.reference}: ${registration.bookingReference}`,
    `${copy.participant}: ${`${leadParticipant.firstName || ''} ${leadParticipant.lastName || ''}`.trim()}`,
    `${copy.category}: ${registration.variantName || ''}`,
    `${copy.packageName}: ${registration.packageName || ''}`,
    `${copy.total}: ${formatAmount(registration.totalAmount)}`,
    confirmationUrl ? `${copy.viewOnline}: ${confirmationUrl}` : '',
    '',
    copy.footer,
  ]
    .filter(Boolean)
    .join('\n')
}

const buildConfirmationEmail = async ({ registration, baseUrl }) => {
  const language = getTicketLanguage(registration)
  const copy = ticketCopy[language]
  const leadParticipant = getLeadParticipant(registration)
  const qrDataUrl = await QRCode.toDataURL(buildQrPayload(registration, leadParticipant), {
    width: 360,
    margin: 1,
  })
  const ticketSvg = buildTicketSvg({ registration, qrDataUrl, language })

  return {
    language,
    to: leadParticipant.email || '',
    subject: `${copy.summitName} - ${copy.confirmationSubject}`,
    html: buildEmailHtml({ registration, baseUrl, language, qrDataUrl }),
    text: buildEmailText({ registration, baseUrl, language }),
    attachments: [
      {
        filename: `${registration.bookingReference || 'ticket'}-official-ticket.svg`,
        content: Buffer.from(ticketSvg, 'utf8').toString('base64'),
      },
    ],
  }
}

module.exports = {
  buildConfirmationEmail,
  getLeadParticipant,
  getTicketLanguage,
}
