import { jsPDF } from 'jspdf';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';

const ACCENT = '#d55320';
const INK = '#1c1917';
const MUTED = '#6b7280';
const LINE = '#e2ddd7';
const TINT = '#f8f3ee';

const clean = (value) => String(value ?? '').replace(/[\u202f\u00a0]/g, ' ');
const money = (value) => clean(formatEUR(value, 2));

export const quittanceFileName = (invoice) =>
  `recu-liberatoire-${String(invoice.lot_number || 'lot').replace(/[^a-zA-Z0-9-_]/g, '-')}-${String(
    invoice.period || '',
  ).replace(/\s+/g, '') || 'periode'}.pdf`;

export const buildQuittancePdf = ({ invoice, building, lot, paidDate }) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 46;
  const RIGHT = W - M;
  let y = 58;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(ACCENT);
  doc.text('SYNDICVIBE', M, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text('Gestion de copropriété', M, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(INK);
  doc.text('REÇU LIBÉRATOIRE', RIGHT, y, { align: 'right' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text(clean(invoice.reference), RIGHT, y + 12, { align: 'right' });

  y += 26;
  doc.setDrawColor(INK);
  doc.setLineWidth(1.2);
  doc.line(M, y, RIGHT, y);
  y += 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(INK);
  doc.text(clean(building?.name || invoice.building_name || 'Immeuble'), M, y);
  y += 14;
  const addressLines = [
    building?.address,
    [building?.postal_code, building?.city].filter(Boolean).join(' '),
  ].filter(Boolean);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(MUTED);
  addressLines.forEach((line) => {
    doc.text(clean(line), M, y);
    y += 12;
  });

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(INK);
  doc.text(`Appel de fonds ${clean(invoice.period || '')}`, M, y);
  y += 26;

  const rows = [
    ['Copropriétaire', clean(lot?.owner_name || '—')],
    ['Lot', clean(lot?.number || invoice.lot_number || '—')],
    ['Émission', clean(formatDate(invoice.issue_date))],
    ['Règlement', clean(formatDate(paidDate))],
    ['Mode', 'Virement / prélèvement'],
  ];
  const rowH = 18;
  const boxH = rows.length * rowH + 16;
  doc.setFillColor(TINT);
  doc.roundedRect(M, y, RIGHT - M, boxH, 6, 6, 'F');
  let ry = y + 20;
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(MUTED);
    doc.text(label, M + 14, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(INK);
    doc.text(value, M + 150, ry);
    ry += rowH;
  });
  y += boxH + 24;

  doc.setFillColor(ACCENT);
  doc.roundedRect(M, y, RIGHT - M, 58, 6, 6, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor('#fdf6f1');
  doc.text('SOMME RÉGLÉE', M + 16, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#ffffff');
  doc.text(money(invoice.paid_amount || invoice.amount), M + 16, y + 44);
  y += 84;

  const statement =
    `Nous accusons réception de la somme de ${money(invoice.paid_amount || invoice.amount)} au titre de l'appel de fonds ` +
    `${clean(invoice.period || '')} du lot ${clean(lot?.number || invoice.lot_number || '')}, intégralement réglé le ` +
    `${clean(formatDate(paidDate))}. Ce reçu libère le copropriétaire de toute obligation de paiement pour cette échéance.`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(INK);
  doc.text(doc.splitTextToSize(clean(statement), RIGHT - M), M, y);

  y += 70;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text('Pour le syndicat des copropriétaires,', M, y);
  doc.setFontSize(8);
  doc.text('Signature et cachet du syndic', M, y + 44);

  const footerY = H - 52;
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.8);
  doc.line(M, footerY, RIGHT, footerY);
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED);
  doc.text(`Document généré le ${clean(formatDate(new Date()))} par SyndicVibe`, M, footerY + 14);
  doc.text(clean(invoice.reference), RIGHT, footerY + 14, { align: 'right' });

  return doc;
};

export const downloadQuittancePdf = (payload) => {
  buildQuittancePdf(payload).save(quittanceFileName(payload.invoice));
};

export const formatShare = (share) => `${clean(formatNumber(share * 100, 2))} %`;