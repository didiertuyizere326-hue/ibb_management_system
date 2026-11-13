import { db } from '../db';
import { getKigaliDate, logAudit, createNotification } from '../auth';

export const MIN_ACADEMIC_START_YEAR = 2022;
export const MAX_ACADEMIC_START_YEAR = 2049;

export interface AcademicYearBounds {
  academicYear: string;
  startYear: number;
  endYear: number;
}

export function generateSupportedAcademicYears(): string[] {
  const years: string[] = [];
  for (let y = MIN_ACADEMIC_START_YEAR; y <= MAX_ACADEMIC_START_YEAR; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
}

export function parseAcademicYear(academicYear: string): AcademicYearBounds | null {
  if (!academicYear || typeof academicYear !== 'string') return null;
  const match = academicYear.trim().match(/^(\d{4})-(\d{4})$/);
  if (!match) return null;

  const startYear = parseInt(match[1], 10);
  const endYear = parseInt(match[2], 10);

  if (
    endYear !== startYear + 1 ||
    startYear < MIN_ACADEMIC_START_YEAR ||
    startYear > MAX_ACADEMIC_START_YEAR
  ) {
    return null;
  }

  return {
    academicYear: `${startYear}-${endYear}`,
    startYear,
    endYear,
  };
}

export function getPreviousAcademicYear(academicYear: string): string | null {
  const parsed = parseAcademicYear(academicYear);
  if (!parsed || parsed.startYear <= MIN_ACADEMIC_START_YEAR) return null;
  return `${parsed.startYear - 1}-${parsed.startYear}`;
}

export function getNextAcademicYear(academicYear: string): string | null {
  const parsed = parseAcademicYear(academicYear);
  if (!parsed || parsed.startYear >= MAX_ACADEMIC_START_YEAR) return null;
  return `${parsed.startYear + 1}-${parsed.endYear + 1}`;
}

export function getDefaultTermDates(academicYear: string, termNumber: 1 | 2 | 3): { startDate: string; endDate: string; name: string } {
  const parsed = parseAcademicYear(academicYear);
  if (!parsed) {
    throw new Error(`Invalid academic year: ${academicYear}. Supported range is 2022-2023 to 2049-2050.`);
  }
  const { startYear, endYear } = parsed;

  if (termNumber === 1) {
    return {
      name: 'Term 1',
      startDate: `${startYear}-09-07`,
      endDate: `${startYear}-12-18`,
    };
  }
  if (termNumber === 2) {
    return {
      name: 'Term 2',
      startDate: `${endYear}-01-11`,
      endDate: `${endYear}-04-02`,
    };
  }
  return {
    name: 'Term 3',
    startDate: `${endYear}-04-19`,
    endDate: `${endYear}-07-16`,
  };
}

/**
 * Resolves the active Kigali academic year based on current date (Sept-Aug cycle).
 */
export function getCurrentKigaliAcademicYear(todayKigali: string = getKigaliDate()): string {
  const year = parseInt(todayKigali.slice(0, 4), 10);
  const month = parseInt(todayKigali.slice(5, 7), 10);
  const startYear = month >= 9 ? year : year - 1;
  const clampedStart = Math.max(MIN_ACADEMIC_START_YEAR, Math.min(MAX_ACADEMIC_START_YEAR, startYear));
  return `${clampedStart}-${clampedStart + 1}`;
}

/**
 * Ensures the 3 terms (Term 1, Term 2, Term 3) exist for a valid academic year.
 * Does NOT fabricate stock records.
 */
export function ensureAcademicYearTerms(academicYear: string): any[] {
  const parsed = parseAcademicYear(academicYear);
  if (!parsed) {
    throw new Error(`Academic year "${academicYear}" is outside the supported 2022-2023 to 2049-2050 range.`);
  }

  const today = getKigaliDate();
  const existing = db
    .prepare('SELECT * FROM academic_terms WHERE academic_year = ? ORDER BY term_number ASC')
    .all(parsed.academicYear) as any[];

  if (existing.length < 3) {
    const insertTerm = db.prepare(`
      INSERT OR IGNORE INTO academic_terms (academic_year, term_number, name, start_date, end_date, status, opening_initialized)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `);

    for (const num of [1, 2, 3] as const) {
      const defaults = getDefaultTermDates(parsed.academicYear, num);
      let initialStatus: 'Upcoming' | 'Active' | 'Closed' = 'Upcoming';
      if (today > defaults.endDate) {
        initialStatus = 'Closed';
      } else if (today >= defaults.startDate && today <= defaults.endDate) {
        initialStatus = 'Active';
      }
      insertTerm.run(
        parsed.academicYear,
        num,
        defaults.name,
        defaults.startDate,
        defaults.endDate,
        initialStatus
      );
    }
  }

  return db
    .prepare('SELECT * FROM academic_terms WHERE academic_year = ? ORDER BY term_number ASC')
    .all(parsed.academicYear) as any[];
}

export function getPreviousTermRow(term: any): any | null {
  if (!term) return null;
  if (term.term_number > 1) {
    return (
      db
        .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = ?')
        .get(term.academic_year, term.term_number - 1) || null
    );
  }
  const prevYear = getPreviousAcademicYear(term.academic_year);
  if (!prevYear) return null;
  return (
    db
      .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = 3')
      .get(prevYear) || null
  );
}

export function getNextTermRow(term: any, createNextYearIfNeeded = false): any | null {
  if (!term) return null;
  if (term.term_number < 3) {
    return (
      db
        .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = ?')
        .get(term.academic_year, term.term_number + 1) || null
    );
  }
  const nextYear = getNextAcademicYear(term.academic_year);
  if (!nextYear) return null;
  if (createNextYearIfNeeded) {
    ensureAcademicYearTerms(nextYear);
  }
  return (
    db
      .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = 1')
      .get(nextYear) || null
  );
}

export function computeTermProductStats(term: any, product: any): {
  openingStock: number;
  receivedQuantity: number;
  issuedQuantity: number;
  closingStock: number;
  record: any | null;
} {
  const record = db
    .prepare('SELECT * FROM term_stock_records WHERE term_id = ? AND product_id = ?')
    .get(term.id, product.id) as any;

  const inQty = (
    db
      .prepare(
        `
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM stock_in
        WHERE product_id = ?
          AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))
      `
      )
      .get(product.id, term.id, term.start_date, term.end_date) as any
  ).total;

  const outQty = (
    db
      .prepare(
        `
        SELECT COALESCE(SUM(quantity), 0) as total
        FROM stock_out
        WHERE product_id = ?
          AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))
      `
      )
      .get(product.id, term.id, term.start_date, term.end_date) as any
  ).total;

  let openingStock = 0;
  if (record) {
    openingStock = Number(record.opening_stock) || 0;
  } else {
    const prevTerm = getPreviousTermRow(term);
    if (prevTerm) {
      const prevRecord = db
        .prepare('SELECT closing_stock FROM term_stock_records WHERE term_id = ? AND product_id = ?')
        .get(prevTerm.id, product.id) as any;
      if (prevRecord) {
        openingStock = Number(prevRecord.closing_stock) || 0;
      }
    }
  }

  const closingStock =
    term.status === 'Closed' && record?.is_locked === 1
      ? Number(record.closing_stock) || 0
      : Math.max(0, openingStock + inQty - outQty);

  return {
    openingStock,
    receivedQuantity: inQty,
    issuedQuantity: outQty,
    closingStock,
    record: record || null,
  };
}

export function diffDaysYMD(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split('-').map(Number);
  const [ty, tm, td] = toYmd.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86400000);
}

