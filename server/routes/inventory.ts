import { Router } from 'express';
import { db } from '../db';
import {
  authenticateToken,
  requireRoles,
  logAudit,
  createNotification,
  getKigaliDate,
  getKigaliTime,
  AuthRequest
} from '../auth';
import {
  generateSupportedAcademicYears,
  parseAcademicYear,
  getPreviousAcademicYear,
  getCurrentKigaliAcademicYear,
  syncAcademicTermsLifecycle,
  computeTermFinancialReport,
  carryForwardTermBalances,
  lockAndCloseTerm,
  reopenClosedTerm,
  resolveTargetTermForTransaction,
  syncTermProductRecordAfterMovement,
  ensureAcademicYearTerms,
} from '../services/academicTermsService';

const router = Router();

// Active academic term & Africa/Kigali clock endpoint (for Stock In / Stock Out status context)
router.get('/active-term', authenticateToken, (req: AuthRequest, res) => {
  try {
    const kigaliDate = getKigaliDate();
    const kigaliTime = getKigaliTime();
    const currentYear = getCurrentKigaliAcademicYear(kigaliDate);
    syncAcademicTermsLifecycle(currentYear, kigaliDate);

    const activeTerm = db.prepare(`
      SELECT * FROM academic_terms
      WHERE status = 'Active'
      ORDER BY academic_year DESC, term_number ASC
      LIMIT 1
    `).get() || null;

    return res.json({
      activeTerm,
      kigaliDate,
      kigaliTime,
      currentAcademicYear: currentYear,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to evaluate active academic term.' });
  }
});

// Products: List all with Reference Quantity and Calculated Remaining Percentage
router.get('/products', authenticateToken, (req: AuthRequest, res) => {
  try {
    const products = db.prepare(`
      SELECT
        p.*,
        (p.current_stock * p.avg_unit_cost) AS total_value,
        CASE WHEN p.current_stock <= p.min_stock_alert THEN 1 ELSE 0 END AS is_low_stock,
        COALESCE(
          p.reference_quantity,
          NULLIF((SELECT SUM(quantity) FROM stock_in WHERE product_id = p.id), 0),
          p.current_stock + COALESCE((SELECT SUM(quantity) FROM stock_out WHERE product_id = p.id), 0),
          p.current_stock
        ) AS reference_quantity,
        CASE
          WHEN COALESCE(
            p.reference_quantity,
            NULLIF((SELECT SUM(quantity) FROM stock_in WHERE product_id = p.id), 0),
            p.current_stock + COALESCE((SELECT SUM(quantity) FROM stock_out WHERE product_id = p.id), 0),
            p.current_stock
          ) > 0 THEN
            ROUND((p.current_stock * 100.0) / COALESCE(
              p.reference_quantity,
              NULLIF((SELECT SUM(quantity) FROM stock_in WHERE product_id = p.id), 0),
              p.current_stock + COALESCE((SELECT SUM(quantity) FROM stock_out WHERE product_id = p.id), 0),
              p.current_stock
            ), 1)
          ELSE 0.0
        END AS remaining_percentage,
        CASE
          WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN p.current_stock <= p.min_stock_alert THEN 'LOW_STOCK'
          ELSE 'NORMAL'
        END AS stock_status
      FROM products p
      WHERE p.is_active = 1
      ORDER BY p.name ASC
    `).all();

    return res.json({ products });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve food products.' });
  }
});

// Dedicated Stock Overview with accurate Remaining Stock Percentages (Accessible to DIRECTOR, ACCOUNTANT, ANIMATOR)
router.get('/stock-overview', authenticateToken, (req: AuthRequest, res) => {
  try {
    const stockItems = db.prepare(`
      SELECT
        p.id,
        p.name,
        p.category,
        p.unit,
        p.current_stock,
        p.min_stock_alert,
        COALESCE(
          p.reference_quantity,
          NULLIF((SELECT SUM(quantity) FROM stock_in WHERE product_id = p.id), 0),
          p.current_stock + COALESCE((SELECT SUM(quantity) FROM stock_out WHERE product_id = p.id), 0),
          p.current_stock
        ) AS reference_quantity,
        CASE
          WHEN COALESCE(
            p.reference_quantity,
            NULLIF((SELECT SUM(quantity) FROM stock_in WHERE product_id = p.id), 0),
            p.current_stock + COALESCE((SELECT SUM(quantity) FROM stock_out WHERE product_id = p.id), 0),
            p.current_stock
          ) > 0 THEN
            ROUND((p.current_stock * 100.0) / COALESCE(
              p.reference_quantity,
              NULLIF((SELECT SUM(quantity) FROM stock_in WHERE product_id = p.id), 0),
              p.current_stock + COALESCE((SELECT SUM(quantity) FROM stock_out WHERE product_id = p.id), 0),
              p.current_stock
            ), 1)
          ELSE 0.0
        END AS remaining_percentage,
        CASE
          WHEN p.current_stock <= 0 THEN 'OUT_OF_STOCK'
          WHEN p.current_stock <= p.min_stock_alert THEN 'LOW_STOCK'
          ELSE 'NORMAL'
        END AS stock_status,
        (p.current_stock * p.avg_unit_cost) AS total_value,
        p.avg_unit_cost
      FROM products p
      WHERE p.is_active = 1
      ORDER BY remaining_percentage ASC, p.name ASC
    `).all();

    const summary = {
      totalStaples: stockItems.length,
      outOfStockCount: stockItems.filter((i: any) => i.stock_status === 'OUT_OF_STOCK').length,
      lowStockCount: stockItems.filter((i: any) => i.stock_status === 'LOW_STOCK').length,
      normalStockCount: stockItems.filter((i: any) => i.stock_status === 'NORMAL').length,
      avgRemainingPercentage: stockItems.length > 0
        ? Math.round(stockItems.reduce((acc: number, item: any) => acc + item.remaining_percentage, 0) / stockItems.length)
        : 0
    };

    return res.json({ stockItems, summary });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve stock overview data.' });
  }
});

// Products: Create (Accountant & Director)
router.post('/products', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { name, category, unit, minStockAlert, avgUnitCost, referenceQuantity } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Product name and measurement unit are required.' });
    }

    const refQty = referenceQuantity ? parseFloat(referenceQuantity) : null;

    const stmt = db.prepare(`
      INSERT INTO products (name, category, unit, min_stock_alert, current_stock, avg_unit_cost, reference_quantity)
      VALUES (?, ?, ?, ?, 0.0, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      category?.trim() || 'Food & Provisions',
      unit.trim(),
      parseFloat(minStockAlert) || 50.0,
      parseFloat(avgUnitCost) || 0.0,
      refQty
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'CREATE_PRODUCT',
      recordType: 'PRODUCT',
      recordId: String(result.lastInsertRowid),
      details: `Created food item: ${name} (${unit}) with reference baseline: ${refQty || 'Automatic'}`,
      req,
    });

    return res.status(201).json({ message: 'Product created successfully.', productId: result.lastInsertRowid });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'A product with this name already exists in the inventory.' });
    }
    return res.status(500).json({ error: 'Failed to create product.' });
  }
});

// Products: Edit (Accountant & Director)
router.put('/products/:id', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, minStockAlert, avgUnitCost, referenceQuantity } = req.body;

    const refQty = referenceQuantity !== undefined && referenceQuantity !== null
      ? parseFloat(referenceQuantity)
      : null;

    db.prepare(`
      UPDATE products
      SET name = ?, category = ?, unit = ?, min_stock_alert = ?, avg_unit_cost = ?, reference_quantity = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(),
      category?.trim() || 'Food & Provisions',
      unit.trim(),
      parseFloat(minStockAlert) || 50.0,
      parseFloat(avgUnitCost) || 0.0,
      refQty,
      id
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_PRODUCT',
      recordType: 'PRODUCT',
      recordId: id,
      details: `Updated product properties for ID ${id}`,
      req,
    });

    return res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update product.' });
  }
});

