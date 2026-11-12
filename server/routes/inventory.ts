import { Router } from 'express';
import { db } from '../db';
import {
  authenticateToken,
  requireRoles,
  logAudit,
  createNotification,
  getKigaliStockScheduleStatus,
  AuthRequest
} from '../auth';

const router = Router();

// Schedule status endpoint (publicly viewable by authenticated staff)
router.get('/schedule-status', authenticateToken, (req: AuthRequest, res) => {
  try {
    const status = getKigaliStockScheduleStatus();
    const schedules = db.prepare('SELECT * FROM stock_schedules ORDER BY start_time ASC').all();
    return res.json({
      ...status,
      configuredSchedules: schedules,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to evaluate stock schedule status.' });
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

// Stock In: Record procurement (Accountant & Director)
router.post('/stock-in', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { productId, supplierId, quantity, unitCost, transactionDate, notes } = req.body;

    const qty = parseFloat(quantity);
    const cost = parseFloat(unitCost) || 0.0;

    if (!productId || !supplierId || isNaN(qty) || qty <= 0 || !transactionDate) {
      return res.status(400).json({ error: 'Product, Supplier, positive Quantity, and Transaction Date are required.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as {
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

    const totalCost = qty * cost;

    // Find term matching transaction date or current active term
    const matchedTerm = db.prepare(`
      SELECT id FROM academic_terms 
      WHERE (? >= start_date AND ? <= end_date) 
         OR status = 'Active' 
      ORDER BY (? >= start_date AND ? <= end_date) DESC, (status = 'Active') DESC 
      LIMIT 1
    `).get(transactionDate, transactionDate, transactionDate, transactionDate) as { id: number } | undefined;

    // Database transaction to guarantee atomic ledger update
    const recordStockIn = db.transaction(() => {
      // 1. Insert stock_in record
      const stmt = db.prepare(`
        INSERT INTO stock_in (product_id, supplier_id, quantity, unit, unit_cost, total_cost, transaction_date, notes, recorded_by, term_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertResult = stmt.run(
        product.id,
        supplier.id,
        qty,
        product.unit,
        cost,
        totalCost,
        transactionDate,
        notes?.trim() || null,
        req.user!.id,
        matchedTerm?.id || null
      );

      // 2. Compute new weighted average cost and update current stock
      const newStock = product.current_stock + qty;
      let newAvgCost = product.avg_unit_cost;
      if (cost > 0 && newStock > 0) {
        newAvgCost = ((product.current_stock * product.avg_unit_cost) + totalCost) / newStock;
      }

      db.prepare(`
        UPDATE products
        SET current_stock = ?, avg_unit_cost = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newStock, newAvgCost, product.id);

      return insertResult.lastInsertRowid;
    });

    const txId = recordStockIn();

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'STOCK_IN',
      recordType: 'STOCK_IN',
      recordId: String(txId),
      details: `Procured ${qty} ${product.unit} of ${product.name} from ${supplier.name} at RWF ${cost}/${product.unit} (Total: RWF ${totalCost})`,
      req,
    });

    createNotification({
      title: 'Food Stock Procured (Stock In)',
      message: `${qty} ${product.unit} of ${product.name} received from ${supplier.name}.`,
      type: 'success',
      targetRole: 'ALL',
      link: '/dashboard/accountant/inventory',
    });

    return res.status(201).json({
      message: `Stock In recorded successfully. New available stock: ${product.current_stock + qty} ${product.unit}.`,
      transactionId: txId,
    });
  } catch (err) {
    console.error('Stock in error:', err);
    return res.status(500).json({ error: 'Failed to record Stock In transaction.' });
  }
});

// Stock Out: Record daily issue (Director, Animator & Accountant)
router.post('/stock-out', authenticateToken, requireRoles(['DIRECTOR', 'ANIMATOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const { productId, quantity, transactionDate, notes, isEmergencyOverride, overrideReason } = req.body;

    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Product and a positive Quantity to issue are required.' });
    }

    // Schedule Enforcement (Server-side Africa/Kigali Time)
    const scheduleStatus = getKigaliStockScheduleStatus();
    const userRole = req.user!.role;
    const isDirector = userRole === 'DIRECTOR';
    const isAccountant = userRole === 'ACCOUNTANT';
    const isManagement = isDirector || isAccountant;
    const isAnimator = userRole === 'ANIMATOR';

    // The newly authorized Director and Accountant hold institutional authority and must not be blocked by Animator refectory schedules
    if (!scheduleStatus.isPermitted && isAnimator) {
      if (!isEmergencyOverride) {
        return res.status(403).json({
          error: scheduleStatus.reason,
          scheduleRestricted: true,
          kigaliTime: scheduleStatus.kigaliTime,
          nextOpeningTime: scheduleStatus.nextOpeningTime,
        });
      }

      if (!overrideReason || overrideReason.trim().length < 5) {
        return res.status(400).json({
          error: 'A detailed official justification reason is mandatory for emergency off-schedule stock release.',
        });
      }
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as {
      id: number;
      name: string;
      unit: string;
      current_stock: number;
      min_stock_alert: number;
    } | undefined;

    if (!product) {
      return res.status(404).json({ error: 'Selected product was not found.' });
    }

    // CRITICAL: Strictly prevent negative stock
    if (product.current_stock < qty) {
      return res.status(400).json({
        error: `Insufficient stock! Requested: ${qty} ${product.unit}, but only ${product.current_stock} ${product.unit} is available. Negative stock is forbidden.`,
      });
    }

    const now = new Date();
    const kigaliTime = scheduleStatus.kigaliTime;
    const txDate = transactionDate || now.toISOString().split('T')[0];

    // Find active or date-matched term
    const matchedTerm = db.prepare(`
      SELECT id FROM academic_terms 
      WHERE (? >= start_date AND ? <= end_date) 
         OR status = 'Active' 
      ORDER BY (? >= start_date AND ? <= end_date) DESC, (status = 'Active') DESC 
      LIMIT 1
    `).get(txDate, txDate, txDate, txDate) as { id: number } | undefined;

    // Database transaction to atomically update stock ledger and balance
    const recordStockOut = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO stock_out (product_id, quantity, unit, transaction_date, transaction_time, notes, is_emergency_override, override_reason, issued_by, term_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertResult = stmt.run(
        product.id,
        qty,
        product.unit,
        txDate,
        kigaliTime,
        notes?.trim() || null,
        isEmergencyOverride ? 1 : 0,
        overrideReason?.trim() || null,
        req.user!.id,
        matchedTerm?.id || null
      );

      const remainingStock = product.current_stock - qty;

      db.prepare(`
        UPDATE products
        SET current_stock = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(remainingStock, product.id);

      return { txId: insertResult.lastInsertRowid, remainingStock };
    });

    const { txId, remainingStock } = recordStockOut();

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: isEmergencyOverride ? 'STOCK_OUT_EMERGENCY_OVERRIDE' : 'STOCK_OUT',
      recordType: 'STOCK_OUT',
      recordId: String(txId),
      details: `${req.user!.role} issued ${qty} ${product.unit} of ${product.name}. Remaining: ${remainingStock} ${product.unit}.${isEmergencyOverride ? ' Override Reason: ' + overrideReason : ''}`,
      req,
    });

    // Check low stock alert
    if (remainingStock <= product.min_stock_alert) {
      createNotification({
        title: `Low Stock Alert: ${product.name}`,
        message: `${product.name} reserve has fallen to ${remainingStock} ${product.unit} (Alert threshold: ${product.min_stock_alert} ${product.unit}). Reorder recommended.`,
        type: 'warning',
        targetRole: 'ALL',
        link: '/dashboard/accountant/inventory',
      });
    }

    return res.status(201).json({
      message: `Stock Out issued successfully. ${qty} ${product.unit} of ${product.name} released. Available: ${remainingStock} ${product.unit}.`,
      transactionId: txId,
      remainingStock,
    });
  } catch (err) {
    console.error('Stock out error:', err);
    return res.status(500).json({ error: 'Failed to record Stock Out transaction.' });
  }
});

// ========================================================
// QUARTERLY STOCK MANAGEMENT — RWANDA ACADEMIC TERMS ROUTES
// ========================================================

// 1. List all academic terms with summary figures
router.get('/terms', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { academicYear } = req.query;

    const years = db.prepare('SELECT DISTINCT academic_year FROM academic_terms ORDER BY academic_year DESC').all().map((r: any) => r.academic_year);
    const selectedYear = academicYear ? String(academicYear) : (years[0] || '2026-2027');

    const terms = db.prepare(`
      SELECT 
        t.*,
        (SELECT COUNT(DISTINCT product_id) FROM term_stock_records WHERE term_id = t.id) as tracked_items_count,
        COALESCE((SELECT SUM(quantity) FROM stock_in WHERE term_id = t.id OR (transaction_date >= t.start_date AND transaction_date <= t.end_date)), 0) as total_received_quantity,
        COALESCE((SELECT SUM(quantity) FROM stock_out WHERE term_id = t.id OR (transaction_date >= t.start_date AND transaction_date <= t.end_date)), 0) as total_issued_quantity,
        COALESCE((SELECT SUM(total_cost) FROM stock_in WHERE term_id = t.id OR (transaction_date >= t.start_date AND transaction_date <= t.end_date)), 0) as total_procurement_spend
      FROM academic_terms t
      WHERE t.academic_year = ?
      ORDER BY t.term_number ASC
    `).all(selectedYear);

    return res.json({
      academicYear: selectedYear,
      availableYears: years.length > 0 ? years : ['2026-2027'],
      terms,
    });
  } catch (err) {
    console.error('Failed to fetch academic terms:', err);
    return res.status(500).json({ error: 'Failed to fetch academic terms.' });
  }
});

// 2. Detailed breakdown of a single term with all products, opening/received/issued/closing stock
router.get('/terms/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all() as any[];

    const items = products.map((prod) => {
      let record = db.prepare('SELECT * FROM term_stock_records WHERE term_id = ? AND product_id = ?').get(term.id, prod.id) as any;

      const inQty = (db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total 
        FROM stock_in 
        WHERE product_id = ? AND (term_id = ? OR (transaction_date >= ? AND transaction_date <= ?))
      `).get(prod.id, term.id, term.start_date, term.end_date) as any).total;

      const outQty = (db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total 
        FROM stock_out 
        WHERE product_id = ? AND (term_id = ? OR (transaction_date >= ? AND transaction_date <= ?))
      `).get(prod.id, term.id, term.start_date, term.end_date) as any).total;

      let openingStock = 0;
      if (record) {
        openingStock = record.opening_stock;
      } else {
        if (term.term_number > 1) {
          const prevTerm = db.prepare('SELECT id FROM academic_terms WHERE academic_year = ? AND term_number = ?').get(term.academic_year, term.term_number - 1) as any;
          if (prevTerm) {
            const prevRecord = db.prepare('SELECT closing_stock FROM term_stock_records WHERE term_id = ? AND product_id = ?').get(prevTerm.id, prod.id) as any;
            if (prevRecord) {
              openingStock = prevRecord.closing_stock;
            }
          }
        } else {
          openingStock = Math.max(0, prod.current_stock - inQty + outQty);
        }
      }

      // Closing stock: Opening + Received - Issued
      const calculatedClosing = term.status === 'Closed' && record?.is_locked
        ? record.closing_stock
        : Math.max(0, openingStock + inQty - outQty);

      const totalValuation = Math.round(calculatedClosing * (prod.avg_unit_cost || 0));

      return {
        id: prod.id,
        productId: prod.id,
        product_id: prod.id,
        name: prod.name,
        product_name: prod.name,
        category: prod.category,
        unit: prod.unit,
        avgUnitCost: prod.avg_unit_cost,
        unit_cost: prod.avg_unit_cost,
        currentWarehouseStock: prod.current_stock,
        openingStock,
        opening_stock: openingStock,
        receivedQuantity: inQty,
        received_quantity: inQty,
        issuedQuantity: outQty,
        issued_quantity: outQty,
        closingStock: calculatedClosing,
        closing_stock: calculatedClosing,
        totalValuation,
        total_value: totalValuation,
        minStockAlert: prod.min_stock_alert,
        min_stock_alert: prod.min_stock_alert,
        stockStatus: calculatedClosing <= 0 ? 'OUT_OF_STOCK' : (calculatedClosing <= prod.min_stock_alert ? 'LOW_STOCK' : 'NORMAL'),
        stock_status: calculatedClosing <= 0 ? 'OUT_OF_STOCK' : (calculatedClosing <= prod.min_stock_alert ? 'LOW_STOCK' : 'NORMAL'),
        isLocked: record ? record.is_locked : 0,
        is_locked: record ? record.is_locked : 0,
      };
    });

    // Recent transactions during this term
    const termStockIn = db.prepare(`
      SELECT si.id, 'IN' as type, si.transaction_date as date, '--:--' as time,
             p.name as product_name, si.quantity, si.unit, si.total_cost, s.name as party_name,
             st.full_name as staff_name, si.notes
      FROM stock_in si
      JOIN products p ON si.product_id = p.id
      JOIN suppliers s ON si.supplier_id = s.id
      JOIN staff st ON si.recorded_by = st.id
      WHERE si.term_id = ? OR (si.transaction_date >= ? AND si.transaction_date <= ?)
      ORDER BY si.transaction_date DESC, si.id DESC
      LIMIT 25
    `).all(term.id, term.start_date, term.end_date);

    const termStockOut = db.prepare(`
      SELECT so.id, 'OUT' as type, so.transaction_date as date, so.transaction_time as time,
             p.name as product_name, so.quantity, so.unit, 0 as total_cost, 'Boarding Refectory' as party_name,
             st.full_name as staff_name, so.notes
      FROM stock_out so
      JOIN products p ON so.product_id = p.id
      JOIN staff st ON so.issued_by = st.id
      WHERE so.term_id = ? OR (so.transaction_date >= ? AND so.transaction_date <= ?)
      ORDER BY so.transaction_date DESC, so.transaction_time DESC, so.id DESC
      LIMIT 25
    `).all(term.id, term.start_date, term.end_date);

    return res.json({
      term,
      items,
      summary: {
        totalProducts: items.length,
        totalOpeningQuantity: items.reduce((sum, i) => sum + i.openingStock, 0),
        totalReceivedQuantity: items.reduce((sum, i) => sum + i.receivedQuantity, 0),
        totalIssuedQuantity: items.reduce((sum, i) => sum + i.issuedQuantity, 0),
        totalClosingQuantity: items.reduce((sum, i) => sum + i.closingStock, 0),
        totalValuation: items.reduce((sum, i) => sum + i.totalValuation, 0),
      },
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

// 3. Configure/Update term dates
router.put('/terms/:id', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const startDate = req.body.startDate || req.body.start_date;
    const endDate = req.body.endDate || req.body.end_date;
    const name = req.body.name;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and End date are required.' });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'Start date must precede End date.' });
    }

    db.prepare(`
      UPDATE academic_terms 
      SET start_date = ?, end_date = ?, name = COALESCE(?, name), updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(startDate, endDate, name?.trim() || null, termId);

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_CONFIG_UPDATED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(termId),
      details: `Term schedule updated: ${startDate} to ${endDate}.`,
      req,
    });

    return res.json({ message: 'Term dates updated successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update term configuration.' });
  }
});

// 4. Activate a term
router.post('/terms/:id/activate', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    db.transaction(() => {
      // Set any other active term to Upcoming or Closed depending on date
      db.prepare(`
        UPDATE academic_terms 
        SET status = CASE WHEN end_date < DATE('now') THEN 'Closed' ELSE 'Upcoming' END
        WHERE status = 'Active' AND id != ?
      `).run(term.id);

      db.prepare("UPDATE academic_terms SET status = 'Active', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(term.id);
    })();

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_ACTIVATED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(term.id),
      details: `${term.name} (${term.academic_year}) set as active stock period.`,
      req,
    });

    return res.json({ message: `${term.name} (${term.academic_year}) is now the active stock period.` });
  } catch (err) {
    console.error('Failed to activate term:', err);
    return res.status(500).json({ error: 'Failed to set active term.' });
  }
});