/**
 * Computes truthful per-product and term-level financial valuation.
 * Never fabricates unit costs when purchase cost data has not been recorded.
 */
export function computeTermFinancialReport(term: any, products: any[]) {
  const stockInAggRows = db
    .prepare(
      `
      SELECT
        product_id,
        COALESCE(SUM(CASE WHEN unit_cost > 0 THEN total_cost ELSE 0 END), 0) as priced_total_cost,
        COALESCE(SUM(CASE WHEN unit_cost > 0 THEN quantity ELSE 0 END), 0) as priced_qty,
        SUM(CASE WHEN unit_cost <= 0 THEN 1 ELSE 0 END) as unpriced_in_count,
        COUNT(*) as in_tx_count
      FROM stock_in
      WHERE term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?)
      GROUP BY product_id
    `
    )
    .all(term.id, term.start_date, term.end_date) as any[];

  const inAggMap = new Map<number, any>(stockInAggRows.map((r) => [r.product_id, r]));

  let totalStockInValueSum = 0;
  let totalStockOutValueSum = 0;
  let totalClosingValueSum = 0;

  let pricedInItemsCount = 0;
  let unpricedInItemsCount = 0;
  let pricedOutItemsCount = 0;
  let unpricedOutItemsCount = 0;
  let pricedClosingItemsCount = 0;
  let unpricedClosingItemsCount = 0;
  const missingCostProducts: string[] = [];

  const items = products.map((prod) => {
    const stats = computeTermProductStats(term, prod);
    const inAgg = inAggMap.get(prod.id);

    const avgCost = Number(prod.avg_unit_cost) || 0;
    const pricedInQty = Number(inAgg?.priced_qty) || 0;
    const pricedTotalCost = Number(inAgg?.priced_total_cost) || 0;
    const unpricedInCount = Number(inAgg?.unpriced_in_count) || 0;
    const inTxCount = Number(inAgg?.in_tx_count) || 0;

    let reliableUnitCost: number | null = null;
    if (avgCost > 0) {
      reliableUnitCost = Math.round(avgCost * 100) / 100;
    } else if (pricedInQty > 0) {
      reliableUnitCost = Math.round((pricedTotalCost / pricedInQty) * 100) / 100;
    }

    const hasUnitCost = reliableUnitCost !== null;

    let stockInValue: number | null = 0;
    if (stats.receivedQuantity > 0 || inTxCount > 0) {
      if (pricedTotalCost > 0) {
        stockInValue = Math.round(pricedTotalCost);
        pricedInItemsCount++;
        if (unpricedInCount > 0) {
          unpricedInItemsCount++;
        }
      } else {
        stockInValue = null;
        unpricedInItemsCount++;
      }
    }

    let stockOutValue: number | null = 0;
    if (stats.issuedQuantity > 0) {
      if (reliableUnitCost !== null) {
        stockOutValue = Math.round(stats.issuedQuantity * reliableUnitCost);
        pricedOutItemsCount++;
      } else {
        stockOutValue = null;
        unpricedOutItemsCount++;
      }
    }

    let closingValue: number | null = 0;
    if (stats.closingStock > 0) {
      if (reliableUnitCost !== null) {
        closingValue = Math.round(stats.closingStock * reliableUnitCost);
        pricedClosingItemsCount++;
      } else {
        closingValue = null;
        unpricedClosingItemsCount++;
      }
    }

    if (
      !hasUnitCost &&
      (stats.openingStock > 0 || stats.receivedQuantity > 0 || stats.issuedQuantity > 0 || stats.closingStock > 0)
    ) {
      missingCostProducts.push(prod.name);
    }

    if (stockInValue !== null) totalStockInValueSum += stockInValue;
    if (stockOutValue !== null) totalStockOutValueSum += stockOutValue;
    if (closingValue !== null) totalClosingValueSum += closingValue;

    const stockStatus =
      stats.closingStock <= 0
        ? 'OUT_OF_STOCK'
        : stats.closingStock <= prod.min_stock_alert
        ? 'LOW_STOCK'
        : 'NORMAL';

    return {
      id: prod.id,
      term_id: term.id,
      productId: prod.id,
      product_id: prod.id,
      name: prod.name,
      product_name: prod.name,
      category: prod.category,
      unit: prod.unit,
      avgUnitCost: reliableUnitCost,
      unit_cost: reliableUnitCost,
      has_unit_cost: hasUnitCost,
      currentWarehouseStock: prod.current_stock,
      openingStock: stats.openingStock,
      opening_stock: stats.openingStock,
      receivedQuantity: stats.receivedQuantity,
      received_quantity: stats.receivedQuantity,
      issuedQuantity: stats.issuedQuantity,
      issued_quantity: stats.issuedQuantity,
      closingStock: stats.closingStock,
      closing_stock: stats.closingStock,
      stock_in_value: stockInValue,
      stock_out_value: stockOutValue,
      closing_value: closingValue,
      totalValuation: closingValue ?? 0,
      total_value: closingValue ?? 0,
      minStockAlert: prod.min_stock_alert,
      min_stock_alert: prod.min_stock_alert,
      stockStatus,
      stock_status: stockStatus,
      isLocked: term.status === 'Closed' ? 1 : stats.record ? stats.record.is_locked : 0,
      is_locked: term.status === 'Closed' ? 1 : stats.record ? stats.record.is_locked : 0,
    };
  });

  const totalReceivedQty = items.reduce((s, i) => s + i.received_quantity, 0);
  const totalIssuedQty = items.reduce((s, i) => s + i.issued_quantity, 0);
  const totalClosingQty = items.reduce((s, i) => s + i.closing_stock, 0);

  const totalStockInValue =
    totalReceivedQty === 0 ? 0 : pricedInItemsCount > 0 ? totalStockInValueSum : null;
  const totalStockOutValue =
    totalIssuedQty === 0 ? 0 : pricedOutItemsCount > 0 ? totalStockOutValueSum : null;
  const totalClosingValue =
    totalClosingQty === 0 ? 0 : pricedClosingItemsCount > 0 ? totalClosingValueSum : null;

  const hasAnyMissing =
    unpricedInItemsCount > 0 || unpricedOutItemsCount > 0 || unpricedClosingItemsCount > 0;
  const hasAnyPriced =
    pricedInItemsCount > 0 || pricedOutItemsCount > 0 || pricedClosingItemsCount > 0;

  let valuationStatus: 'COMPLETE' | 'PARTIAL' | 'UNAVAILABLE' = 'COMPLETE';
  if (hasAnyMissing) {
    valuationStatus = hasAnyPriced ? 'PARTIAL' : 'UNAVAILABLE';
  }

  return {
    items,
    summary: {
      totalProducts: items.length,
      totalOpeningQuantity: items.reduce((s, i) => s + i.opening_stock, 0),
      totalReceivedQuantity: totalReceivedQty,
      totalIssuedQuantity: totalIssuedQty,
      totalClosingQuantity: totalClosingQty,
      totalValuation: totalClosingValue,
      normalCount: items.filter((i) => i.stock_status === 'NORMAL').length,
      lowStockCount: items.filter((i) => i.stock_status === 'LOW_STOCK').length,
      outOfStockCount: items.filter((i) => i.stock_status === 'OUT_OF_STOCK').length,
    },
    financialSummary: {
      totalStockInValue,
      totalStockOutValue,
      totalClosingValue,
      hasUnpricedStockIn: unpricedInItemsCount > 0,
      hasUnpricedStockOut: unpricedOutItemsCount > 0,
      hasUnpricedClosing: unpricedClosingItemsCount > 0,
      missingCostProducts,
      valuationStatus,
    },
  };
}