// Suppliers: List all
router.get('/suppliers', authenticateToken, (req: AuthRequest, res) => {
  try {
    const suppliers = db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM stock_in WHERE supplier_id = s.id) as total_deliveries
      FROM suppliers s
      ORDER BY s.is_active DESC, s.name ASC
    `).all();

    return res.json({ suppliers });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve suppliers.' });
  }
});

// Suppliers: Create (Accountant & Director ONLY)
router.post('/suppliers', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { name, contactPerson, phone, email, address, category } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Supplier company name and phone number are required.' });
    }

    const stmt = db.prepare(`
      INSERT INTO suppliers (name, contact_person, phone, email, address, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      contactPerson?.trim() || null,
      phone.trim(),
      email?.trim() || null,
      address?.trim() || null,
      category?.trim() || 'Food & Provisions'
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'CREATE_SUPPLIER',
      recordType: 'SUPPLIER',
      recordId: String(result.lastInsertRowid),
      details: `Added new supplier: ${name}`,
      req,
    });

    return res.status(201).json({ message: 'Supplier registered successfully.', supplierId: result.lastInsertRowid });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to register supplier.' });
  }
});

// Suppliers: Update (Accountant & Director ONLY)
router.put('/suppliers/:id', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, phone, email, address, category, isActive } = req.body;

    db.prepare(`
      UPDATE suppliers
      SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, category = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name.trim(),
      contactPerson?.trim() || null,
      phone.trim(),
      email?.trim() || null,
      address?.trim() || null,
      category?.trim() || 'Food & Provisions',
      isActive !== undefined ? (isActive ? 1 : 0) : 1,
      id
    );

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'UPDATE_SUPPLIER',
      recordType: 'SUPPLIER',
      recordId: id,
      details: `Updated supplier details for ${name}`,
      req,
    });

    return res.json({ message: 'Supplier updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update supplier.' });
  }
});

// Suppliers: Delete with Historical Transaction Protection
router.delete('/suppliers/:id', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if supplier has any stock_in deliveries
    const deliveryCheck = db.prepare('SELECT COUNT(*) as count FROM stock_in WHERE supplier_id = ?').get(id) as { count: number };
    
    if (deliveryCheck.count > 0) {
      // Historical transaction protection: safe deactivation instead of destructive deletion
      db.prepare('UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

      logAudit({
        userId: req.user!.id,
        userName: req.user!.fullName,
        userRole: req.user!.role,
        action: 'DEACTIVATE_SUPPLIER',
        recordType: 'SUPPLIER',
        recordId: id,
        details: `Supplier has ${deliveryCheck.count} historical deliveries. Protected from permanent deletion; marked as deactivated.`,
        req,
      });

      return res.json({
        message: `Supplier has ${deliveryCheck.count} recorded procurement transactions. To preserve audit history, this supplier has been safely deactivated instead of deleted.`,
        deactivated: true,
      });
    }

    // No historical transactions: permanent deletion is safe
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'DELETE_SUPPLIER',
      recordType: 'SUPPLIER',
      recordId: id,
      details: 'Permanently deleted unused supplier.',
      req,
    });

    return res.json({ message: 'Supplier removed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to process supplier deletion.' });
  }
});

// Stock In: Record procurement (Director, Accountant, Animator)
router.post('/stock-in', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT', 'ANIMATOR']), (req: AuthRequest, res) => {
  try {
    const { productId, supplierId, quantity, unitCost, transactionDate, notes, termId } = req.body;

    const qty = parseFloat(quantity);
    const cost = unitCost !== undefined && unitCost !== '' ? parseFloat(unitCost) : 0.0;
    const txDate = (transactionDate && String(transactionDate).trim()) || getKigaliDate();

    if (!productId || !supplierId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Product, Supplier, and a positive Quantity are required.' });
    }
    if (isNaN(cost) || cost < 0) {
      return res.status(400).json({ error: 'Unit cost cannot be negative.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(txDate)) {
      return res.status(400).json({ error: 'Transaction date must be in YYYY-MM-DD format.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId) as {
      id: number;
      name: string;
      unit: string;
      current_stock: number;
      avg_unit_cost: number;
    } | undefined;

    if (!product) {
      return res.status(404).json({ error: 'Selected product was not found.' });
    }

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId) as { id: number; name: string } | undefined;
    if (!supplier) {
      return res.status(404).json({ error: 'Selected supplier was not found.' });
    }

    // Enforce Academic Term status & locking rules strictly on backend
    const parsedTermId = termId ? parseInt(String(termId), 10) : null;
    const termResolution = resolveTargetTermForTransaction({
      termId: parsedTermId,
      transactionDate: txDate,
    });
    if (!termResolution.term) {
      if (termResolution.statusCode === 403) {
        logAudit({
          userId: req.user!.id,
          userName: req.user!.fullName,
          userRole: req.user!.role,
          action: 'TERM_CLOSED_TX_REJECTED',
          recordType: 'STOCK_IN',
          recordId: String(product.id),
          details: `Rejected Stock In attempt (${qty} ${product.unit} of ${product.name}) on ${txDate}: ${termResolution.error}`,
          req,
        });
        createNotification({
          title: 'Stock In Blocked (Term Closed / Locked)',
          message: `Attempted Stock In of ${qty} ${product.unit} (${product.name}) on ${txDate} was blocked because the target term is closed or inactive.`,
          type: 'alert',
          targetRole: 'ALL',
          link: 'terms',
          eventType: 'TERM_CLOSED_TX_REJECTED',
          entityName: product.name,
          actorName: req.user!.fullName,
          meta: {
            txType: 'IN',
            productName: product.name,
            quantity: qty,
            unit: product.unit,
            transactionDate: txDate,
          },
          dedupeKey: `REJECTED_IN:${req.user!.id}:${product.id}:${txDate}`,
          dedupeWindowMinutes: 5,
        });
      }
      return res.status(termResolution.statusCode || 403).json({
        error: termResolution.error,
        termLocked: true,
      });
    }
    const targetTerm = termResolution.term;

    const totalCost = qty * cost;

    // Atomic ledger update
    const recordStockIn = db.transaction(() => {
      const freshProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id) as any;

      const stmt = db.prepare(`
        INSERT INTO stock_in (product_id, supplier_id, quantity, unit, unit_cost, total_cost, transaction_date, notes, recorded_by, term_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertResult = stmt.run(
        freshProduct.id,
        supplier.id,
        qty,
        freshProduct.unit,
        cost,
        totalCost,
        txDate,
        notes?.trim() || null,
        req.user!.id,
        targetTerm.id
      );

      const newStock = freshProduct.current_stock + qty;
      let newAvgCost = freshProduct.avg_unit_cost;
      if (cost > 0 && newStock > 0) {
        newAvgCost = ((freshProduct.current_stock * freshProduct.avg_unit_cost) + totalCost) / newStock;
      }

      db.prepare(`
        UPDATE products
        SET current_stock = ?, avg_unit_cost = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStock, newAvgCost, freshProduct.id);

      syncTermProductRecordAfterMovement(targetTerm.id, freshProduct);

      return { txId: insertResult.lastInsertRowid, newStock };
    });

    const { txId, newStock } = recordStockIn();

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'STOCK_IN',
      recordType: 'STOCK_IN',
      recordId: String(txId),
      details: `${req.user!.role} recorded Stock In of ${qty} ${product.unit} of ${product.name} from ${supplier.name} in ${targetTerm.academic_year} ${targetTerm.name} (Total: RWF ${totalCost})`,
      req,
    });

    createNotification({
      title: 'Food Stock Procured (Stock In)',
      message: `${qty} ${product.unit} of ${product.name} received from ${supplier.name} (${targetTerm.name}).`,
      type: 'success',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(targetTerm.academic_year)}&termId=${targetTerm.id}`,
      eventType: 'STOCK_IN_COMPLETED',
      entityName: product.name,
      academicYear: targetTerm.academic_year,
      termName: targetTerm.name,
      actorName: req.user!.fullName,
      meta: {
        productName: product.name,
        quantity: qty,
        unit: product.unit,
        supplierName: supplier.name,
        totalCost,
        academicYear: targetTerm.academic_year,
        termName: targetTerm.name,
      },
    });

    return res.status(201).json({
      message: `Stock In recorded successfully. New available stock: ${newStock} ${product.unit}.`,
      transactionId: txId,
      newStock,
      termId: targetTerm.id,
      academicYear: targetTerm.academic_year,
    });
  } catch (err) {
    console.error('Stock in error:', err);
    return res.status(500).json({ error: 'Failed to record Stock In transaction.' });
  }
});