// 5. Close a term and automatically carry forward closing balances to next term
router.post('/terms/:id/close', authenticateToken, requireRoles(['DIRECTOR', 'ACCOUNTANT']), (req: AuthRequest, res) => {
  try {
    const termId = parseInt(req.params.id, 10);
    const closingNotes = req.body.closingNotes || req.body.closing_notes;

    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) {
      return res.status(404).json({ error: 'Academic term was not found.' });
    }

    if (term.status === 'Closed') {
      return res.status(400).json({ error: `${term.name} is already closed and audited. Closing cannot be duplicated.` });
    }

    const products = db.prepare('SELECT * FROM products').all() as any[];

    // Execute atomic closing transaction
    const executeClose = db.transaction(() => {
      const insertOrUpdateRecord = db.prepare(`
        INSERT INTO term_stock_records (term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked, notes, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(term_id, product_id) DO UPDATE SET
          closing_stock = excluded.closing_stock,
          received_quantity = excluded.received_quantity,
          issued_quantity = excluded.issued_quantity,
          is_locked = 1,
          notes = excluded.notes,
          updated_at = CURRENT_TIMESTAMP
      `);

      const closingBalances: Array<{ productId: number; unit: string; closingStock: number }> = [];

      for (const prod of products) {
        let record = db.prepare('SELECT opening_stock FROM term_stock_records WHERE term_id = ? AND product_id = ?').get(term.id, prod.id) as any;

        const inQty = (db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) as total 
          FROM stock_in 
          WHERE product_id = ? AND (term_id = ? OR (transaction_date >= ? AND transaction_date <= ?))
        `).get(prod.id, term.id, term.start_date, term.end_date) as any).total;

        const outQty = (db.prepare(`
          SELECT COALESCE(SUM(quantity), 0) as total 
          FROM stock_out 
          WHERE product_id = ? AND (term_id = ? OR (transaction_date >= ? AND transaction_date <= ?))
        `).get(prod.id, term.id, term.start_date, term.end_date) as any).total;

        let openingStock = record ? record.opening_stock : 0;
        if (!record && term.term_number > 1) {
          const prevTerm = db.prepare('SELECT id FROM academic_terms WHERE academic_year = ? AND term_number = ?').get(term.academic_year, term.term_number - 1) as any;
          if (prevTerm) {
            const prevRec = db.prepare('SELECT closing_stock FROM term_stock_records WHERE term_id = ? AND product_id = ?').get(prevTerm.id, prod.id) as any;
            if (prevRec) openingStock = prevRec.closing_stock;
          }
        }

        const closingStock = Math.max(0, openingStock + inQty - outQty);
        closingBalances.push({ productId: prod.id, unit: prod.unit, closingStock });

        insertOrUpdateRecord.run(term.id, prod.id, openingStock, inQty, outQty, closingStock, prod.unit, closingNotes || null);
      }

      // Mark term as closed
      db.prepare(`
        UPDATE academic_terms 
        SET status = 'Closed', 
            closed_at = CURRENT_TIMESTAMP, 
            closed_by = ?, 
            closed_by_name = ?, 
            closing_notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(req.user!.id, req.user!.fullName, closingNotes?.trim() || null, term.id);

      // AUTOMATIC CARRY-FORWARD to next term in academic year (Term 1 -> Term 2; Term 2 -> Term 3)
      if (term.term_number < 3) {
        const nextTermNumber = term.term_number + 1;
        const nextTerm = db.prepare('SELECT * FROM academic_terms WHERE academic_year = ? AND term_number = ?').get(term.academic_year, nextTermNumber) as any;

        if (nextTerm) {
          const insertNextRecord = db.prepare(`
            INSERT INTO term_stock_records (term_id, product_id, opening_stock, received_quantity, issued_quantity, closing_stock, unit, is_locked)
            VALUES (?, ?, ?, 0, 0, ?, ?, 0)
            ON CONFLICT(term_id, product_id) DO UPDATE SET
              opening_stock = excluded.opening_stock,
              closing_stock = excluded.opening_stock + received_quantity - issued_quantity,
              updated_at = CURRENT_TIMESTAMP
          `);

          for (const bal of closingBalances) {
            insertNextRecord.run(nextTerm.id, bal.productId, bal.closingStock, bal.closingStock, bal.unit);
          }
        }
      }

      return closingBalances;
    });

    executeClose();

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_STOCK_CLOSED',
      recordType: 'ACADEMIC_TERM',
      recordId: String(term.id),
      details: `${term.name} (${term.academic_year}) inventory closed by ${req.user!.fullName}. Closing balances carried forward to Term ${term.term_number + 1}.`,
      req,
    });

    createNotification({
      title: `${term.name} Stock Audited & Closed`,
      message: `${term.name} (${term.academic_year}) has been formally closed by ${req.user!.fullName}. Closing inventory balances locked and carried forward to the next term.`,
      type: 'info',
      targetRole: 'ALL',
      link: '/dashboard/director/terms',
    });

    return res.json({
      message: `${term.name} (${term.academic_year}) has been closed successfully. All closing balances have been locked and carried forward as the opening stock for the next term.`,
    });
  } catch (err) {
    console.error('Failed to close term:', err);
    return res.status(500).json({ error: 'Failed to close academic term and lock inventory.' });
  }
});

