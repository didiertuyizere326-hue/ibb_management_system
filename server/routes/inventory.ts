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

    // Database transaction to guarantee atomic ledger update
    const recordStockIn = db.transaction(() => {
      // 1. Insert stock_in record
      const stmt = db.prepare(`
        INSERT INTO stock_in (product_id, supplier_id, quantity, unit, unit_cost, total_cost, transaction_date, notes, recorded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        req.user!.id
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

// Stock Out: Record daily issue (Animator & Director)
router.post('/stock-out', authenticateToken, requireRoles(['DIRECTOR', 'ANIMATOR']), (req: AuthRequest, res) => {
  try {
    const { productId, quantity, transactionDate, notes, isEmergencyOverride, overrideReason } = req.body;

    const qty = parseFloat(quantity);
    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Product and a positive Quantity to issue are required.' });
    }

    // Schedule Enforcement (Server-side Africa/Kigali Time)
    const scheduleStatus = getKigaliStockScheduleStatus();
    const isDirector = req.user!.role === 'DIRECTOR';

    if (!scheduleStatus.isPermitted) {
      if (!isEmergencyOverride) {
        return res.status(403).json({
          error: scheduleStatus.reason,
          scheduleRestricted: true,
          kigaliTime: scheduleStatus.kigaliTime,
          nextOpeningTime: scheduleStatus.nextOpeningTime,
        });
      }

      // Emergency override is strictly restricted to Director
      if (!isDirector) {
        logAudit({
          userId: req.user!.id,
          userName: req.user!.fullName,
          userRole: req.user!.role,
          action: 'UNAUTHORIZED_OVERRIDE_ATTEMPT',
          recordType: 'STOCK_OUT',
          details: `Animator attempted emergency override without Director authorization.`,
          req,
        });
        return res.status(403).json({
          error: 'Only the Director possesses super-admin authority to trigger emergency stock out overrides outside authorized hours.',
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

    // Database transaction to atomically update stock ledger and balance
    const recordStockOut = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO stock_out (product_id, quantity, unit, transaction_date, transaction_time, notes, is_emergency_override, override_reason, issued_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        req.user!.id
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
      details: `Issued ${qty} ${product.unit} of ${product.name}. Remaining: ${remainingStock} ${product.unit}. ${isEmergencyOverride ? 'Override Reason: ' + overrideReason : ''}`,
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