// Stock Out: Record daily issue (Director, Animator & Accountant - No schedule restrictions)
router.post('/stock-out', authenticateToken, requireRoles(['DIRECTOR', 'ANIMATOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { productId, quantity, transactionDate, notes, termId } = req.body;

    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Product and a positive Quantity to issue are required.' });
    }

    const kigaliTime = getKigaliTime();
    const txDate = (transactionDate && String(transactionDate).trim()) || getKigaliDate();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(txDate)) {
      return res.status(400).json({ error: 'Transaction date must be in YYYY-MM-DD format.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ? AND is_active = 1').get(productId) as {
      id: number;
      name: string;
      unit: string;
      current_stock: number;
      min_stock_alert: number;
    } | undefined;

    if (!product) {
      return res.status(404).json({ error: 'Selected product was not found.' });
    }

    // Enforce Academic Term status & locking rules strictly on backend
    const parsedTermId = termId ? parseInt(String(termId), 10) : null;
    const termResolution = resolveTargetTermForTransaction({
      termId: parsedTermId,
      transactionDate: txDate,
    });
    if (!termResolution.term) {
      if (termResolution.statusCode === 403) {
        logAudit({
          userId: req.user!.id,
          userName: req.user!.fullName,
          userRole: req.user!.role,
          action: 'TERM_CLOSED_TX_REJECTED',
          recordType: 'STOCK_OUT',
          recordId: String(product.id),
          details: `Rejected Stock Out attempt (${qty} ${product.unit} of ${product.name}) on ${txDate}: ${termResolution.error}`,
          req,
        });
        createNotification({
          title: 'Stock Out Blocked (Term Closed / Locked)',
          message: `Attempted Stock Out of ${qty} ${product.unit} (${product.name}) on ${txDate} was blocked because the target term is closed or inactive.`,
          type: 'alert',
          targetRole: 'ALL',
          link: 'terms',
          eventType: 'TERM_CLOSED_TX_REJECTED',
          entityName: product.name,
          actorName: req.user!.fullName,
          meta: {
            txType: 'OUT',
            productName: product.name,
            quantity: qty,
            unit: product.unit,
            transactionDate: txDate,
          },
          dedupeKey: `REJECTED_OUT:${req.user!.id}:${product.id}:${txDate}`,
          dedupeWindowMinutes: 5,
        });
      }
      return res.status(termResolution.statusCode || 403).json({
        error: termResolution.error,
        termLocked: true,
      });
    }
    const targetTerm = termResolution.term;

    // Atomic stock deduction transaction (prevents race-condition negative stock)
    const recordStockOut = db.transaction(() => {
      const freshProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id) as any;
      if (freshProduct.current_stock < qty) {
        return {
          insufficient: true,
          available: freshProduct.current_stock,
          txId: null,
          remainingStock: freshProduct.current_stock,
        };
      }

      const stmt = db.prepare(`
        INSERT INTO stock_out (product_id, quantity, unit, transaction_date, transaction_time, notes, is_emergency_override, override_reason, issued_by, term_id)
        VALUES (?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
      `);

      const insertResult = stmt.run(
        freshProduct.id,
        qty,
        freshProduct.unit,
        txDate,
        kigaliTime,
        notes?.trim() || null,
        req.user!.id,
        targetTerm.id
      );

      const remainingStock = freshProduct.current_stock - qty;

      db.prepare(`
        UPDATE products
        SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(remainingStock, freshProduct.id);

      syncTermProductRecordAfterMovement(targetTerm.id, freshProduct);

      return { insufficient: false, available: remainingStock, txId: insertResult.lastInsertRowid, remainingStock };
    });

    const outcome = recordStockOut();

    if (outcome.insufficient) {
      return res.status(400).json({
        error: `Insufficient stock! Requested: ${qty} ${product.unit}, but only ${outcome.available} ${product.unit} is available. Negative stock is forbidden.`,
      });
    }

    const { txId, remainingStock } = outcome;

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'STOCK_OUT',
      recordType: 'STOCK_OUT',
      recordId: String(txId),
      details: `${req.user!.role} issued ${qty} ${product.unit} of ${product.name} in ${targetTerm.academic_year} ${targetTerm.name}. Remaining: ${remainingStock} ${product.unit}.`,
      req,
    });

    createNotification({
      title: 'Food Ration Issued (Stock Out)',
      message: `${qty} ${product.unit} of ${product.name} issued in ${targetTerm.name} (${targetTerm.academic_year}). Remaining: ${remainingStock} ${product.unit}.`,
      type: 'info',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(targetTerm.academic_year)}&termId=${targetTerm.id}`,
      eventType: 'STOCK_OUT_COMPLETED',
      entityName: product.name,
      academicYear: targetTerm.academic_year,
      termName: targetTerm.name,
      actorName: req.user!.fullName,
      meta: {
        productName: product.name,
        quantity: qty,
        unit: product.unit,
        remainingStock,
        academicYear: targetTerm.academic_year,
        termName: targetTerm.name,
      },
    });

    // Check low stock alert (deduplicated per product)
    if (remainingStock <= product.min_stock_alert) {
      createNotification({
        title: `Low Stock Alert: ${product.name}`,
        message: `${product.name} reserve has fallen to ${remainingStock} ${product.unit} (Alert threshold: ${product.min_stock_alert} ${product.unit}). Reorder recommended.`,
        type: 'warning',
        targetRole: 'ALL',
        link: 'inventory',
        eventType: 'LOW_STOCK_ALERT',
        entityName: product.name,
        academicYear: targetTerm.academic_year,
        termName: targetTerm.name,
        actorName: req.user!.fullName,
        meta: {
          productName: product.name,
          remainingStock,
          unit: product.unit,
          threshold: product.min_stock_alert,
        },
        dedupeKey: `LOW_STOCK:${product.id}`,
        dedupeWindowMinutes: 60,
        updateUnreadOnDedupe: true,
      });
    }

    return res.status(201).json({
      message: `Stock Out issued successfully. ${qty} ${product.unit} of ${product.name} released. Available: ${remainingStock} ${product.unit}.`,
      transactionId: txId,
      remainingStock,
      termId: targetTerm.id,
      academicYear: targetTerm.academic_year,
    });
  } catch (err) {
    console.error('Stock out error:', err);
    return res.status(500).json({ error: 'Failed to record Stock Out transaction.' });
  }
});