/**
 * Carries forward closing stock from `sourceTermId` -> opening stock of `targetTermId`.
 * Runs inside an atomic transaction and is idempotent (only refreshes if `allowRefreshFromReclose`
 * is explicitly passed and targetTerm was originally carried from sourceTerm and is not Closed).
 */
export function carryForwardTermBalances(
  sourceTermId: number,
  targetTermId: number,
  actor?: { id?: number; fullName?: string; role?: string },
  allowRefreshFromReclose = false
): { carried: boolean; itemsCount: number; reason?: string } {
  const tx = db.transaction(() => {
    const sourceTerm = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(sourceTermId) as any;
    const targetTerm = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(targetTermId) as any;

    if (!sourceTerm || !targetTerm) {
      return { carried: false, itemsCount: 0, reason: 'Source or target term not found.' };
    }

    const canRefreshExistingCarry =
      allowRefreshFromReclose &&
      targetTerm.opening_initialized === 1 &&
      targetTerm.carried_from_term_id === sourceTerm.id &&
      targetTerm.status !== 'Closed';

    if (targetTerm.opening_initialized === 1 && !canRefreshExistingCarry) {
      return {
        carried: false,
        itemsCount: 0,
        reason: `${targetTerm.name} (${targetTerm.academic_year}) opening stock is already initialized.`,
      };
    }

    if (targetTerm.status === 'Closed') {
      return {
        carried: false,
        itemsCount: 0,
        reason: `${targetTerm.name} (${targetTerm.academic_year}) is already closed.`,
      };
    }

    const sourceRecordCount = (
      db.prepare('SELECT COUNT(*) as count FROM term_stock_records WHERE term_id = ?').get(sourceTerm.id) as any
    ).count;

    if (sourceRecordCount === 0) {
      return {
        carried: false,
        itemsCount: 0,
        reason: `${sourceTerm.name} (${sourceTerm.academic_year}) has no stock records to carry forward.`,
      };
    }

    const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC').all() as any[];
    const upsertTargetRecord = canRefreshExistingCarry
      ? db.prepare(`
          INSERT INTO term_stock_records (
            term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(term_id, product_id) DO UPDATE SET
            opening_stock = excluded.opening_stock,
            received_quantity = excluded.received_quantity,
            issued_quantity = excluded.issued_quantity,
            closing_stock = excluded.closing_stock,
            notes = excluded.notes,
            updated_at = CURRENT_TIMESTAMP
          WHERE term_stock_records.is_locked = 0
        `)
      : db.prepare(`
          INSERT INTO term_stock_records (
            term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(term_id, product_id) DO NOTHING
        `);

    let itemsCount = 0;
    for (const prod of products) {
      const sourceStats = computeTermProductStats(sourceTerm, prod);
      const openingForTarget = sourceStats.closingStock;

      const targetIn = (
        db
          .prepare(
            `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_in WHERE product_id = ? AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))`
          )
          .get(prod.id, targetTerm.id, targetTerm.start_date, targetTerm.end_date) as any
      ).total;

      const targetOut = (
        db
          .prepare(
            `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_out WHERE product_id = ? AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))`
          )
          .get(prod.id, targetTerm.id, targetTerm.start_date, targetTerm.end_date) as any
      ).total;

      const targetClosing = Math.max(0, openingForTarget + targetIn - targetOut);
      upsertTargetRecord.run(
        targetTerm.id,
        prod.id,
        openingForTarget,
        targetIn,
        targetOut,
        targetClosing,
        prod.unit,
        `Carried forward from ${sourceTerm.academic_year} ${sourceTerm.name}`
      );
      itemsCount++;
    }

    db.prepare(`
      UPDATE academic_terms
      SET opening_initialized = 1,
          carried_from_term_id = ?,
          carried_forward_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(sourceTerm.id, targetTerm.id);

    return { carried: true, itemsCount };
  });

  const result = tx();
  if (result.carried) {
    const sourceTerm = db.prepare('SELECT id, academic_year, name FROM academic_terms WHERE id = ?').get(sourceTermId) as any;
    const targetTerm = db.prepare('SELECT id, academic_year, name FROM academic_terms WHERE id = ?').get(targetTermId) as any;
    const actorDisplay = actor?.fullName || 'System Carry-Forward';

    logAudit({
      userId: actor?.id,
      userName: actorDisplay,
      userRole: actor?.role || 'SYSTEM',
      action: 'STOCK_CARRY_FORWARD',
      recordType: 'ACADEMIC_TERM',
      recordId: String(targetTermId),
      details: `Carried forward closing stock for ${result.itemsCount} products from ${sourceTerm?.academic_year} ${sourceTerm?.name} to ${targetTerm?.academic_year} ${targetTerm?.name}.`,
    });

    createNotification({
      title: 'Stock Carried Forward to Next Term',
      message: `Closing balances (${result.itemsCount} items) carried forward from ${sourceTerm?.name} (${sourceTerm?.academic_year}) to ${targetTerm?.name} (${targetTerm?.academic_year}).`,
      type: 'success',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(targetTerm?.academic_year || '')}&termId=${targetTerm?.id || ''}`,
      eventType: 'STOCK_CARRY_FORWARD',
      entityName: `${targetTerm?.name} (${targetTerm?.academic_year})`,
      academicYear: targetTerm?.academic_year,
      termName: targetTerm?.name,
      actorName: actorDisplay,
      meta: {
        sourceYear: sourceTerm?.academic_year,
        sourceTerm: sourceTerm?.name,
        targetYear: targetTerm?.academic_year,
        targetTerm: targetTerm?.name,
        itemsCount: result.itemsCount,
      },
      dedupeKey: `CARRY_FORWARD:${sourceTermId}:${targetTermId}`,
      dedupeWindowMinutes: 10,
    });
  }
  return result;
}