// 6. Adjust opening balance for a term (for initial term setup with audit logging)
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

    const term = db.prepare('SELECT * FROM academic_terms WHERE id = ?').get(termId) as any;
    if (!term) return res.status(404).json({ error: 'Term not found.' });

    if (term.status === 'Closed') {
      return res.status(400).json({ error: 'Closed term stock records cannot be modified directly.' });
    }

    const prod = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as any;
    if (!prod) return res.status(404).json({ error: 'Product not found.' });

    db.prepare(`
      INSERT INTO term_stock_records (term_id, product_id, opening_stock, closing_stock, unit, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(term_id, product_id) DO UPDATE SET
        opening_stock = excluded.opening_stock,
        closing_stock = excluded.opening_stock + received_quantity - issued_quantity,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).run(term.id, prod.id, qty, qty, prod.unit, reason || 'Manual opening balance adjustment');

    logAudit({
      userId: req.user!.id,
      userName: req.user!.fullName,
      userRole: req.user!.role,
      action: 'TERM_OPENING_STOCK_ADJUSTED',
      recordType: 'TERM_STOCK_RECORD',
      recordId: `${term.id}_${prod.id}`,
      details: `${term.name} opening stock for ${prod.name} adjusted to ${qty} ${prod.unit}. Reason: ${reason || 'N/A'}.`,
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
    const { type, productId, startDate, endDate } = req.query;

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
        0 as is_emergency_override,
        null as override_reason,
        si.created_at
      FROM stock_in si
      JOIN products p ON si.product_id = p.id
      JOIN suppliers s ON si.supplier_id = s.id
      JOIN staff st ON si.recorded_by = st.id
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
        so.is_emergency_override,
        so.override_reason,
        so.created_at
      FROM stock_out so
      JOIN products p ON so.product_id = p.id
      JOIN staff st ON so.issued_by = st.id
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