// ========================================================
// RWANDA ACADEMIC YEARS (2022-2023 TO 2049-2050) & LOCKED TERMS
// ========================================================

// 0. List all supported academic years with summary status
router.get('/terms/years', authenticateToken, (req: AuthRequest, res) => {
  try {
    const today = getKigaliDate();
    const currentYear = getCurrentKigaliAcademicYear(today);
    syncAcademicTermsLifecycle(currentYear, today);

    const allYears = generateSupportedAcademicYears();
    const existingRows = db.prepare(`
      SELECT academic_year,
             COUNT(*) as terms_count,
             SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_count,
             SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed_count,
             MAX(CASE WHEN term_number = 1 THEN opening_initialized ELSE 0 END) as opening_initialized
      FROM academic_terms
      GROUP BY academic_year
    `).all() as any[];

    const map = new Map(existingRows.map((r) => [r.academic_year, r]));
    const years = allYears.map((yr) => {
      const info = map.get(yr);
      return {
        academicYear: yr,
        isCurrentAcademicYear: yr === currentYear,
        isConfigured: Boolean(info && info.terms_count > 0),
        openingInitialized: Boolean(info && info.opening_initialized === 1),
        activeCount: info?.active_count || 0,
        closedCount: info?.closed_count || 0,
      };
    });

    return res.json({
      currentAcademicYear: currentYear,
      kigaliDate: today,
      years,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve academic years list.' });
  }
});

// 1. List all academic terms for a specific year (2022-2023 to 2049-2050) with summary figures
router.get('/terms', authenticateToken, (req: AuthRequest, res) => {
  try {
    const requestedYear = req.query.academic_year || req.query.academicYear;
    const today = getKigaliDate();
    const fallbackYear = getCurrentKigaliAcademicYear(today);
    const selectedYear = requestedYear ? String(requestedYear).trim() : fallbackYear;

    if (!parseAcademicYear(selectedYear)) {
      return res.status(400).json({
        error: `Academic year "${selectedYear}" is invalid. Supported academic years are 2022-2023 through 2049-2050.`,
      });
    }

    syncAcademicTermsLifecycle(selectedYear, today);

    const terms = db.prepare(`
      SELECT 
        t.*,
        src.academic_year as carried_from_year,
        src.name as carried_from_term_name,
        (SELECT COUNT(DISTINCT product_id) FROM term_stock_records WHERE term_id = t.id) as tracked_items_count,
        COALESCE((SELECT SUM(quantity) FROM stock_in WHERE term_id = t.id OR (term_id IS NULL AND transaction_date >= t.start_date AND transaction_date <= t.end_date)), 0) as total_received_quantity,
        COALESCE((SELECT SUM(quantity) FROM stock_out WHERE term_id = t.id OR (term_id IS NULL AND transaction_date >= t.start_date AND transaction_date <= t.end_date)), 0) as total_issued_quantity,
        COALESCE((SELECT SUM(total_cost) FROM stock_in WHERE term_id = t.id OR (term_id IS NULL AND transaction_date >= t.start_date AND transaction_date <= t.end_date)), 0) as total_procurement_spend
      FROM academic_terms t
      LEFT JOIN academic_terms src ON t.carried_from_term_id = src.id
      WHERE t.academic_year = ?
      ORDER BY t.term_number ASC
    `).all(selectedYear) as any[];

    const term1 = terms.find((t) => t.term_number === 1);
    const prevYear = getPreviousAcademicYear(selectedYear);
    let previousYearClosingReady = false;
    let previousYearTerm3Id: number | null = null;
    if (prevYear) {
      const prevTerm3 = db
        .prepare('SELECT id, status FROM academic_terms WHERE academic_year = ? AND term_number = 3')
        .get(prevYear) as any;
      if (prevTerm3) {
        const recCount = (
          db.prepare('SELECT COUNT(*) as c FROM term_stock_records WHERE term_id = ?').get(prevTerm3.id) as any
        ).c;
        if (recCount > 0 && prevTerm3.status === 'Closed') {
          previousYearClosingReady = true;
          previousYearTerm3Id = prevTerm3.id;
        }
      }
    }

    return res.json({
      academicYear: selectedYear,
      kigaliDate: today,
      availableYears: generateSupportedAcademicYears(),
      terms,
      yearMeta: {
        academicYear: selectedYear,
        previousAcademicYear: prevYear,
        openingInitialized: Boolean(term1 && term1.opening_initialized === 1),
        previousYearClosingReady,
        previousYearTerm3Id,
        canInitializeOpening: Boolean(term1 && term1.opening_initialized === 0 && term1.status !== 'Closed'),
      },
    });
  } catch (err) {
    console.error('Failed to fetch academic terms:', err);
    return res.status(500).json({ error: 'Failed to fetch academic terms.' });
  }
});

// 1b. Initialize Opening Stock for an academic year (Carry-forward from prior year Term 3 OR initial setup for first year)
router.post('/terms/initialize-year', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const academicYear = String(req.body.academicYear || req.body.academic_year || '').trim();
    const initialItems: Array<{ productId: number; openingStock: number }> = req.body.initialItems || [];
    const reason = req.body.reason;

    if (!parseAcademicYear(academicYear)) {
      return res.status(400).json({ error: 'Valid academic year (2022-2023 to 2049-2050) is required.' });
    }

    const today = getKigaliDate();
    syncAcademicTermsLifecycle(academicYear, today);

    const term1 = db
      .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = 1')
      .get(academicYear) as any;

    if (!term1) {
      return res.status(404).json({ error: `Term 1 for ${academicYear} could not be prepared.` });
    }

    if (term1.opening_initialized === 1) {
      return res.status(409).json({
        error: `Opening stock for ${academicYear} has already been initialized. Duplicate carry-forward or overwriting is disabled.`,
      });
    }

    if (term1.status === 'Closed' || today > term1.end_date) {
      return res.status(403).json({
        error: `${academicYear} Term 1 is closed and locked. Opening stock for closed terms cannot be initialized or altered.`,
      });
    }

    const prevYear = getPreviousAcademicYear(academicYear);
    if (prevYear) {
      ensureAcademicYearTerms(prevYear);
      const prevTerm3 = db
        .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = 3')
        .get(prevYear) as any;

      if (prevTerm3) {
        const prevRecCount = (
          db.prepare('SELECT COUNT(*) as c FROM term_stock_records WHERE term_id = ?').get(prevTerm3.id) as any
        ).c;

        if (prevRecCount > 0) {
          if (prevTerm3.status !== 'Closed') {
            return res.status(400).json({
              error: `Cannot carry forward yet: ${prevYear} Term 3 has not been closed. Close ${prevYear} Term 3 first to finalize closing balances.`,
            });
          }

          const cf = carryForwardTermBalances(prevTerm3.id, term1.id, {
            id: req.user!.id,
            fullName: req.user!.fullName,
            role: req.user!.role,
          });

          if (!cf.carried) {
            return res.status(400).json({ error: cf.reason || 'Carry-forward could not be completed.' });
          }

          return res.json({
            message: `${academicYear} Term 1 opening stock initialized from ${prevYear} Term 3 closing balances (${cf.itemsCount} products).`,
            mode: 'CARRY_FORWARD',
            itemsCount: cf.itemsCount,
          });
        }
      }
    }

    // Controlled initial setup without fabricating stock (defaults to 0 unless explicitly specified)
    const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC').all() as any[];
    const itemMap = new Map<number, number>();
    for (const entry of initialItems) {
      const pid = Number(entry.productId);
      const qty = Number(entry.openingStock);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ error: 'All initial opening stock quantities must be non-negative numbers.' });
      }
      itemMap.set(pid, qty);
    }

    const initTx = db.transaction(() => {
      const insertRec = db.prepare(`
        INSERT INTO term_stock_records (
          term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, notes, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(term_id, product_id) DO NOTHING
      `);

      for (const prod of products) {
        const openingQty = itemMap.has(prod.id) ? itemMap.get(prod.id)! : 0;
        const inQty = (
          db
            .prepare(
              `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_in WHERE product_id = ? AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))`
            )
            .get(prod.id, term1.id, term1.start_date, term1.end_date) as any
        ).total;
        const outQty = (
          db
            .prepare(
              `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_out WHERE product_id = ? AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))`
            )
            .get(prod.id, term1.id, term1.start_date, term1.end_date) as any
        ).total;

        insertRec.run(
          term1.id,
          prod.id,
          openingQty,
          inQty,
          outQty,
          Math.max(0, openingQty + inQty - outQty),
          prod.unit,
          reason?.trim() || `Controlled initial opening stock setup for ${academicYear}`
        );
      }

      db.prepare(`
        UPDATE academic_terms
        SET opening_initialized = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND opening_initialized = 0
      `).run(term1.id);
    });

    initTx();

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'ACADEMIC_YEAR_OPENING_INITIALIZED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(term1.id),
      details: `Initialized Term 1 opening stock for ${academicYear} (${products.length} products). Reason: ${reason || 'Initial setup'}.`,
      req,
    });

    createNotification({
      title: `Academic Year ${academicYear} Initialized`,
      message: `${academicYear} Term 1 opening stock initialized for ${products.length} food items by ${req.user!.fullName}.`,
      type: 'success',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(academicYear)}&termId=${term1.id}`,
      eventType: 'ACADEMIC_YEAR_INITIALIZED',
      entityName: academicYear,
      academicYear,
      termName: 'Term 1',
      actorName: req.user!.fullName,
      meta: {
        academicYear,
        itemsCount: products.length,
        mode: 'INITIAL_SETUP',
      },
      dedupeKey: `YEAR_INIT:${academicYear}`,
      dedupeWindowMinutes: 10,
    });

    return res.json({
      message: `${academicYear} Term 1 initial opening stock saved cleanly for ${products.length} products.`,
      mode: 'INITIAL_SETUP',
      itemsCount: products.length,
    });
  } catch (err) {
    console.error('Failed to initialize academic year:', err);
    return res.status(500).json({ error: 'Failed to initialize academic year opening stock.' });
  }
});

// 1c. Create a new Academic Term (for years/terms not yet created)
router.post('/terms', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const academicYear = String(req.body.academicYear || req.body.academic_year || '').trim();
    const termNumber = parseInt(String(req.body.termNumber || req.body.term_number || ''), 10);
    const name = String(req.body.name || `Term ${termNumber}`).trim();
    const startDate = String(req.body.startDate || req.body.start_date || '').trim();
    const endDate = String(req.body.endDate || req.body.end_date || '').trim();

    if (!parseAcademicYear(academicYear)) {
      return res.status(400).json({ error: 'Valid academic year (2022-2023 to 2049-2050) is required.' });
    }
    if (![1, 2, 3].includes(termNumber)) {
      return res.status(400).json({ error: 'Term number must be 1, 2, or 3.' });
    }
    if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ error: 'Opening date and Closing date must be formatted as YYYY-MM-DD.' });
    }
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Opening date must precede Closing date.' });
    }

    const existing = db
      .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = ?')
      .get(academicYear, termNumber) as any;

    if (existing) {
      return res.status(409).json({
        error: `${existing.name} (${academicYear}) already exists. Use Edit Term Dates to update its schedule.`,
      });
    }

    const siblings = db
      .prepare('SELECT * FROM academic_terms WHERE academic_year = ? ORDER BY term_number ASC')
      .all(academicYear) as any[];

    for (const sib of siblings) {
      if (sib.term_number < termNumber && startDate <= sib.end_date) {
        return res.status(400).json({
          error: `Opening date (${startDate}) must be after ${sib.name} closing date (${sib.end_date}).`,
        });
      }
      if (sib.term_number > termNumber && endDate >= sib.start_date) {
        return res.status(400).json({
          error: `Closing date (${endDate}) must precede ${sib.name} opening date (${sib.start_date}).`,
        });
      }
    }

    const today = getKigaliDate();
    let initialStatus: 'Upcoming' | 'Active' | 'Closed' = 'Upcoming';
    if (today > endDate) {
      initialStatus = 'Closed';
    } else if (today >= startDate && today <= endDate) {
      initialStatus = 'Active';
    }

    const insertResult = db
      .prepare(
        `INSERT INTO academic_terms (academic_year, term_number, name, start_date, end_date, status, opening_initialized)
         VALUES (?, ?, ?, ?, ?, ?, 0)`
      )
      .run(academicYear, termNumber, name, startDate, endDate, initialStatus);

    const createdTerm = db
      .prepare('SELECT * FROM academic_terms WHERE id = ?')
      .get(insertResult.lastInsertRowid) as any;

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_CREATED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(createdTerm.id),
      details: `Created ${academicYear} ${name} (${startDate} to ${endDate}, Status: ${createdTerm.status}).`,
      req,
    });

    createNotification({
      title: `${name} (${academicYear}) Created`,
      message: `${name} (${academicYear}) scheduled from ${startDate} to ${endDate} by ${req.user!.fullName}.`,
      type: 'info',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(academicYear)}&termId=${createdTerm.id}`,
      eventType: 'TERM_DATES_UPDATED',
      entityName: `${name} (${academicYear})`,
      academicYear,
      termName: name,
      actorName: req.user!.fullName,
      meta: {
        subAction: 'created',
        termName: name,
        academicYear,
        startDate,
        endDate,
      },
    });

    return res.status(201).json({
      message: `${name} (${academicYear}) created successfully.`,
      term: createdTerm,
    });
  } catch (err) {
    console.error('Create term error:', err);
    return res.status(500).json({ error: 'Failed to create academic term.' });
  }
});