/**
 * Closes and permanently locks an academic term, calculates final closing stocks,
 * and triggers automatic carry-forward to the next term (or next academic year's Term 1).
 */
export function lockAndCloseTerm(
  termId: number,
  options: {
    userId?: number;
    userName?: string;
    userRole?: string;
    closingNotes?: string;
    isAutoClose?: boolean;
  } = {}
): { alreadyClosed: boolean; nextTermCarriedForward: boolean; nextTermLabel?: string; itemsCount?: number } {
  const tx = db.transaction(() => {
    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) {
      throw new Error('Academic term not found.');
    }

    if (term.status === 'Closed' && term.closed_at) {
      db.prepare('UPDATE term_stock_records SET is_locked = 1 WHERE term_id = ? AND is_locked = 0').run(term.id);
      return { alreadyClosed: true, term, hasStockRecords: false, itemsCount: 0 };
    }

    const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all() as any[];
    const hasExistingRecordsOrTx =
      (db.prepare('SELECT COUNT(*) as c FROM term_stock_records WHERE term_id = ?').get(term.id) as any).c > 0 ||
      (db.prepare('SELECT COUNT(*) as c FROM stock_in WHERE term_id = ?').get(term.id) as any).c > 0 ||
      (db.prepare('SELECT COUNT(*) as c FROM stock_out WHERE term_id = ?').get(term.id) as any).c > 0 ||
      term.opening_initialized === 1;

    let itemsCount = 0;
    if (hasExistingRecordsOrTx || !options.isAutoClose) {
      const upsertRecord = db.prepare(`
        INSERT INTO term_stock_records (
          term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(term_id, product_id) DO UPDATE SET
          opening_stock = CASE WHEN term_stock_records.is_locked = 1 THEN term_stock_records.opening_stock ELSE excluded.opening_stock END,
          received_quantity = CASE WHEN term_stock_records.is_locked = 1 THEN term_stock_records.received_quantity ELSE excluded.received_quantity END,
          issued_quantity = CASE WHEN term_stock_records.is_locked = 1 THEN term_stock_records.issued_quantity ELSE excluded.issued_quantity END,
          closing_stock = CASE WHEN term_stock_records.is_locked = 1 THEN term_stock_records.closing_stock ELSE excluded.closing_stock END,
          is_locked = 1,
          notes = COALESCE(excluded.notes, term_stock_records.notes),
          updated_at = CURRENT_TIMESTAMP
      `);

      for (const prod of products) {
        const stats = computeTermProductStats(term, prod);
        upsertRecord.run(
          term.id,
          prod.id,
          stats.openingStock,
          stats.receivedQuantity,
          stats.issuedQuantity,
          stats.closingStock,
          prod.unit,
          options.closingNotes?.trim() || null
        );
        itemsCount++;
      }
    }

    db.prepare(`
      UPDATE academic_terms
      SET status = 'Closed',
          manual_reopen = 0,
          closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP),
          closed_by = COALESCE(closed_by, ?),
          closed_by_name = COALESCE(closed_by_name, ?),
          closing_notes = COALESCE(?, closing_notes),
          opening_initialized = CASE WHEN ? THEN 1 ELSE opening_initialized END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      options.userId || null,
      options.userName || 'System Schedule Lock (Africa/Kigali)',
      options.closingNotes?.trim() || null,
      hasExistingRecordsOrTx || !options.isAutoClose ? 1 : 0,
      term.id
    );

    return {
      alreadyClosed: false,
      term,
      hasStockRecords: hasExistingRecordsOrTx || !options.isAutoClose,
      itemsCount,
    };
  });

  const outcome = tx();

  if (outcome.alreadyClosed) {
    return { alreadyClosed: true, nextTermCarriedForward: false };
  }

  let nextTermCarriedForward = false;
  let nextTermLabel: string | undefined;
  const actorDisplay = options.userName || 'System Schedule Lock (Africa/Kigali)';

  if (outcome.hasStockRecords) {
    createNotification({
      title: `Term Closing Calculation Complete`,
      message: `Final closing stock balances calculated & locked for ${outcome.itemsCount} food items in ${outcome.term.name} (${outcome.term.academic_year}).`,
      type: 'success',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(outcome.term.academic_year)}&termId=${outcome.term.id}`,
      eventType: 'CLOSING_CALCULATION_DONE',
      entityName: `${outcome.term.name} (${outcome.term.academic_year})`,
      academicYear: outcome.term.academic_year,
      termName: outcome.term.name,
      actorName: actorDisplay,
      meta: {
        termName: outcome.term.name,
        academicYear: outcome.term.academic_year,
        itemsCount: outcome.itemsCount,
      },
      dedupeKey: `CLOSING_CALC:${outcome.term.id}`,
      dedupeWindowMinutes: 10,
    });

    const nextTerm = getNextTermRow(outcome.term, true);
    const canCarryToNext =
      nextTerm &&
      nextTerm.status !== 'Closed' &&
      (nextTerm.opening_initialized === 0 || nextTerm.carried_from_term_id === outcome.term.id);

    if (canCarryToNext) {
      const cf = carryForwardTermBalances(
        outcome.term.id,
        nextTerm.id,
        {
          id: options.userId,
          fullName: options.userName,
          role: options.userRole,
        },
        nextTerm.opening_initialized === 1
      );
      nextTermCarriedForward = cf.carried;
      if (cf.carried) {
        nextTermLabel = `${nextTerm.academic_year} ${nextTerm.name}`;
      }
    }
  }

  createNotification({
    title: `${outcome.term.name} (${outcome.term.academic_year}) Closed & Locked`,
    message: `${outcome.term.name} (${outcome.term.academic_year}) has been formally closed by ${actorDisplay}.${nextTermCarriedForward ? ` Closing balances carried forward to ${nextTermLabel}.` : ''}`,
    type: 'info',
    targetRole: 'ALL',
    link: `terms?year=${encodeURIComponent(outcome.term.academic_year)}&termId=${outcome.term.id}`,
    eventType: 'TERM_CLOSED',
    entityName: `${outcome.term.name} (${outcome.term.academic_year})`,
    academicYear: outcome.term.academic_year,
    termName: outcome.term.name,
    actorName: actorDisplay,
    meta: {
      termName: outcome.term.name,
      academicYear: outcome.term.academic_year,
      endDate: outcome.term.end_date,
      nextTermLabel: nextTermLabel || null,
      isAutoClose: Boolean(options.isAutoClose),
    },
    dedupeKey: `TERM_CLOSED:${outcome.term.id}`,
    dedupeWindowMinutes: 10,
  });

  logAudit({
    userId: options.userId,
    userName: actorDisplay,
    userRole: options.userRole || 'SYSTEM',
    action: options.isAutoClose ? 'TERM_AUTO_CLOSED_BY_DATE' : 'TERM_STOCK_CLOSED',
    recordType: 'ACADEMIC_TERM',
    recordId: String(termId),
    details: `${outcome.term.name} (${outcome.term.academic_year}) closed & locked.${nextTermCarriedForward ? ` Carried forward to ${nextTermLabel}.` : ''}`,
  });

  return {
    alreadyClosed: false,
    nextTermCarriedForward,
    nextTermLabel,
    itemsCount: outcome.itemsCount,
  };
}

