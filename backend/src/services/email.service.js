const nodemailer = require('nodemailer');

class EmailDeliveryRejectedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'EmailDeliveryRejectedError';
    this.code = 'EMAIL_REJECTED';
  }
}

function normalizeMailbox(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function isRecipientRejected(sendInfo, recipient) {
  const target = normalizeMailbox(recipient);

  const accepted = Array.isArray(sendInfo?.accepted)
    ? sendInfo.accepted.map(normalizeMailbox)
    : [];
  const rejected = Array.isArray(sendInfo?.rejected)
    ? sendInfo.rejected.map(normalizeMailbox)
    : [];

  if (accepted.includes(target)) {
    return false;
  }

  if (rejected.includes(target)) {
    return true;
  }

  return accepted.length === 0 && rejected.length > 0;
}

function getMailTransporter() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();

  if (!host || !user || !pass) {
    throw new Error('SMTP_HOST, SMTP_USER et SMTP_PASS doivent etre configures pour envoyer les codes de verification');
  }

  const port = Number(process.env.SMTP_PORT || 587);

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true',
    auth: {
      user,
      pass,
    },
  });
}

async function sendVerificationCodeEmail({ to, code, displayName }) {
  const transporter = getMailTransporter();
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

  if (!from) {
    throw new Error('SMTP_FROM ou SMTP_USER doit etre configure pour envoyer les codes de verification');
  }

  const subject = 'Votre code de verification Agora FST';
  const safeName = displayName || 'utilisateur';

  const sendInfo = await transporter.sendMail({
    from,
    to,
    subject,
    text: `Bonjour ${safeName},\n\nVotre code de verification Agora FST est : ${code}\n\nCe code expire dans 10 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Bonjour ${safeName},</p>
        <p>Votre code de verification Agora FST est :</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0;color:#0f172a">${code}</div>
        <p>Ce code expire dans 10 minutes.</p>
        <p>Si vous n'etes pas a l'origine de cette demande, vous pouvez ignorer cet email.</p>
      </div>
    `,
  });

  if (isRecipientRejected(sendInfo, to)) {
    throw new EmailDeliveryRejectedError('Adresse email rejetee par le serveur de messagerie');
  }
}

async function sendPasswordResetEmail({ to, resetUrl, displayName }) {
  const transporter = getMailTransporter();
  const from = String(process.env.SMTP_FROM || process.env.SMTP_USER || '').trim();

  if (!from) {
    throw new Error('SMTP_FROM ou SMTP_USER doit etre configure pour envoyer les emails de reinitialisation');
  }

  const subject = 'Reinitialisation de votre mot de passe Agora FST';
  const safeName = displayName || 'utilisateur';

  const sendInfo = await transporter.sendMail({
    from,
    to,
    subject,
    text: `Bonjour ${safeName},\n\nVous avez demande une reinitialisation de mot de passe pour votre compte Agora FST.\n\nOuvrez ce lien pour definir un nouveau mot de passe : ${resetUrl}\n\nCe lien expire dans 15 minutes. Si vous n'etes pas a l'origine de cette demande, ignorez cet email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Bonjour ${safeName},</p>
        <p>Vous avez demande une reinitialisation de mot de passe pour votre compte Agora FST.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600">
            Definir un nouveau mot de passe
          </a>
        </p>
        <p>Ce lien expire dans 15 minutes.</p>
        <p>Si vous n'etes pas a l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });

  if (isRecipientRejected(sendInfo, to)) {
    throw new EmailDeliveryRejectedError('Adresse email rejetee par le serveur de messagerie');
  }
}

module.exports = {
  EmailDeliveryRejectedError,
  sendVerificationCodeEmail,
  sendPasswordResetEmail,
};