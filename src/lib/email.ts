import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}

type FormEmailData = {
  formType: "contact" | "custom_request" | "question";
  data: Record<string, string>;
};

export async function sendFormNotification({ formType, data }: FormEmailData) {
  const to = process.env.NOTIFICATION_EMAIL;
  const from = process.env.EMAIL_FROM || "noreply@zeynepkomur.com";

  if (!to) {
    console.warn("[email] NOTIFICATION_EMAIL not set, skipping");
    return;
  }

  const { subject, body } = formatEmail(formType, data);

  try {
    await getResend().emails.send({ from, to, subject, text: body });
  } catch (error) {
    console.error("[email] Failed to send notification:", error);
  }
}

export async function sendWelcomeEmail(email: string, name?: string | null) {
  const from = process.env.EMAIL_FROM || "noreply@zeynepkomur.com";
  const greeting = name ? `merhaba ${name}` : "merhaba";

  try {
    await getResend().emails.send({
      from,
      to: email,
      subject: "zeynep kömür kulübüne hoş geldiniz ✦",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
          <div style="border-bottom: 3px solid #004494; padding-bottom: 24px; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-transform: lowercase; margin: 0;">
              ${greeting},
            </h1>
          </div>

          <p style="font-size: 16px; line-height: 1.7; color: #444;">
            zeynep kömür kulübüne katıldığınız için teşekkürler. artık yeni eserler, koleksiyonlar ve özel etkinliklerden ilk siz haberdar olacaksınız.
          </p>

          <p style="font-size: 16px; line-height: 1.7; color: #444; margin-top: 24px;">
            sanata olan ilginiz beni çok mutlu ediyor. bu yolculukta birlikte olmak çok güzel.
          </p>

          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #eee;">
            <p style="font-size: 13px; color: #999; text-transform: lowercase; letter-spacing: 0.5px;">
              sevgilerle,<br/>
              <strong style="color: #004494;">zeynep kömür</strong>
            </p>
            <a href="https://zeynepkomur.com" style="font-size: 12px; color: #004494; text-decoration: none; letter-spacing: 0.5px;">
              zeynepkomur.com
            </a>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("[email] Failed to send welcome email:", error);
  }
}

function formatEmail(formType: string, data: Record<string, string>) {
  switch (formType) {
    case "contact":
      return {
        subject: `[zeyn] Yeni iletişim: ${data.name || ""}`,
        body: `İsim: ${data.name}\nE-posta: ${data.email}\n\nMesaj:\n${data.message}`,
      };
    case "question":
      return {
        subject: "[zeyn] Yeni soru",
        body: `E-posta: ${data.email}\n\nSoru:\n${data.question}`,
      };
    case "custom_request":
      return {
        subject: `[zeyn] Özel resim isteği: ${data.firstName} ${data.lastName}`,
        body: `İsim: ${data.firstName} ${data.lastName}\nE-posta: ${data.email}\n\nAçıklama:\n${data.description}`,
      };
    default:
      return {
        subject: "[zeyn] Yeni form gönderimi",
        body: JSON.stringify(data, null, 2),
      };
  }
}