// 2. Detailed breakdown of a single term with truthful financial summary and movement history
router.get('/terms/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    if (isNaN(termId)) {
      return res.status(400).json({ error: 'Invalid term identifier.' });
    }

    const rawTerm = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!rawTerm) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    syncAcademicTermsLifecycle(rawTerm.academic_year);

    const term = db.prepare(`
      SELECT t.*,
             src.academic_year as carried_from_year,
             src.name as carried_from_term_name
      FROM academic_terms t
      LEFT JOIN academic_terms src ON t.carried_from_term_id = src.id
      WHERE t.id = ?
    `).get(termId) as any;

    const products = db.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC').all() as any[];
    const { items, summary, financialSummary } = computeTermFinancialReport(term, products);

    const termStockIn = db.prepare(`
      SELECT si.id, 'IN' as type, si.transaction_date, si.transaction_date as date, '--:--' as time,
             si.product_id, p.name as product_name, si.quantity, si.unit, si.unit_cost, si.total_cost,
             s.name as supplier_name, s.name as party_name,
             st.full_name as recorded_by_name, st.full_name as staff_name, si.notes
      FROM stock_in si
      JOIN products p ON si.product_id = p.id
      JOIN suppliers s ON si.supplier_id = s.id
      JOIN staff st ON si.recorded_by = st.id
      WHERE si.term_id = ? OR (si.term_id IS NULL AND si.transaction_date >= ? AND si.transaction_date <= ?)
      ORDER BY si.transaction_date DESC, si.id DESC
    `).all(term.id, term.start_date, term.end_date);

    const termStockOut = db.prepare(`
      SELECT so.id, 'OUT' as type, so.transaction_date, so.transaction_time,
             so.transaction_date as date, so.transaction_time as time,
             so.product_id, p.name as product_name, so.quantity, so.unit,
             CASE WHEN p.avg_unit_cost > 0 THEN p.avg_unit_cost ELSE NULL END as unit_cost,
             CASE WHEN p.avg_unit_cost > 0 THEN ROUND(so.quantity * p.avg_unit_cost) ELSE NULL END as total_cost,
             'Boarding Refectory' as party_name,
             st.full_name as issued_by_name, st.full_name as staff_name, so.notes
      FROM stock_out so
      JOIN products p ON so.product_id = p.id
      JOIN staff st ON so.issued_by = st.id
      WHERE so.term_id = ? OR (so.term_id IS NULL AND so.transaction_date >= ? AND so.transaction_date <= ?)
      ORDER BY so.transaction_date DESC, so.transaction_time DESC, so.id DESC
    `).all(term.id, term.start_date, term.end_date);

    return res.json({
      term,
      items,
      summary,
      financialSummary,
      transactions: {
        stock_in: termStockIn,
        stock_out: termStockOut,
      },
      recentTransactions: [...termStockIn, ...termStockOut].sort((a: any, b: any) => (b.date > a.date ? 1 : -1)).slice(0, 30),
    });
  } catch (err) {
    console.error('Failed to get term detail:', err);
    return res.status(500).json({ error: 'Failed to retrieve term stock detail.' });
  }
});

