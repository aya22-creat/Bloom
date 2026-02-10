import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/company/StatsCard";
import { SalesChart } from "@/components/company/SalesChart";
import { TopProductsTable } from "@/components/company/TopProductsTable";
import { apiCompanyAnalytics } from "@/lib/api";
import { DollarSign, ShoppingBag, Package } from "lucide-react";

interface CompanyAnalyticsProps {
  companyId?: number;
  allCompanies?: boolean;
}

export const CompanyAnalytics = ({ companyId, allCompanies }: CompanyAnalyticsProps) => {
  const [days, setDays] = useState(30);

  const summaryQuery = useQuery({
    queryKey: ["company-analytics-summary", companyId, allCompanies, days],
    queryFn: () => apiCompanyAnalytics.getSummary({ companyId, all: allCompanies, days }),
  });

  const salesQuery = useQuery({
    queryKey: ["company-analytics-sales", companyId, allCompanies, days],
    queryFn: () => apiCompanyAnalytics.getSales({ companyId, all: allCompanies, days }),
  });

  const summary = summaryQuery.data || {
    totalSales: 0,
    ordersCount: 0,
    totalRevenueCents: 0,
    topProducts: [],
    currency: "USD",
  };

  const salesData = salesQuery.data?.data || [];

  const currency = summary.currency || "USD";

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value / 100);

  const filters = [7, 30, 90];

  const topProducts = useMemo(() => summary.topProducts || [], [summary.topProducts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Company Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track sales performance, orders, and product demand.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filters.map((range) => (
            <Button
              key={range}
              variant={days === range ? "default" : "outline"}
              size="sm"
              onClick={() => setDays(range)}
            >
              {range} days
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenueCents)}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <StatsCard
          title="Orders"
          value={String(summary.ordersCount)}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <StatsCard
          title="Units Sold"
          value={String(summary.totalSales)}
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart data={salesData} currency={currency} />
        <TopProductsTable products={topProducts} currency={currency} />
      </div>
    </div>
  );
};
