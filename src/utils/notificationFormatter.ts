import { NotificationItem, StaffRole } from '../types';
import { Language } from '../i18n/translations';

export interface FormattedNotification {
  badgeLabel: string;
  title: string;
  message: string;
  contextTag: string | null;
  actorLabel: string | null;
  formattedTime: string;
  destination: string | null;
}

export function formatKigaliNotificationTimestamp(createdAt: string): string {
  if (!createdAt) return '';
  const trimmed = createdAt.trim();
  // SQLite CURRENT_TIMESTAMP returns 'YYYY-MM-DD HH:MM:SS' in UTC without timezone indicator
  const isoCandidate = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)
    ? `${trimmed.replace(' ', 'T')}Z`
    : trimmed;

  const parsed = new Date(isoCandidate);
  if (isNaN(parsed.getTime())) return trimmed;

  const datePart = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Kigali',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);

  const timePart = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kigali',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);

  return `${datePart} · ${timePart}`;
}

export function resolveNotificationLink(
  rawLink: string | undefined,
  eventType: string | undefined,
  role?: StaffRole
): string | null {
  const rolePrefix = `/dashboard/${(role || 'DIRECTOR').toLowerCase()}`;

  if (rawLink) {
    if (rawLink.startsWith('/dashboard/')) return rawLink;
    if (rawLink.startsWith('terms')) return `${rolePrefix}/${rawLink}`;
    if (rawLink === 'inventory') {
      return role === 'ANIMATOR' ? '/dashboard/animator' : `${rolePrefix}/inventory`;
    }
    if (rawLink === 'stock-in') return `${rolePrefix}/stock-in`;
    if (rawLink === 'stock-out') return `${rolePrefix}/stock-out`;
  }

  switch (eventType) {
    case 'STOCK_IN_COMPLETED':
      return `${rolePrefix}/stock-in`;
    case 'STOCK_OUT_COMPLETED':
      return `${rolePrefix}/stock-out`;
    case 'LOW_STOCK_ALERT':
      return role === 'ANIMATOR' ? '/dashboard/animator' : `${rolePrefix}/inventory`;
    case 'TERM_APPROACHING_CLOSE':
    case 'TERM_CLOSED':
    case 'CLOSING_CALCULATION_DONE':
    case 'ACADEMIC_YEAR_INITIALIZED':
    case 'STOCK_CARRY_FORWARD':
    case 'TERM_DATES_UPDATED':
    case 'TERM_CLOSED_TX_REJECTED':
      return `${rolePrefix}/terms`;
    default:
      return null;
  }
}