// 3. Configure/Update term dates (Strictly blocked only if term is officially Closed)
router.put('/terms/:id', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const startDate = String(req.body.startDate || req.body.start_date || '').trim();
    const endDate = String(req.body.endDate || req.body.end_date || '').trim();
    const name = req.body.name;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Opening date and Closing date are required.' });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return res.status(400).json({ error: 'Dates must be formatted as YYYY-MM-DD.' });
    }
    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Opening date must precede Closing date.' });
    }

    const existing = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!existing) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    const today = getKigaliDate();

    // Strictly protect finalized/closed terms — require controlled Reopen instead
    if (existing.status === 'Closed' || existing.closed_at) {
      return res.status(403).json({
        error: `${existing.name} (${existing.academic_year}) is closed and locked. Use Reopen Closed Term with an audit reason if a date correction is required.`,
      });
    }

    // Validate no chronological overlap with sibling terms in same academic year
    const siblings = db
      .prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND id != ? ORDER BY term_number ASC')
      .all(existing.academic_year, termId) as any[];

    for (const sib of siblings) {
      if (sib.term_number < existing.term_number && startDate <= sib.end_date) {
        return res.status(400).json({
          error: `Opening date (${startDate}) must be after ${sib.name} closing date (${sib.end_date}).`,
        });
      }
      if (sib.term_number > existing.term_number && endDate >= sib.start_date) {
        return res.status(400).json({
          error: `Closing date (${endDate}) must precede ${sib.name} opening date (${sib.start_date}).`,
        });
      }
    }

    const clearManualReopen = endDate >= today ? 0 : existing.manual_reopen;

    db.prepare(`
      UPDATE academic_terms 
      SET start_date = ?,
          end_date = ?,
          name = COALESCE(?, name),
          manual_reopen = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(startDate, endDate, name?.trim() || null, clearManualReopen, termId);

    // Re-evaluate lifecycle status based on updated dates
    syncAcademicTermsLifecycle(existing.academic_year, today);
    const updatedTerm = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_CONFIG_UPDATED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(termId),
      details: `${existing.academic_year} ${updatedTerm.name} schedule updated: ${startDate} to ${endDate} (Status: ${updatedTerm.status}).`,
      req,
    });

    createNotification({
      title: `${updatedTerm.name} (${existing.academic_year}) Dates Updated`,
      message: `${updatedTerm.name} (${existing.academic_year}) schedule updated to ${startDate} → ${endDate} by ${req.user!.fullName}.`,
      type: 'info',
      targetRole: 'ALL',
      link: `terms?year=${encodeURIComponent(existing.academic_year)}&termId=${termId}`,
      eventType: 'TERM_DATES_UPDATED',
      entityName: `${updatedTerm.name} (${existing.academic_year})`,
      academicYear: existing.academic_year,
      termName: updatedTerm.name,
      actorName: req.user!.fullName,
      meta: {
        subAction: 'updated',
        termName: updatedTerm.name,
        academicYear: existing.academic_year,
        startDate,
        endDate,
        status: updatedTerm.status,
      },
    });

    return res.json({
      message: 'Term dates updated successfully.',
      term: updatedTerm,
    });
  } catch (err) {
    console.error('Update term error:', err);
    return res.status(500).json({ error: 'Failed to update term configuration.' });
  }
});

// 4. Activate a term (Blocked if Closed or before Opening Date)
router.post('/terms/:id/activate', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    const today = getKigaliDate();
    syncAcademicTermsLifecycle(term.academic_year, today);
    const refreshed = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;

    if (refreshed.status === 'Closed' || (today > refreshed.end_date && refreshed.manual_reopen !== 1)) {
      return res.status(403).json({
        error: `${refreshed.name} (${refreshed.academic_year}) has reached/passed its closing date (${refreshed.end_date}) and is permanently locked.`,
      });
    }

    if (today < refreshed.start_date) {
      return res.status(400).json({
        error: `${refreshed.name} (${refreshed.academic_year}) opens on ${refreshed.start_date} (Kigali today: ${today}). Adjust the opening date if starting early.`,
      });
    }

    db.prepare("UPDATE academic_terms SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(refreshed.id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_ACTIVATED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(refreshed.id),
      details: `${refreshed.name} (${refreshed.academic_year}) confirmed as Active stock period.`,
      req,
    });

    return res.json({ message: `${refreshed.name} (${refreshed.academic_year}) is active.` });
  } catch (err) {
    console.error('Failed to activate term:', err);
    return res.status(500).json({ error: 'Failed to verify active term.' });
  }
});

// 5. Close a term and automatically carry forward closing balances to next term / next year
router.post('/terms/:id/close', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const closingNotes = req.body.closingNotes || req.body.closing_notes;

    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    if (term.status === 'Closed') {
      return res.status(403).json({ error: `${term.name} (${term.academic_year}) is already closed and locked. Closing cannot be duplicated.` });
    }

    const result = lockAndCloseTerm(termId, {
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      closingNotes,
      isAutoClose: false,
    });

    return res.json({
      message: result.nextTermCarriedForward
        ? `${term.name} (${term.academic_year}) has been closed and locked. All closing balances were automatically carried forward to ${result.nextTermLabel}.`
        : `${term.name} (${term.academic_year}) has been closed and permanently locked.`,
      carriedForward: result.nextTermCarriedForward,
      nextTermLabel: result.nextTermLabel || null,
    });
  } catch (err) {
    console.error('Failed to close term:', err);
    return res.status(500).json({ error: 'Failed to close academic term and lock inventory.' });
  }
});

// 5b. Controlled administrative reopen of a Closed term (requires audit reason)
router.post('/terms/:id/reopen', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const reason = String(req.body.reason || '').trim();
    const newEndDate = req.body.newEndDate || req.body.endDate || req.body.end_date;

    const result = reopenClosedTerm(termId, {
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      reason,
      newEndDate: newEndDate ? String(newEndDate) : undefined,
    });

    if (!result.term) {
      return res.status(result.statusCode || 400).json({ error: result.error || 'Failed to reopen term.' });
    }

    return res.json({
      message: `${result.term.name} (${result.term.academic_year}) has been reopened for controlled administrative editing.`,
      term: result.term,
    });
  } catch (err) {
    console.error('Failed to reopen term:', err);
    return res.status(500).json({ error: 'Failed to reopen academic term.' });
  }
});

// 6. Adjust opening balance for a non-closed, non-carried-forward term (initial setup / audited override)
router.put('/terms/:id/opening-stock', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const productId = req.body.productId || req.body.product_id;
    const openingStock = req.body.openingStock ?? req.body.opening_stock;
    const reason = req.body.reason;

    const qty = parseFloat(openingStock);
    if (!productId || isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'Valid product and non-negative opening stock are required.' });
    }

    const rawTerm = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!rawTerm) return res.status(404).json({ error: 'Term not found.' });

    const today = getKigaliDate();
    syncAcademicTermsLifecycle(rawTerm.academic_year, today);
    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;

    if (term.status === 'Closed' || (today > term.end_date && term.manual_reopen !== 1)) {
      return res.status(403).json({
        error: `${term.name} (${term.academic_year}) is closed and locked. Opening stock for closed terms cannot be edited.`,
      });
    }

    if (term.carried_from_term_id !== null) {
      return res.status(403).json({
        error: `Opening stock for ${term.name} (${term.academic_year}) was carried forward automatically from the previous term and cannot be overwritten.`,
      });
    }

    const existingRec = db
      .prepare('SELECT * FROM term_stock_records WHERE term_id = ? AND product_id = ?')
      .get(term.id, productId) as any;

    if (existingRec?.is_locked === 1) {
      return res.status(403).json({ error: 'This stock balance record is permanently locked.' });
    }

    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!prod) return res.status(404).json({ error: 'Product not found.' });

    const inQty = (
      db
        .prepare(
          `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_in WHERE product_id = ? AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))`
        )
        .get(prod.id, term.id, term.start_date, term.end_date) as any
    ).total;
    const outQty = (
      db
        .prepare(
          `SELECT COALESCE(SUM(quantity), 0) as total FROM stock_out WHERE product_id = ? AND (term_id = ? OR (term_id IS NULL AND transaction_date >= ? AND transaction_date <= ?))`
        )
        .get(prod.id, term.id, term.start_date, term.end_date) as any
    ).total;

    const newClosing = Math.max(0, qty + inQty - outQty);

    db.prepare(`
      INSERT INTO term_stock_records (term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(term_id, product_id) DO UPDATE SET
        opening_stock = excluded.opening_stock,
        received_quantity = excluded.received_quantity,
        issued_quantity = excluded.issued_quantity,
        closing_stock = excluded.closing_stock,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).run(term.id, prod.id, qty, inQty, outQty, newClosing, prod.unit, reason?.trim() || 'Opening balance adjustment');

    db.prepare('UPDATE academic_terms SET opening_initialized = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(term.id);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_OPENING_STOCK_ADJUSTED',
      recordType: 'TERM_STOCK_RECORD',
      recordId: `${term.id}_${prod.id}`,
      details: `${term.academic_year} ${term.name} opening stock for ${prod.name} set to ${qty} ${prod.unit}. Reason: ${reason || 'N/A'}.`,
      req,
    });

    return res.json({ message: `Opening balance for ${prod.name} updated to ${qty} ${prod.unit}.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to adjust opening stock.' });
  }
});

// Full transactions ledger (Stock In & Stock Out)
router.get('/transactions', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { type, productId, startDate, endDate, termId, academicYear } = req.query;

    let stockInQuery = `
      SELECT
        si.id, 'IN' as transaction_type,
        si.transaction_date as date,
        '--:--' as time,
        p.name as product_name,
        p.category,
        si.quantity,
        si.unit,
        si.unit_cost,
        si.total_cost,
        s.name as party_name,
        si.notes,
        st.full_name as recorded_by_name,
        st.role as recorded_by_role,
        si.term_id,
        at_t.academic_year,
        at_t.name as term_name,
        si.created_at
      FROM stock_in si
      JOIN products p ON si.product_id = p.id
      JOIN suppliers s ON si.supplier_id = s.id
      JOIN staff st ON si.recorded_by = st.id
      LEFT JOIN academic_terms at_t ON si.term_id = at_t.id
      WHERE 1=1
    `;

    let stockOutQuery = `
      SELECT
        so.id, 'OUT' as transaction_type,
        so.transaction_date as date,
        so.transaction_time as time,
        p.name as product_name,
        p.category,
        so.quantity,
        so.unit,
        p.avg_unit_cost as unit_cost,
        (so.quantity * p.avg_unit_cost) as total_cost,
        'IBB Kitchen / Boarding' as party_name,
        so.notes,
        st.full_name as recorded_by_name,
        st.role as recorded_by_role,
        so.term_id,
        at_t.academic_year,
        at_t.name as term_name,
        so.created_at
      FROM stock_out so
      JOIN products p ON so.product_id = p.id
      JOIN staff st ON so.issued_by = st.id
      LEFT JOIN academic_terms at_t ON so.term_id = at_t.id
      WHERE 1=1
    `;

    const inParams: any[] = [];
    const outParams: any[] = [];

    if (productId && productId !== 'all') {
      stockInQuery += ' AND si.product_id = ?';
      stockOutQuery += ' AND so.product_id = ?';
      inParams.push(productId);
      outParams.push(productId);
    }
    if (termId && termId !== 'all') {
      stockInQuery += ' AND si.term_id = ?';
      stockOutQuery += ' AND so.term_id = ?';
      inParams.push(termId);
      outParams.push(termId);
    }
    if (academicYear && academicYear !== 'all') {
      stockInQuery += ' AND at_t.academic_year = ?';
      stockOutQuery += ' AND at_t.academic_year = ?';
      inParams.push(academicYear);
      outParams.push(academicYear);
    }
    if (startDate) {
      stockInQuery += ' AND si.transaction_date >= ?';
      stockOutQuery += ' AND so.transaction_date >= ?';
      inParams.push(startDate);
      outParams.push(startDate);
    }
    if (endDate) {
      stockInQuery += ' AND si.transaction_date <= ?';
      stockOutQuery += ' AND so.transaction_date <= ?';
      inParams.push(endDate);
      outParams.push(endDate);
    }

    let results: any[] = [];

    if (type === 'IN') {
      results = db.prepare(stockInQuery + ' ORDER BY si.id DESC').all(...inParams);
    } else if (type === 'OUT') {
      results = db.prepare(stockOutQuery + ' ORDER BY so.id DESC').all(...outParams);
    } else {
      const inRows = db.prepare(stockInQuery).all(...inParams);
      const outRows = db.prepare(stockOutQuery).all(...outParams);
      results = [...inRows, ...outRows].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return res.json({ transactions: results });
  } catch (err) {
    console.error('Ledger error:', err);
    return res.status(500).json({ error: 'Failed to retrieve transactions ledger.' });
  }
});

// Valuation and Inventory Summary
router.get('/valuation', authenticateToken, (req: AuthRequest, res) => {
  try {
    const valuation = db.prepare(`
      SELECT
        COUNT(*) as total_items,
        SUM(current_stock * avg_unit_cost) as total_valuation,
        SUM(CASE WHEN current_stock <= min_stock_alert THEN 1 ELSE 0 END) as low_stock_count,
        SUM(CASE WHEN current_stock > min_stock_alert THEN 1 ELSE 0 END) as healthy_stock_count
      FROM products
      WHERE is_active = 1
    `).get() as {
      total_items: number;
      total_valuation: number;
      low_stock_count: number;
      healthy_stock_count: number;
    };

    return res.json({ summary: valuation });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to calculate inventory valuation.' });
  }
});

export default router;
