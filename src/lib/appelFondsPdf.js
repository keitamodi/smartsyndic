import { jsPDF } from 'jspdf';
import { formatDate, formatEUR, formatNumber } from '@/lib/format';

const ACCENT = '#d55320';
const INK = '#1c1917';
const MUTED = '#6b7280';
const LINE = '#e2ddd7';
const TINT = '#f8f3ee';

// jsPDF standard fonts n'acceptent pas les espaces fines de Intl : on les normalise.
const clean = (value) => String(value ?? '').replace(/[\u202f\u00a0]/g, ' ');

const money = (value) => clean(formatEUR(value, 2));

export const avisFileName = (invoice) => {
  const lot = String(invoice.lot_number || 'lot').replace(/[^a-zA-Z0-9-_]/g, '-');
  const period = String(invoice.period || '').replace(/\s+/g, '');
  return `avis-echeance-${lot}-${period || 'periode'}.pdf`;
};

export const buildAvisPdf = ({ invoice, building, lot, budget, share, tantiemesTotal }) => {
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
  doc.text("AVIS D'ÉCHÉANCE", RIGHT, y, { align: 'right' });
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(MUTED);
  doc.text(clean(invoice.reference), RIGHT, y + 12, { align: 'right' });

  y += 26;
  doc.setDrawColor(INK);
  doc.setLineWidth(1.2);
  doc.line(M, y, RIGHT, y);
  y += 28;

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

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(INK);
  doc.text(`Appel de fonds — ${clean(invoice.period || 'période non précisée')}`, M, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  doc.text('Répartition du budget prévisionnel voté en assemblée générale', M, y + 8);
  y += 30;

  const rows = [
    ['Lot', clean(lot?.number || invoice.lot_number || '—')],
    ['Copropriétaire', clean(lot?.owner_name || '—')],
    [
      'Tantièmes',
      lot?.tantiemes
        ? `${clean(formatNumber(lot.tantiemes, 0))} / ${clean(formatNumber(tantiemesTotal, 0))}`
        : '—',
    ],
    ['Quote-part', share != null ? `${clean(formatNumber(share * 100, 2))} %` : '—'],
    ["Date d'émission", clean(formatDate(invoice.issue_date))],
    ['Échéance', clean(formatDate(invoice.due_date))],
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
  doc.text('MONTANT À RÉGLER', M + 16, y + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#ffffff');
  doc.text(money(invoice.amount), M + 16, y + 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#fdf6f1');
  doc.text(`au plus tard le ${clean(formatDate(invoice.due_date))}`, RIGHT - 16, y + 40, { align: 'right' });
  y += 84;

  const explanation = budget
    ? `Le budget prévisionnel de ${money(budget)} a été voté en assemblée générale. ` +
      `La quote-part de votre lot est calculée au prorata de ses tantièmes, soit ` +
      `${share != null ? clean(formatNumber(share * 100, 2)) : '—'} % de ce budget pour la période ${clean(invoice.period || '')}.`.replace(/\s+/g, ' ')
    : `Montant réparti au prorata des tantièmes du lot sur la période ${clean(invoice.period || '')}.`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(INK);
  doc.text(doc.splitTextToSize(clean(explanation), RIGHT - M), M, y);
  y += 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(INK);
  doc.text('Modalités de règlement', M, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(MUTED);
  const terms = [
    `Virement bancaire en rappelant la référence ${clean(invoice.reference)}.`,
    'Chèque à l’ordre du syndicat des copropriétaires.',
    'Prélèvement automatique pour les copropriétaires inscrits.',
  ];
  terms.forEach((line) => {
    doc.text(clean(line), M, y);
    y += 13;
  });

  if (invoice.notes) {
    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(MUTED);
    doc.text(doc.splitTextToSize(clean(invoice.notes), RIGHT - M), M, y);
  }

  const footerY = H - 52;
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.8);
  doc.line(M, footerY, RIGHT, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(MUTED);
  doc.text(`Document généré le ${clean(formatDate(new Date()))} par SyndicVibe`, M, footerY + 14);
  doc.text(clean(invoice.reference), RIGHT, footerY + 14, { align: 'right' });

  return doc;
};

export const downloadAvisPdf = (payload) => {
  const doc = buildAvisPdf(payload);
  doc.save(avisFileName(payload.invoice));
};