export function formatNotificationContent(
  n: NotificationItem,
  language: Language,
  userRole?: StaffRole
): FormattedNotification {
  let meta: Record<string, any> = {};
  if (n.meta_json) {
    try {
      meta = JSON.parse(n.meta_json);
    } catch {
      meta = {};
    }
  }

  const rw = language === 'rw';
  const eventType = n.event_type || 'GENERAL';
  const termTag =
    n.academic_year && n.term_name
      ? `${n.academic_year} · ${n.term_name}`
      : n.entity_name || null;

  let badgeLabel = rw ? 'Itangazo' : 'Notice';
  let title = n.title;
  let message = n.message;

  switch (eventType) {
    case 'STOCK_IN_COMPLETED':
      badgeLabel = rw ? 'Ibyinjiye (Stock In)' : 'Stock In';
      title = rw
        ? `Ibiribwa Byinjiye: ${meta.productName || n.entity_name || ''}`
        : `Stock In: ${meta.productName || n.entity_name || ''}`;
      message = rw
        ? `${meta.quantity ?? ''} ${meta.unit ?? ''} za ${meta.productName || ''} zagemuwe na ${meta.supplierName || 'Umugemuzi'} (${meta.termName || n.term_name || ''}).`
        : `${meta.quantity ?? ''} ${meta.unit ?? ''} of ${meta.productName || ''} received from ${meta.supplierName || 'Supplier'} (${meta.termName || n.term_name || ''}).`;
      break;

    case 'STOCK_OUT_COMPLETED':
      badgeLabel = rw ? 'Ibyasohotse (Stock Out)' : 'Stock Out';
      title = rw
        ? `Ibiribwa Byatanzwe: ${meta.productName || n.entity_name || ''}`
        : `Stock Out: ${meta.productName || n.entity_name || ''}`;
      message = rw
        ? `${meta.quantity ?? ''} ${meta.unit ?? ''} za ${meta.productName || ''} zatanzwe mu gikoni (${meta.termName || ''}). Hasigaye ${meta.remainingStock ?? ''} ${meta.unit ?? ''}.`
        : `${meta.quantity ?? ''} ${meta.unit ?? ''} of ${meta.productName || ''} issued (${meta.termName || ''}). Remaining: ${meta.remainingStock ?? ''} ${meta.unit ?? ''}.`;
      break;

    case 'LOW_STOCK_ALERT':
      badgeLabel = rw ? 'Ububiko Buri Hasi' : 'Low Stock';
      title = rw
        ? `Impuruza y’Ububiko Buke: ${meta.productName || n.entity_name || ''}`
        : `Low Stock Alert: ${meta.productName || n.entity_name || ''}`;
      message = rw
        ? `${meta.productName || ''} hasigaye ${meta.remainingStock ?? ''} ${meta.unit ?? ''} (Munsi y’urugero rwa ${meta.threshold ?? ''} ${meta.unit ?? ''}). Hakenewe kugurwa ibindi.`
        : `${meta.productName || ''} reserve fell to ${meta.remainingStock ?? ''} ${meta.unit ?? ''} (Alert threshold: ${meta.threshold ?? ''} ${meta.unit ?? ''}). Reorder recommended.`;
      break;

    case 'TERM_APPROACHING_CLOSE':
      badgeLabel = rw ? 'Igihembwe Kigira Gisoze' : 'Closing Soon';
      title = rw
        ? `${meta.termName || n.term_name || 'Igihembwe'} Kigira Gisoze (${meta.daysRemaining ?? 0} iminsi)`
        : `${meta.termName || n.term_name || 'Term'} Closing Soon (${meta.daysRemaining ?? 0}d left)`;
      message = rw
        ? `${meta.termName || ''} (${meta.academicYear || ''}) kizarangira ku itariki ${meta.endDate || ''}. Tegura ibarura rya stock ryo gusoza.`
        : `${meta.termName || ''} (${meta.academicYear || ''}) closes on ${meta.endDate || ''}. Prepare final stock counts and closing report.`;
      break;

    case 'TERM_CLOSED':
      badgeLabel = rw ? 'Igihembwe Cyafunzwe' : 'Term Closed';
      title = rw
        ? `${meta.termName || n.term_name || ''} (${meta.academicYear || n.academic_year || ''}) Cyafunzwe`
        : `${meta.termName || n.term_name || ''} (${meta.academicYear || n.academic_year || ''}) Closed`;
      message = rw
        ? `Igihembwe cyafunzwe burundu${meta.nextTermLabel ? ` kandi ibisigaye byimuriwe muri ${meta.nextTermLabel}` : ''}.`
        : `Term formally closed and locked${meta.nextTermLabel ? `. Closing balances carried forward to ${meta.nextTermLabel}` : ''}.`;
      break;

    case 'CLOSING_CALCULATION_DONE':
      badgeLabel = rw ? 'Ibarura Risoza' : 'Closing Report';
      title = rw
        ? `Ibarura Risoza ry’Igihembwe Ryarangiye`
        : `Closing Stock Calculation Done`;
      message = rw
        ? `Imibare ya Stock Isoza ku biribwa ${meta.itemsCount ?? ''} muri ${meta.termName || ''} (${meta.academicYear || ''}) yarabazwe kandi yafunzwe.`
        : `Final closing stock balances calculated & locked for ${meta.itemsCount ?? ''} food items in ${meta.termName || ''} (${meta.academicYear || ''}).`;
      break;

    case 'ACADEMIC_YEAR_INITIALIZED':
      badgeLabel = rw ? 'Umwaka Mushya' : 'New Year';
      title = rw
        ? `Umwaka w’Amashuri ${meta.academicYear || n.academic_year || ''} Watangijwe`
        : `Academic Year ${meta.academicYear || n.academic_year || ''} Initialized`;
      message = rw
        ? `Stock Itangira y’ibiribwa ${meta.itemsCount ?? ''} mu gihembwe cya 1 yashyizweho.`
        : `Term 1 opening stock initialized for ${meta.itemsCount ?? ''} food items.`;
      break;

    case 'STOCK_CARRY_FORWARD':
      badgeLabel = rw ? 'Iyimurwa rya Stock' : 'Carry Forward';
      title = rw ? 'Stock Isoza Yimuriwe mu Gihembwe Gikurikira' : 'Stock Carried Forward';
      message = rw
        ? `Ibiribwa ${meta.itemsCount ?? ''} byimuriwe kuva muri ${meta.sourceYear || ''} ${meta.sourceTerm || ''} bijya muri ${meta.targetYear || ''} ${meta.targetTerm || ''}.`
        : `${meta.itemsCount ?? ''} items carried forward from ${meta.sourceYear || ''} ${meta.sourceTerm || ''} to ${meta.targetYear || ''} ${meta.targetTerm || ''}.`;
      break;

    case 'TERM_DATES_UPDATED':
      if (meta.subAction === 'reopened') {
        badgeLabel = rw ? 'Cyafunguwe Nanone' : 'Term Reopened';
        title = rw
          ? `${meta.termName || ''} (${meta.academicYear || ''}) Cyafunguwe Kugira ngo Gikosorwe`
          : `${meta.termName || ''} (${meta.academicYear || ''}) Reopened`;
        message = rw
          ? `Cyafunguwe na ${n.actor_name || ''}. Impamvu: ${meta.reason || ''}.`
          : `Reopened for controlled revision. Reason: ${meta.reason || ''}.`;
      } else if (meta.subAction === 'created') {
        badgeLabel = rw ? 'Igihembwe Gishya' : 'Term Created';
        title = rw
          ? `${meta.termName || ''} (${meta.academicYear || ''}) Cyashyizweho`
          : `${meta.termName || ''} (${meta.academicYear || ''}) Created`;
        message = rw
          ? `Amatariki: ${meta.startDate || ''} → ${meta.endDate || ''}.`
          : `Scheduled from ${meta.startDate || ''} to ${meta.endDate || ''}.`;
      } else {
        badgeLabel = rw ? 'Amatariki Yahinduwe' : 'Dates Updated';
        title = rw
          ? `Amatariki ya ${meta.termName || ''} (${meta.academicYear || ''}) Yahinduwe`
          : `${meta.termName || ''} (${meta.academicYear || ''}) Dates Updated`;
        message = rw
          ? `Amatariki mashya y’igihembwe: ${meta.startDate || ''} → ${meta.endDate || ''}.`
          : `Schedule updated to ${meta.startDate || ''} → ${meta.endDate || ''}.`;
      }
      break;

    case 'TERM_CLOSED_TX_REJECTED':
      badgeLabel = rw ? 'Byahagaritswe (Igihembwe Gifunze)' : 'Blocked (Closed Term)';
      title = rw
        ? `Igikorwa cya ${meta.txType === 'IN' ? 'Stock In' : 'Stock Out'} Cyanzwe`
        : `${meta.txType === 'IN' ? 'Stock In' : 'Stock Out'} Blocked`;
      message = rw
        ? `Kwandika ${meta.quantity ?? ''} ${meta.unit ?? ''} (${meta.productName || ''}) ku itariki ${meta.transactionDate || ''} byanzwe kuko igihembwe gifunze cyangwa kitari gukora.`
        : `Attempted ${meta.quantity ?? ''} ${meta.unit ?? ''} (${meta.productName || ''}) on ${meta.transactionDate || ''} was rejected because the term is closed or inactive.`;
      break;

    default:
      badgeLabel = n.type === 'warning' || n.type === 'alert'
        ? rw ? 'Impuruza' : 'Alert'
        : n.type === 'success'
        ? rw ? 'Byagenze Neza' : 'Update'
        : rw ? 'Amakuru' : 'Info';
      break;
  }

  return {
    badgeLabel,
    title,
    message,
    contextTag: n.entity_name && termTag && n.entity_name !== termTag
      ? `${n.entity_name} · ${termTag}`
      : termTag || n.entity_name || null,
    actorLabel: n.actor_name || null,
    formattedTime: formatKigaliNotificationTimestamp(n.created_at),
    destination: resolveNotificationLink(n.link, eventType, userRole),
  };
}
