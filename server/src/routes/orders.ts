import { Router } from 'express';
import { Database } from '../lib/database';

const router = Router();

const fetchProductsByIds = (ids: number[]) =>
  new Promise<any[]>((resolve, reject) => {
    if (!ids.length) return resolve([]);
    const placeholders = ids.map(() => '?').join(',');
    Database.db.all(
      `SELECT id, name, price, currency, vendor_id FROM products WHERE id IN (${placeholders})`,
      ids,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });

router.post('/', async (req, res) => {
  try {
    const { userId, currency, shipping, items } = req.body || {};
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items_required' });
    }

    const ids = items.map((i: any) => Number(i.productId)).filter((id: number) => Number.isFinite(id));
    const products = await fetchProductsByIds(ids);

    if (!products.length) {
      return res.status(400).json({ success: false, error: 'invalid_products' });
    }

    let totalCents = 0;
    const normalizedCurrency = currency || 'USD';
    const intentId = `intent_${Date.now()}`;

    const orderId = await new Promise<number>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO orders (user_id, status, amount_cents, currency, intent_id, shipping_name, shipping_phone, shipping_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId || null,
          'pending',
          0,
          normalizedCurrency,
          intentId,
          shipping?.name || null,
          shipping?.phone || null,
          shipping?.address || null,
        ],
        function (this: any, err) {
          if (err) return reject(err);
          resolve(Number(this?.lastID || 0));
        }
      );
    });

    for (const item of items) {
      const product = products.find((p) => p.id === Number(item.productId));
      if (!product) continue;
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitCents = Math.round(Number(product.price || 0) * 100);
      const lineTotal = unitCents * quantity;
      totalCents += lineTotal;

      await new Promise<void>((resolve, reject) => {
        Database.db.run(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents, total_price_cents, currency)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, product.id, quantity, unitCents, lineTotal, normalizedCurrency],
          (err) => {
            if (err) return reject(err);
            resolve();
          }
        );
      });
    }

    await new Promise<void>((resolve) => {
      Database.db.run(`UPDATE orders SET amount_cents = ? WHERE id = ?`, [totalCents, orderId], () => resolve());
    });

    res.json({
      success: true,
      orderId,
      intentId,
      amountCents: totalCents,
      currency: normalizedCurrency,
      status: 'pending',
    });
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ success: false, error: 'order_failed' });
  }
});

router.get('/user', (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ success: false, error: 'user_id_required' });

  Database.db.all(
    `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) return res.status(500).json({ success: false, error: 'db_error' });
      const orderIds = (orders || []).map((o: any) => o.id);
      if (!orderIds.length) return res.json({ success: true, data: [] });

      const placeholders = orderIds.map(() => '?').join(',');
      Database.db.all(
        `SELECT oi.*, p.name, p.category, p.vendor_id FROM order_items oi JOIN products p ON p.id=oi.product_id WHERE oi.order_id IN (${placeholders})`,
        orderIds,
        (itemErr, items) => {
          if (itemErr) return res.status(500).json({ success: false, error: 'db_error' });
          const grouped = (orders || []).map((order: any) => ({
            ...order,
            items: (items || []).filter((i: any) => i.order_id === order.id),
          }));
          res.json({ success: true, data: grouped });
        }
      );
    }
  );
});

router.get('/company', (req, res) => {
  const companyId = Number(req.query.companyId);
  if (!companyId) return res.status(400).json({ success: false, error: 'company_id_required' });

  Database.db.all(
    `SELECT o.*, oi.*, p.name, p.category, p.vendor_id
     FROM orders o
     JOIN order_items oi ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE p.vendor_id = ?
     ORDER BY o.created_at DESC`,
    [companyId],
    (err, rows) => {
      if (err) return res.status(500).json({ success: false, error: 'db_error' });
      res.json({ success: true, data: rows || [] });
    }
  );
});

export default router;