/**
 * Controlled administrative reopening of a Closed academic term.
 * Requires audit reason, protects chronological continuity, preserves prior snapshot in audit log,
 * unlocks term_stock_records, and marks manual_reopen if today > end_date so lifecycle sync does not immediately re-lock it.
 */
export function reopenClosedTerm(
  termId: number,
  options: {
    userId: number;
    userName: string;
    userRole: string;
    reason: string;
    newEndDate?: string;
  }
): { term: any; statusCode?: number; error?: string } {
  const reason = (options.reason || '').trim();
  if (reason.length < 5) {
    return {
      term: null,
      statusCode: 400,
      error: 'A clear audit reason (minimum 5 characters) is required to reopen a closed term.',
    };
  }

  const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
  if (!term) {
    return { term: null, statusCode: 404, error: 'Academic term was not found.' };
  }

  if (term.status !== 'Closed') {
    return {
      term: null,
      statusCode: 400,
      error: `${term.name} (${term.academic_year}) is currently ${term.status}, not Closed.`,
    };
  }

  // Chronological safety: block if the subsequent term is already Closed
  const nextTerm = getNextTermRow(term, false);
  if (nextTerm && nextTerm.status === 'Closed') {
    return {
      term: null,
      statusCode: 409,
      error: `Cannot reopen ${term.name} (${term.academic_year}) while ${nextTerm.name} (${nextTerm.academic_year}) is already closed. Reopen later closed terms first to preserve stock continuity.`,
    };
  }

  const today = getKigaliDate();
  const effectiveEndDate = options.newEndDate?.trim() || term.end_date;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveEndDate)) {
    return { term: null, statusCode: 400, error: 'Closing date must be formatted as YYYY-MM-DD.' };
  }
  if (term.start_date >= effectiveEndDate) {
    return { term: null, statusCode: 400, error: 'Closing date must be after the Opening date.' };
  }

  // Sibling overlap check if end_date changed
  const nextSibling = db
    .prepare(
      'SELECT * FROM academic_terms WHERE academic_year = ? AND term_number > ? ORDER BY term_number ASC LIMIT 1'
    )
    .get(term.academic_year, term.term_number) as any;
  if (nextSibling && effectiveEndDate >= nextSibling.start_date) {
    return {
      term: null,
      statusCode: 400,
      error: `Closing date (${effectiveEndDate}) must precede ${nextSibling.name} opening date (${nextSibling.start_date}).`,
    };
  }

  const snapshotRows = db
    .prepare(
      `SELECT r.product_id, p.name as product_name, r.opening_stock, r.received_quantity, r.issued_quantity, r.closing_stock
       FROM term_stock_records r
       JOIN products p ON r.product_id = p.id
       WHERE r.term_id = ?`
    )
    .all(term.id) as any[];

  const restoredStatus: 'Active' | 'Upcoming' = today < term.start_date ? 'Upcoming' : 'Active';
  const keepManualReopen = today > effectiveEndDate ? 1 : 0;

  const tx = db.transaction(() => {
    db.prepare('UPDATE term_stock_records SET is_locked = 0, updated_at = CURRENT_TIMESTAMP WHERE term_id = ?').run(
      term.id
    );

    db.prepare(`
      UPDATE academic_terms
      SET status = ?,
          end_date = ?,
          closed_at = NULL,
          manual_reopen = ?,
          reopened_at = CURRENT_TIMESTAMP,
          reopened_by = ?,
          reopened_by_name = ?,
          reopen_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      restoredStatus,
      effectiveEndDate,
      keepManualReopen,
      options.userId,
      options.userName,
      reason,
      term.id
    );
  });

  tx();

  const updatedTerm = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(term.id) as any;

  logAudit({
    userId: options.userId,
    userName: options.userName,
    userRole: options.userRole,
    action: 'TERM_REOPENED',
    recordType: 'ACADEMIC_TERM',
    recordId: String(term.id),
    details: `${term.academic_year} ${term.name} reopened by ${options.userName} (${options.userRole}). Reason: "${reason}". Closing date: ${effectiveEndDate}. Prior snapshot (${snapshotRows.length} items): ${JSON.stringify(snapshotRows.slice(0, 12))}`,
  });

  createNotification({
    title: `${term.name} (${term.academic_year}) Reopened for Revision`,
    message: `${term.name} (${term.academic_year}) was reopened by ${options.userName}. Reason: ${reason}.`,
    type: 'warning',
    targetRole: 'ALL',
    link: `terms?year=${encodeURIComponent(term.academic_year)}&termId=${term.id}`,
    eventType: 'TERM_DATES_UPDATED',
    entityName: `${term.name} (${term.academic_year})`,
    academicYear: term.academic_year,
    termName: term.name,
    actorName: options.userName,
    meta: {
      subAction: 'reopened',
      termName: term.name,
      academicYear: term.academic_year,
      startDate: updatedTerm.start_date,
      endDate: updatedTerm.end_date,
      reason,
    },
  });

  return { term: updatedTerm };
}

/**
 * Synchronizes academic terms against current Africa/Kigali date:
 *  - Ensures terms exist for the requested academic year
 *  - Automatically locks any term past its closing date (today > end_date), unless manually reopened
 *  - Sets terms within [start_date, end_date] to 'Active' (unless manually closed)
 *  - Sets terms before start_date to 'Upcoming'
 *  - Emits deduplicated approaching-closing reminders when <= 7 days remain
 *  - Triggers single-run carry-forward when a preceding term with stock records is closed
 */
export function syncAcademicTermsLifecycle(academicYear?: string, todayOverride?: string): string {
  const today = todayOverride || getKigaliDate();
  const targetYear = academicYear && parseAcademicYear(academicYear)
    ? academicYear
    : getCurrentKigaliAcademicYear(today);

  ensureAcademicYearTerms(targetYear);

  const prevYear = getPreviousAcademicYear(targetYear);
  if (prevYear) {
    const prevExists = db
      .prepare('SELECT COUNT(*) as c FROM academic_terms WHERE academic_year = ?')
      .get(prevYear) as { c: number };
    if (prevExists.c > 0 && prevExists.c < 3) {
      ensureAcademicYearTerms(prevYear);
    }
  }

  const allTerms = db
    .prepare('SELECT * FROM academic_terms ORDER BY academic_year ASC, term_number ASC')
    .all() as any[];

  for (const term of allTerms) {
    if (term.closed_at || term.status === 'Closed') {
      if (term.status !== 'Closed' || !term.closed_at) {
        lockAndCloseTerm(term.id, { isAutoClose: true });
      } else {
        db.prepare('UPDATE term_stock_records SET is_locked = 1 WHERE term_id = ? AND is_locked = 0').run(term.id);
      }
      continue;
    }

    if (today > term.end_date) {
      if (term.manual_reopen === 1) {
        // Keep reopened term open until staff finishes edits and formally closes it or sets a new closing date
        if (term.status !== 'Active') {
          db.prepare("UPDATE academic_terms SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(term.id);
        }
        continue;
      }
      lockAndCloseTerm(term.id, {
        userName: 'System Schedule Lock (Africa/Kigali)',
        userRole: 'SYSTEM',
        isAutoClose: true,
      });
    } else if (today >= term.start_date && today <= term.end_date) {
      if (term.status !== 'Active') {
        db.prepare("UPDATE academic_terms SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(term.id);
      }
      if (term.opening_initialized === 0) {
        const prevTerm = getPreviousTermRow(term);
        if (prevTerm && (prevTerm.status === 'Closed' || today > prevTerm.end_date)) {
          carryForwardTermBalances(prevTerm.id, term.id);
        }
      }

      // Approaching closing date notification (within 7 days)
      const daysRemaining = diffDaysYMD(today, term.end_date);
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        createNotification({
          title: `${term.name} Closing Soon (${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left)`,
          message: `${term.name} (${term.academic_year}) closes on ${term.end_date}. Prepare final stock counts and closing report.`,
          type: 'warning',
          targetRole: 'ALL',
          link: `terms?year=${encodeURIComponent(term.academic_year)}&termId=${term.id}`,
          eventType: 'TERM_APPROACHING_CLOSE',
          entityName: `${term.name} (${term.academic_year})`,
          academicYear: term.academic_year,
          termName: term.name,
          actorName: 'System Schedule Monitor',
          meta: {
            termName: term.name,
            academicYear: term.academic_year,
            endDate: term.end_date,
            daysRemaining,
          },
          dedupeKey: `TERM_APPROACHING:${term.id}:${term.end_date}`,
          dedupeWindowMinutes: 1440,
        });
      }
    } else {
      // today < term.start_date
      if (term.status !== 'Upcoming') {
        db.prepare("UPDATE academic_terms SET status = 'Upcoming', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(term.id);
      }
      if (term.opening_initialized === 0) {
        const prevTerm = getPreviousTermRow(term);
        if (prevTerm && prevTerm.status === 'Closed') {
          carryForwardTermBalances(prevTerm.id, term.id);
        }
      }
    }
  }

  return targetYear;
}

/**
 * Resolves and validates the target academic term for Stock In or Stock Out operations.
 * Strictly blocks transactions into Closed or Upcoming terms.
 */
export function resolveTargetTermForTransaction(options: {
  termId?: number | null;
  transactionDate: string;
}): { term: any | null; error?: string; statusCode?: number } {
  const today = getKigaliDate();
  const txYear = getCurrentKigaliAcademicYear(options.transactionDate);
  if (parseAcademicYear(txYear)) {
    syncAcademicTermsLifecycle(txYear, today);
  }
  syncAcademicTermsLifecycle(getCurrentKigaliAcademicYear(today), today);

  if (options.termId) {
    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(options.termId) as any;
    if (!term) {
      return { term: null, error: 'Selected academic term was not found.', statusCode: 404 };
    }
    if (term.status === 'Closed' || (today > term.end_date && term.manual_reopen !== 1)) {
      return {
        term: null,
        error: `${term.name} (${term.academic_year}) is closed and locked (Closing Date: ${term.end_date}). Stock In and Stock Out transactions are disabled for closed terms.`,
        statusCode: 403,
      };
    }
    if (term.status === 'Upcoming' || today < term.start_date) {
      return {
        term: null,
        error: `${term.name} (${term.academic_year}) is Upcoming (opens ${term.start_date}). Transactions cannot be recorded before the term opening date.`,
        statusCode: 403,
      };
    }
    if (
      options.transactionDate < term.start_date ||
      (options.transactionDate > term.end_date && term.manual_reopen !== 1)
    ) {
      return {
        term: null,
        error: `Transaction date (${options.transactionDate}) must fall within ${term.name} (${term.start_date} to ${term.end_date}).`,
        statusCode: 400,
      };
    }
    return { term };
  }

  // Match by transactionDate first
  const dateMatchedTerm = db
    .prepare(
      `
      SELECT * FROM academic_terms
      WHERE ? >= start_date AND ? <= end_date
      ORDER BY id DESC
      LIMIT 1
    `
    )
    .get(options.transactionDate, options.transactionDate) as any;

  if (dateMatchedTerm) {
    if (dateMatchedTerm.status === 'Closed' || (today > dateMatchedTerm.end_date && dateMatchedTerm.manual_reopen !== 1)) {
      return {
        term: null,
        error: `${dateMatchedTerm.name} (${dateMatchedTerm.academic_year}) is closed and locked (ended ${dateMatchedTerm.end_date}). Recording stock movements in a closed term is strictly prohibited.`,
        statusCode: 403,
      };
    }
    if (dateMatchedTerm.status === 'Upcoming' || today < dateMatchedTerm.start_date) {
      return {
        term: null,
        error: `${dateMatchedTerm.name} (${dateMatchedTerm.academic_year}) is Upcoming (opens ${dateMatchedTerm.start_date}). Stock transactions are only allowed in an Active term.`,
        statusCode: 403,
      };
    }
    return { term: dateMatchedTerm };
  }

  const activeTerm = db
    .prepare("SELECT * FROM academic_terms WHERE status = 'Active' ORDER BY academic_year DESC, term_number ASC LIMIT 1")
    .get() as any;

  if (!activeTerm) {
    return {
      term: null,
      error: `No Active academic term covers ${options.transactionDate}. Stock movements require an Active academic term.`,
      statusCode: 403,
    };
  }

  if (options.transactionDate < activeTerm.start_date) {
    return {
      term: null,
      error: `Transaction date ${options.transactionDate} falls in a past/closed period before the active term (${activeTerm.name}: ${activeTerm.start_date} to ${activeTerm.end_date}). Closed periods cannot be modified.`,
      statusCode: 403,
    };
  }

  if (options.transactionDate > activeTerm.end_date && activeTerm.manual_reopen !== 1) {
    return {
      term: null,
      error: `Transaction date ${options.transactionDate} is outside the active term (${activeTerm.name}: ${activeTerm.start_date} to ${activeTerm.end_date}).`,
      statusCode: 400,
    };
  }

  return { term: activeTerm };
}

/**
 * Syncs term_stock_records live totals for an active term after stock_in/stock_out.
 */
export function syncTermProductRecordAfterMovement(termId: number, product: any): void {
  const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
  if (!term || term.status === 'Closed') return;

  const stats = computeTermProductStats(term, product);

  db.prepare(`
    INSERT INTO term_stock_records (
      term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    ON CONFLICT(term_id, product_id) DO UPDATE SET
      received_quantity = excluded.received_quantity,
      issued_quantity = excluded.issued_quantity,
      closing_stock = excluded.opening_stock + excluded.received_quantity - excluded.issued_quantity,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    term.id,
    product.id,
    stats.openingStock,
    stats.receivedQuantity,
    stats.issuedQuantity,
    stats.closingStock,
    product.unit
  );
}
