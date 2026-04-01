import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type FormEmailData = {
  formType: "contact" | "custom_request" | "question";
  data: Record<string, string>;
};

export async function sendFormNotification({ formType, data }: FormEmailData) {
  const to = process.env.NOTIFICATION_EMAIL;
  const from = process.env.EMAIL_FROM || "noreply@zeyneple.art";

  if (!to) {
    console.warn("[email] NOTIFICATION_EMAIL not set, skipping");
    return;
  }

  const { subject, body } = formatEmail(formType, data);

  try {
    await resend.emails.send({ from, to, subject, text: body });
  } catch (error) {
    console.error("[email] Failed to send notification:", error);
  }
}

function formatEmail(formType: string, data: Record<string, string>) {
  switch (formType) {
    case "contact":
      return {
        subject: `[arada] Yeni iletişim: ${data.name || ""}`,
        body: `İsim: ${data.name}\nE-posta: ${data.email}\n\nMesaj:\n${data.description}`,
      };
    case "question":
      return {
        subject: "[arada] Yeni soru",
        body: `E-posta: ${data.email}\n\nSoru:\n${data.question}`,
      };
    case "custom_request":
      return {
        subject: `[arada] Özel resim isteği: ${data.firstName} ${data.lastName}`,
        body: `İsim: ${data.firstName} ${data.lastName}\nE-posta: ${data.email}\n\nAçıklama:\n${data.description}`,
      };
    default:
      return {
        subject: "[arada] Yeni form gönderimi",
        body: JSON.stringify(data, null, 2),
      };
  }
}
