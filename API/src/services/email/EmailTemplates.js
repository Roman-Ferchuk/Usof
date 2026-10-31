/**
 * Builds the subject, HTML and plain-text bodies of every e-mail usof sends.
 * Pure functions of their input: no network, no environment access.
 *
 * The markup is table-based with inline styles because that is the only
 * layout that renders consistently in Gmail, Outlook and Apple Mail.
 * Every piece of user-provided text is escaped.
 */
const COLORS = Object.freeze({
    ink: '#111a2b',
    paper: '#eef1f6',
    card: '#fbfcfe',
    line: '#cfd6e2',
    muted: '#5b6678',
    signal: '#2f4bff',
    marker: '#ffd23f'
});

const FONT_SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONT_SERIF = "Georgia, 'Times New Roman', serif";

const CHANGED_FIELD_LABELS = Object.freeze({
    title: 'Title',
    content: 'Details',
    status: 'Visibility',
    categories: 'Categories'
});

class EmailTemplates {
    /**
     * Confirmation of a freshly registered e-mail address.
     * @param {Object} data
     * @param {string} data.name - Recipient name.
     * @param {string} data.url - Confirmation link.
     * @returns {{subject: string, html: string, text: string}}
     */
    confirmEmail({ name, url }) {
        const greeting = this.#greeting(name);
        return {
            subject: 'Confirm your email to start using usof',
            html: this.#layout({
                preheader: 'One click and your account is ready.',
                title: 'Confirm your email',
                body: `
                    ${this.#paragraph(`${this.#escape(greeting)} welcome to usof, the place where developers trade questions and answers.`)}
                    ${this.#paragraph('Confirm that this address is yours and you can start asking, answering and voting.')}
                    ${this.#button('Confirm email address', url)}
                    ${this.#fallbackLink(url)}
                    ${this.#note('This link works for 24 hours. If you did not create a usof account, you can safely ignore this message.')}`,
                footer: 'You are receiving this e-mail because someone registered on usof with this address.'
            }),
            text: [
                `${greeting} welcome to usof!`,
                '',
                'Confirm your email address to finish creating your account:',
                url,
                '',
                'This link works for 24 hours. If you did not create a usof account, ignore this message.'
            ].join('\n')
        };
    }

    /**
     * Password reset request.
     * @param {Object} data
     * @param {string} data.name - Recipient name.
     * @param {string} data.url - Reset link.
     * @param {number} [data.minutes=15] - Link lifetime.
     * @returns {{subject: string, html: string, text: string}}
     */
    passwordReset({ name, url, minutes = 15 }) {
        const greeting = this.#greeting(name);
        return {
            subject: 'Reset your usof password',
            html: this.#layout({
                preheader: `Your reset link works for ${minutes} minutes.`,
                title: 'Choose a new password',
                body: `
                    ${this.#paragraph(`${this.#escape(greeting)} we received a request to reset the password of your usof account.`)}
                    ${this.#button('Choose a new password', url)}
                    ${this.#fallbackLink(url)}
                    ${this.#note(`This link works for ${minutes} minutes. If you did not ask for a reset, ignore this message: your password stays the same.`)}`,
                footer: 'You are receiving this e-mail because a password reset was requested for your account.'
            }),
            text: [
                `${greeting} we received a request to reset your usof password.`,
                '',
                'Choose a new password here:',
                url,
                '',
                `The link works for ${minutes} minutes. If you did not ask for a reset, ignore this message.`
            ].join('\n')
        };
    }

    /**
     * Notification about changes in a post the recipient follows.
     * @param {Object} data
     * @param {string} data.postTitle - Post title.
     * @param {string[]} data.changedFields - Names of changed fields.
     * @param {string} data.url - Link to the post.
     * @returns {{subject: string, html: string, text: string}}
     */
    postUpdated({ postTitle, changedFields, url }) {
        const labels = changedFields.map((field) => CHANGED_FIELD_LABELS[field] || field);
        const chips = labels.map((label) => this.#chip(label)).join(' ');

        return {
            subject: this.#subject(`Post updated: ${postTitle}`),
            html: this.#layout({
                preheader: `Changed: ${labels.join(', ')}.`,
                title: 'A post you follow was updated',
                body: `
                    ${this.#quoteCard({ heading: postTitle })}
                    ${this.#paragraph('What changed:')}
                    <div style="margin:0 0 4px;">${chips}</div>
                    ${this.#button('View the post', url)}
                    ${this.#fallbackLink(url)}`,
                footer: 'You are following this post. Open it and press “Unsubscribe” to stop these e-mails.'
            }),
            text: [
                `A post you follow was updated: ${postTitle}`,
                `What changed: ${labels.join(', ')}`,
                '',
                url,
                '',
                'Open the post and press “Unsubscribe” to stop these e-mails.'
            ].join('\n')
        };
    }

    /**
     * Notification about a new comment under a post the recipient follows.
     * @param {Object} data
     * @param {string} data.postTitle - Post title.
     * @param {string} data.authorName - Comment author.
     * @param {string} data.commentContent - Comment text.
     * @param {string} data.url - Link to the post.
     * @returns {{subject: string, html: string, text: string}}
     */
    newComment({ postTitle, authorName, commentContent, url }) {
        const preview = commentContent.length > 300
            ? `${commentContent.slice(0, 300).trimEnd()}…`
            : commentContent;

        return {
            subject: this.#subject(`New comment on: ${postTitle}`),
            html: this.#layout({
                preheader: `${authorName}: ${preview.slice(0, 90)}`,
                title: 'New comment on a post you follow',
                body: `
                    ${this.#paragraph(`<strong style="color:${COLORS.ink};">${this.#escape(postTitle)}</strong>`)}
                    ${this.#quoteCard({ author: authorName, heading: null, text: preview })}
                    ${this.#button('Read the discussion', url)}
                    ${this.#fallbackLink(url)}`,
                footer: 'You are following this post. Open it and press “Unsubscribe” to stop these e-mails.'
            }),
            text: [
                `New comment on: ${postTitle}`,
                '',
                `${authorName} wrote:`,
                preview,
                '',
                url,
                '',
                'Open the post and press “Unsubscribe” to stop these e-mails.'
            ].join('\n')
        };
    }

    /* ----------------------------- building blocks ----------------------------- */

    /**
     * Wraps content into the shared page: header, card, footer, dark-mode rules.
     * @private
     */
    #layout({ preheader, title, body, footer }) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${this.#escape(title)}</title>
<style>
  @media (max-width: 620px) {
    .container { width: 100% !important; }
    .pad { padding-left: 20px !important; padding-right: 20px !important; }
    .title { font-size: 24px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .bg-page { background-color: #0b1019 !important; }
    .bg-card { background-color: #151d2d !important; border-color: #2a3550 !important; }
    .text-main { color: #e8edf7 !important; }
    .text-body { color: #c4cde0 !important; }
    .text-muted { color: #94a0b8 !important; }
    .box-quote { background-color: #1c2740 !important; border-top-color: #2a3550 !important; border-right-color: #2a3550 !important; border-bottom-color: #2a3550 !important; }
    .box-note { background-color: #2a2614 !important; }
    .chip { background-color: #1c2740 !important; border-color: #2a3550 !important; color: #e8edf7 !important; }
    .link-raw { color: #9fb0ff !important; }
  }
</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:${COLORS.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${this.#escape(preheader)}${'&nbsp;&zwnj;'.repeat(40)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-page" style="background-color:${COLORS.paper};">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;">
        <tr>
          <td style="background-color:${COLORS.ink};padding:22px 32px;border-bottom:4px solid ${COLORS.marker};border-radius:10px 10px 0 0;" class="pad">
            <span style="display:inline-block;background-color:${COLORS.marker};color:${COLORS.ink};font-family:${FONT_SANS};font-size:26px;line-height:1;font-weight:bold;letter-spacing:-2px;padding:6px 12px 8px;">usof</span>
          </td>
        </tr>
        <tr>
          <td class="bg-card pad" style="background-color:${COLORS.card};padding:36px 32px 32px;border:1px solid ${COLORS.line};border-top:0;border-radius:0 0 10px 10px;">
            <h1 class="title text-main" style="margin:0 0 20px;font-family:${FONT_SERIF};font-size:28px;line-height:1.25;font-weight:bold;color:${COLORS.ink};">${this.#escape(title)}</h1>
            ${body}
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:20px 32px 0;text-align:center;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:${COLORS.muted};">
            <span class="text-muted" style="color:${COLORS.muted};">${this.#escape(footer)}</span><br>
            <span class="text-muted" style="color:${COLORS.muted};">usof &middot; questions and answers for developers</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
    }

    /** @private */
    #paragraph(html) {
        return `<p class="text-body" style="margin:0 0 16px;font-family:${FONT_SANS};font-size:16px;line-height:1.6;color:#2b3550;">${html}</p>`;
    }

    /** Bulletproof call-to-action button. @private */
    #button(label, url) {
        return `
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 20px;">
          <tr>
            <td align="center" bgcolor="${COLORS.signal}" style="background-color:${COLORS.signal};border-radius:6px;">
              <a href="${this.#escape(url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT_SANS};font-size:16px;line-height:1;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${this.#escape(label)}</a>
            </td>
          </tr>
        </table>`;
    }

    /** Raw link for clients that do not render buttons. @private */
    #fallbackLink(url) {
        return `
        <p class="text-muted" style="margin:0 0 20px;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:${COLORS.muted};">
          Button not working? Copy this link into your browser:<br>
          <a class="link-raw" href="${this.#escape(url)}" style="color:${COLORS.signal};word-break:break-all;">${this.#escape(url)}</a>
        </p>`;
    }

    /** Highlighted side note. @private */
    #note(text) {
        return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="box-note" style="background-color:#fff8dc;border-left:4px solid ${COLORS.marker};padding:12px 16px;font-family:${FONT_SANS};font-size:14px;line-height:1.55;color:#4a4320;">
              <span class="text-body" style="color:#4a4320;">${this.#escape(text)}</span>
            </td>
          </tr>
        </table>`;
    }

    /** Small pill used to list changed fields. @private */
    #chip(label) {
        return `<span class="chip" style="display:inline-block;margin:0 6px 6px 0;padding:4px 12px;border:1px solid ${COLORS.line};border-radius:99px;background-color:#ffffff;font-family:${FONT_SANS};font-size:13px;line-height:1.4;color:${COLORS.ink};">${this.#escape(label)}</span>`;
    }

    /**
     * Card that quotes a post title or a comment, optionally with an author line.
     * @private
     */
    #quoteCard({ author = null, heading = null, text = null }) {
        const authorRow = author
            ? `<tr>
                <td width="36" valign="middle" style="padding:0 10px 10px 0;">
                  <div style="width:32px;height:32px;line-height:32px;border-radius:50%;background-color:${COLORS.signal};color:#ffffff;text-align:center;font-family:${FONT_SANS};font-size:14px;font-weight:bold;">${this.#escape(this.#initial(author))}</div>
                </td>
                <td valign="middle" class="text-main" style="padding:0 0 10px;font-family:${FONT_SANS};font-size:15px;color:${COLORS.ink};"><strong>${this.#escape(author)}</strong> <span class="text-muted" style="color:${COLORS.muted};">wrote:</span></td>
              </tr>`
            : '';
        const headingRow = heading
            ? `<tr><td colspan="2" class="text-main" style="font-family:${FONT_SERIF};font-size:20px;line-height:1.35;font-weight:bold;color:${COLORS.ink};">${this.#escape(heading)}</td></tr>`
            : '';
        const textRow = text
            ? `<tr><td colspan="2" class="text-body" style="font-family:${FONT_SERIF};font-size:16px;line-height:1.6;color:#2b3550;white-space:pre-wrap;">${this.#escape(text)}</td></tr>`
            : '';

        return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
          <tr>
            <td class="box-quote" style="background-color:#ffffff;border:1px solid ${COLORS.line};border-left:4px solid ${COLORS.signal};border-radius:6px;padding:16px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${authorRow}${headingRow}${textRow}
              </table>
            </td>
          </tr>
        </table>`;
    }

    /** @private */
    #greeting(name) {
        return name && String(name).trim() ? `Hi ${String(name).trim()},` : 'Hi,';
    }

    /** First visible character of a name, upper-cased. @private */
    #initial(name) {
        const first = Array.from(String(name).trim())[0];
        return first ? first.toUpperCase() : '?';
    }

    /** Subjects must stay on one line and reasonably short. @private */
    #subject(value) {
        const oneLine = String(value).replace(/[\r\n]+/g, ' ').trim();
        return oneLine.length > 120 ? `${oneLine.slice(0, 117)}...` : oneLine;
    }

    /** Escapes text for safe use in HTML content and attributes. @private */
    #escape(value = '') {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

module.exports = EmailTemplates;
