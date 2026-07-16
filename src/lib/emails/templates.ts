type EmailLayoutProps = {
  preheader: string;
  title: string;
  greeting?: string;
  paragraphs: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

export function renderEmailLayout({
  preheader,
  title,
  greeting,
  paragraphs,
  ctaLabel,
  ctaUrl,
  footerNote,
}: EmailLayoutProps) {
  const ctaBlock =
    ctaLabel && ctaUrl
      ? `
        <tr>
          <td align="center" style="padding: 8px 32px 28px; text-align: center;">
            <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #d7b46a 0%, #e4c780 100%); color: #070806; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 10px; letter-spacing: 0.02em;">
              ${ctaLabel}
            </a>
          </td>
        </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background: #070806; font-family: Inter, Arial, sans-serif; color: #f4eddf;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: radial-gradient(circle at 10% 0%, rgba(31,77,57,0.35), transparent 55%), #070806; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; border: 1px solid rgba(215,180,106,0.24); border-radius: 18px; overflow: hidden; background: #0d100d;">
          <tr>
            <td style="padding: 28px 32px 12px; border-bottom: 1px solid rgba(215,180,106,0.16);">
              <div style="display: inline-flex; align-items: center; gap: 10px;">
                <span style="width: 36px; height: 36px; border-radius: 10px; background: rgba(215,180,106,0.12); border: 1px solid rgba(215,180,106,0.35); color: #d7b46a; font-weight: 700; font-size: 16px; line-height: 36px; text-align: center;">K</span>
                <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 20px; color: #f4eddf; letter-spacing: 0.02em;">Koban nails</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 8px;">
              <h1 style="margin: 0 0 12px; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; line-height: 1.25; color: #f4eddf; font-weight: 500;">
                ${title}
              </h1>
              ${greeting ? `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: #ded6c7;">${greeting}</p>` : ""}
              ${paragraphs
                .map(
                  (paragraph) =>
                    `<p style="margin: 0 0 14px; font-size: 15px; line-height: 1.7; color: #ded6c7;">${paragraph}</p>`,
                )
                .join("")}
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding: 0 32px 28px;">
              <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a9a190;">
                ${footerNote ?? "Якщо ви не надсилали цей запит, просто проігноруйте лист."}
              </p>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; font-size: 12px; color: #a9a190;">© Koban nails · Галина Кобан</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderConfirmEmailEmail(params: { firstName: string; confirmUrl: string }) {
  const paragraphs = [
    "Дякуємо за реєстрацію на Koban nails. Натисніть кнопку нижче — після підтвердження ви одразу потрапите в особистий кабінет, повторно вводити пароль не потрібно.",
    "Якщо листа немає у «Вхідних», перевірте «Спам» або «Небажана пошта» (Junk) — особливо для @icloud.com, @me.com та @mac.com.",
    `Або скопіюйте посилання в браузер:\n${params.confirmUrl}`,
  ];

  return {
    subject: "Підтвердіть email — Koban nails",
    html: renderEmailLayout({
      preheader: "Підтвердіть email одним кліком — без повторного входу.",
      title: "Підтвердіть вашу пошту",
      greeting: `${params.firstName}, лишився один крок.`,
      paragraphs: paragraphs.slice(0, 2),
      ctaLabel: "Підтвердити email",
      ctaUrl: params.confirmUrl,
      footerNote: `Якщо кнопка не відкривається, скопіюйте посилання: ${params.confirmUrl}`,
    }),
    text: [
      `${params.firstName}, підтвердіть email на Koban nails`,
      "",
      "Натисніть посилання нижче — після підтвердження ви одразу потрапите в кабінет:",
      params.confirmUrl,
      "",
      "Якщо листа немає у «Вхідних», перевірте «Спам» або «Небажана пошта» (Junk), зокрема для iCloud (@icloud.com, @me.com).",
      "",
      "Якщо ви не реєструвались — проігноруйте цей лист.",
    ].join("\n"),
  };
}

export function renderResetPasswordEmail(params: { firstName: string; resetUrl: string }) {
  return {
    subject: "Зміна пароля — Koban nails",
    html: renderEmailLayout({
      preheader: "Запит на зміну пароля до вашого акаунту.",
      title: "Змініть пароль",
      greeting: params.firstName ? `${params.firstName}, ми отримали ваш запит.` : "Ми отримали ваш запит.",
      paragraphs: [
        "Натисніть кнопку нижче, щоб відкрити сторінку створення нового пароля для акаунту Koban nails.",
        "Якщо ви не запитували зміну пароля, просто проігноруйте цей лист — ваш пароль залишиться без змін.",
      ],
      ctaLabel: "Створити новий пароль",
      ctaUrl: params.resetUrl,
    }),
  };
}

export function renderPurchaseThankYouEmail(params: {
  firstName: string;
  courseTitle: string;
  cabinetUrl: string;
}) {
  return {
    subject: `Дякуємо за покупку — ${params.courseTitle}`,
    html: renderEmailLayout({
      preheader: `Курс «${params.courseTitle}» доступний у вашому кабінеті.`,
      title: "Дякуємо за покупку!",
      greeting: `${params.firstName}, ваш курс уже чекає на вас.`,
      paragraphs: [
        `Ви успішно придбали курс «${params.courseTitle}». Матеріали доступні у вашому особистому кабінеті — навчайтесь у зручному темпі.`,
        "Після завершення програми ви отримаєте сертифікат з вашим ім'ям.",
      ],
      ctaLabel: "Перейти до курсів",
      ctaUrl: params.cabinetUrl,
      footerNote: "Якщо у вас виникли питання щодо доступу, напишіть нам через особистий кабінет.",
    }),
  };
}
