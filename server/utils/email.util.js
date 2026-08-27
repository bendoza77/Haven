const { Resend } = require("resend");

/* One client for the process. Built lazily so the server still boots without a
   key — see sendEmail below for what happens then. */
let client = null;

const resend = () => {
    if (!client && process.env.RESEND_API_KEY) {
        client = new Resend(process.env.RESEND_API_KEY);
    }
    return client;
};

const FROM = process.env.EMAIL_FROM || "Haven <onboarding@resend.dev>";

/**
 * Sends one email.
 *
 * With no RESEND_API_KEY the message is written to the console instead of
 * being sent, so signing up and resetting a password still work end to end in
 * development — the link is in the terminal. Never silently swallows a real
 * send failure.
 */
const sendEmail = async ({ to, subject, html, text }) => {
    const service = resend();

    if (!service) {
        console.warn(
            [
                "",
                "  RESEND_API_KEY is not set — email was not sent.",
                `  To:      ${to}`,
                `  Subject: ${subject}`,
                `  Link:    ${text}`,
                ""
            ].join("\n")
        );
        return { delivered: false };
    }

    const { error } = await service.emails.send({ from: FROM, to, subject, html, text });

    if (error) {
        throw new Error(error.message || "The email could not be sent");
    }

    return { delivered: true };
};

/* ------------------------------------------------------------ templates */

/* Inline styles only: every mail client strips a stylesheet. The palette is
   the storefront's own so the message looks like it came from the shop. */
const layout = ({ heading, body, action, href, footer }) => `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 16px;background:#f7f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#191512;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4ded4;border-radius:14px;">
      <tr>
        <td style="padding:32px 32px 0;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:-0.01em;">Haven</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 0;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;line-height:1.3;">${heading}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.65;color:#5c544b;">${body}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 0;">
          <a href="${href}" style="display:inline-block;background:#191512;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:13px 26px;border-radius:8px;">${action}</a>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8a8177;">
            ${footer}
          </p>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#8a8177;word-break:break-all;">
            Or paste this into your browser:<br />${href}
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const sendVerificationEmail = ({ to, name, url }) =>
    sendEmail({
        to,
        subject: "Confirm your email · Haven",
        text: url,
        html: layout({
            heading: `Welcome, ${name.split(" ")[0]}`,
            body: "Confirm this address and your Haven account is ready — saved pieces, your bag and order history all follow you from here.",
            action: "Confirm my email",
            href: url,
            footer: "This link works once and expires in 24 hours. If you didn't create a Haven account, you can ignore this message."
        })
    });

const sendPasswordResetEmail = ({ to, name, url }) =>
    sendEmail({
        to,
        subject: "Reset your password · Haven",
        text: url,
        html: layout({
            heading: `Reset your password, ${name.split(" ")[0]}`,
            body: "You asked to set a new password for your Haven account. Choose a new one using the button below.",
            action: "Choose a new password",
            href: url,
            footer: "This link expires in 10 minutes and can only be used once. If you didn't ask for it, nothing has changed and you can ignore this message."
        })
    });

/* A code is not a link, so this template drops the button and the "paste this
   into your browser" line and puts the digits where the heading's eye goes. */
const codeLayout = ({ heading, body, code, footer }) => `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:32px 16px;background:#f7f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#191512;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e4ded4;border-radius:14px;">
      <tr>
        <td style="padding:32px 32px 0;">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:-0.01em;">Haven</p>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 0;">
          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;line-height:1.3;">${heading}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.65;color:#5c544b;">${body}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 32px 0;">
          <div style="background:#f7f4ef;border:1px solid #e4ded4;border-radius:10px;padding:20px;text-align:center;">
            <p style="margin:0;font-size:34px;font-weight:600;letter-spacing:0.28em;text-indent:0.28em;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">${code}</p>
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 32px 32px;">
          <p style="margin:0;font-size:12px;line-height:1.6;color:#8a8177;">${footer}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

const sendTwoFactorCodeEmail = ({ to, name, code }) =>
    sendEmail({
        to,
        subject: `${code} is your Haven sign-in code`,
        text: code,
        html: codeLayout({
            heading: `Your sign-in code, ${name.split(" ")[0]}`,
            body: "Somebody signed in to your Haven account with the right password. Enter this code to finish.",
            code,
            footer: "This code expires in 10 minutes. If it wasn't you, somebody knows your password — change it as soon as you can."
        })
    });

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const sendOrderConfirmationEmail = ({ to, name, order }) =>
    sendEmail({
        to,
        subject: `Order ${order.reference} confirmed · Haven`,
        text: order.reference,
        html: codeLayout({
            heading: `Thank you, ${name.split(" ")[0]}`,
            body: `We have your order and the studio is packing it now. It is going to ${order.shipping.city}, ${order.shipping.country}.`,
            code: order.reference,
            footer: `${order.items.length} ${order.items.length === 1 ? "line" : "lines"} · ${money.format(order.total)} total. We will write again when it ships.`
        })
    });

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
    sendTwoFactorCodeEmail,
    sendOrderConfirmationEmail
};
