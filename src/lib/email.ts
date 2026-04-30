import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SENDER_SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SENDER_SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SENDER_SMTP_USER;
const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_SENDER_SMTP_PASS;
const smtpFromEmail = process.env.SMTP_FROM_EMAIL || process.env.EMAIL_SENDER_SMTP_FROM || smtpUser;
const smtpFromName = process.env.SMTP_FROM_NAME || process.env.EMAIL_SENDER_SMTP_FROM_NAME || process.env.EMAIL_SENDER_NAME || '';

let _transporter: nodemailer.Transporter | null = null;
let _isUsingEthereal = false;

const getTransporter = async (): Promise<nodemailer.Transporter> => {
    if (_transporter) return _transporter;

    // If SMTP credentials are provided, use them.
    if (smtpHost && smtpUser && smtpPass) {
        _transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: String(smtpPort) === '465',
            auth: { user: smtpUser, pass: smtpPass },
        });
        _isUsingEthereal = false;
        return _transporter;
    }

    // Fallback: create an Ethereal test account in development/testing.
    try {
        const testAccount = await nodemailer.createTestAccount();
        _transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });
        _isUsingEthereal = true;
        console.warn('[Email] No SMTP config found — using Ethereal test account (development only).');
        return _transporter;
    } catch (err) {
        console.error('[Email] Failed to create Ethereal account:', err);
        throw err;
    }
};

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
    try {
        const transporter = await getTransporter();
        const fromHeader = smtpFromName ? `"${smtpFromName}" <${smtpFromEmail}>` : `${smtpFromEmail}`;

        const info = await transporter.sendMail({ from: fromHeader, to, subject, html });

        if (_isUsingEthereal) {
            const preview = nodemailer.getTestMessageUrl(info);
            console.log('Email sent (Ethereal). Preview URL: %s', preview);
            // Return preview URL to callers for convenience
            return { info, preview };
        }

        console.log('Email sent: %s', info.messageId);
        return { info };
    } catch (error) {
        console.error('Email send error:', error);
        // Do not crash the process — bubble error to caller but keep server alive.
        throw error;
    }
};

export const sendVerificationEmail = async (email: string, url: string) => {
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify your email address</h2>
      <p>Click the button below to verify your email address and complete your registration for MediStore.</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${url}</p>
      <p>If you didn't request this email, you can ignore it.</p>
    </div>
  `;
    return sendEmail({ to: email, subject: 'Verify your MediStore account', html });
};

export const sendPasswordResetEmail = async (email: string, url: string) => {
    const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>We received a request to reset your password. Click the button below to choose a new password.</p>
      <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${url}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, you can ignore this email.</p>
    </div>
  `;
    return sendEmail({ to: email, subject: 'Reset your MediStore password', html });
};
