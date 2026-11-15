export const phoneDigits = (phone) => String(phone || '').replace(/[^\d+]/g, '');

export const phoneHref = (phone) => `tel:${phoneDigits(phone)}`;

const internationalDigits = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return `33${digits.slice(1)}`;
  return digits;
};

export const whatsappHref = (phone, message) => {
  const digits = internationalDigits(phone);
  if (!digits) return '';
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
};

export const mailtoHref = (email, subject) => {
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${email}${params}`;
};

export const gmailHref = (email, subject) =>
  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}${
    subject ? `&su=${encodeURIComponent(subject)}` : ''
  }`;

export const outlookHref = (email, subject) =>
  `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(email)}${
    subject ? `&subject=${encodeURIComponent(subject)}` : ''
  }`;

export const officeHref = (email, subject) =>
  `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}${
    subject ? `&subject=${encodeURIComponent(subject)}` : ''
  }`;