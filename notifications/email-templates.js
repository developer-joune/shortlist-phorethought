'use strict';

// HTML/CSS for outbound notification emails. Inline styles throughout --
// email clients don't reliably support <style> blocks or CSS custom
// properties, so the design tokens from design/feed-prototype-v1.html and
// marketing/index.html are hardcoded here as literal hex values instead of
// var(--...) references. Kept in sync manually; if those tokens change,
// update here too.

const TOKENS = {
  canvas: '#f7f4ef',
  surface: '#ffffff',
  border: '#e8e2d8',
  textPrimary: '#211d17',
  textSecondary: '#6b6455',
  accent: '#c07830',
  accentText: '#a3651f',
  accentTint: '#f5e8d8',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// New-matches notification: a short one-off nudge, not a job digest. It
// deliberately carries no job details -- the client logs in to see those,
// per the task's "the login itself is the gate" requirement, not a
// magic-link/token in the email itself.
function newMatchesEmail({ firstName, matchCount, loginUrl }) {
  const safeName = escapeHtml(firstName);
  const safeCount = Number(matchCount);
  const plural = safeCount === 1 ? 'match' : 'matches';
  const safeUrl = escapeHtml(loginUrl);

  const subject = `You have ${safeCount} new ${plural} on Shortlist`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:${TOKENS.canvas}; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${TOKENS.canvas};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:${TOKENS.surface}; border:1px solid ${TOKENS.border}; border-radius:16px; overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px; border-bottom:1px solid ${TOKENS.border};">
              <div style="font-size:13px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:${TOKENS.accentText};">Shortlist</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 8px; font-size:20px; font-weight:600; color:${TOKENS.textPrimary};">Hey ${safeName},</p>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.5; color:${TOKENS.textPrimary};">
                You have <strong style="color:${TOKENS.accentText};">${safeCount}</strong> new ${plural} waiting in your feed.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:999px; background:${TOKENS.accent};">
                    <a href="${safeUrl}" style="display:inline-block; padding:12px 24px; font-size:14px; font-weight:700; color:#2b1c0c; text-decoration:none;">
                      Log in to see your matches →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px; border-top:1px solid ${TOKENS.border};">
              <p style="margin:0; font-size:12px; color:${TOKENS.textSecondary};">
                You're receiving this because you have an active Shortlist account. This email
                doesn't contain any job or application details -- log in to view those.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `Hey ${firstName},\n\nYou have ${safeCount} new ${plural} waiting in your feed.\n\nLog in to see them: ${loginUrl}\n\nYou're receiving this because you have an active Shortlist account. This email doesn't contain any job or application details -- log in to view those.`;

  return { subject, html, text };
}

module.exports = { newMatchesEmail };
