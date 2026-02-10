import { Router } from 'express';
import { Database } from '../lib/database';

const router = Router();

const parseDays = (value: any) => {
  const days = Number(value);
  return Number.isFinite(days) && days > 0 ? days : 30;
};

const buildDateFilter = (days: number) => {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return since.toISOString();
};

router.get('/summary', (req, res) => {
  const companyId = Number(req.query.companyId);
  const all = String(req.query.all || '').toLowerCase() === 'true';
  const days = parseDays(req.query.days);
  const since = buildDateFilter(days);

  const where = all || !companyId ? 'WHERE o.created_at >= ?' : 'WHERE p.vendor_id = ? AND o.created_at >= ?';
  const params = all || !companyId ? [since] : [companyId, since];

  const summaryQuery = `
    SELECT
      COALESCE(SUM(oi.quantity), 0) as total_sales,
      COALESCE(SUM(oi.total_price_cents), 0) as total_revenue_cents,
      COUNT(DISTINCT o.id) as orders_count
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    ${where}
  `;

  const topProductsQuery = `
    SELECT p.id as product_id, p.name, SUM(oi.quantity) as units, SUM(oi.total_price_cents) as revenue_cents
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    ${where}
    GROUP BY p.id
    ORDER BY revenue_cents DESC
    LIMIT 5
  `;

  Database.db.get(summaryQuery, params, (err, summary) => {
    if (err) return res.status(500).json({ success: false, error: 'db_error' });

    Database.db.all(topProductsQuery, params, (err2, topProducts) => {
      if (err2) return res.status(500).json({ success: false, error: 'db_error' });

      res.json({
        totalSales: Number(summary?.total_sales || 0),
        totalRevenueCents: Number(summary?.total_revenue_cents || 0),
        ordersCount: Number(summary?.orders_count || 0),
        topProducts: (topProducts || []).map((p: any) => ({
          productId: p.product_id,
          name: p.name,
          units: Number(p.units || 0),
          revenueCents: Number(p.revenue_cents || 0),
        })),
        currency: 'USD',
      });
    });
  });
});

router.get('/sales', (req, res) => {
  const companyId = Number(req.query.companyId);
  const all = String(req.query.all || '').toLowerCase() === 'true';
  const days = parseDays(req.query.days);
  const since = buildDateFilter(days);

  const where = all || !companyId ? 'WHERE o.created_at >= ?' : 'WHERE p.vendor_id = ? AND o.created_at >= ?';
  const params = all || !companyId ? [since] : [companyId, since];

  const salesQuery = `
    SELECT DATE(o.created_at) as day, SUM(oi.total_price_cents) as revenue_cents, COUNT(DISTINCT o.id) as orders
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    ${where}
    GROUP BY DATE(o.created_at)
    ORDER BY day ASC
  `;

  Database.db.all(salesQuery, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: 'db_error' });
    res.json({
      success: true,
      data: (rows || []).map((row: any) => ({
        date: row.day,
        revenueCents: Number(row.revenue_cents || 0),
        orders: Number(row.orders || 0),
      })),
    });
  });
});

export default router;
