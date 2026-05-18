const { buildConfirmationEmail } = require('./tickets')

const sendConfirmationEmail = async ({ registration, baseUrl }) => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return {
      skipped: true,
      reason: 'Resend is not configured.',
      to: registration?.primaryParticipant?.email || registration?.participants?.[0]?.email || '',
    }
  }

  const email = await buildConfirmationEmail({ registration, baseUrl })

  if (!email.to) {
    throw new Error('Primary participant email is missing for confirmation delivery.')
  }

  const payload = {
    from: process.env.RESEND_FROM_EMAIL,
    to: [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    attachments: email.attachments,
    tags: [
      { name: 'type', value: 'registration_confirmation' },
      { name: 'reference', value: String(registration.bookingReference || 'unknown') },
    ],
  }

  if (process.env.RESEND_REPLY_TO) {
    payload.reply_to = [process.env.RESEND_REPLY_TO]
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Resend could not send the confirmation email.',
    )
  }

  return {
    skipped: false,
    emailId: data.id || data.data?.id || null,
    to: email.to,
    subject: email.subject,
  }
}

module.exports = {
  sendConfirmationEmail,
}
