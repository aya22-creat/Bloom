import { Card } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";

interface SalesChartProps {
  data: Array<{ date: string; revenueCents: number }>;
  currency: string;
}

export const SalesChart = ({ data, currency }: SalesChartProps) => {
  const chartData = data.map((item) => ({
    date: item.date,
    revenue: item.revenueCents,
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(value / 100);
  };

  return (
    <Card className="p-6 bg-white shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Revenue Over Time</h3>
      <ChartContainer
        config={{
          revenue: { label: "Revenue", color: "hsl(var(--primary))" },
        }}
      >
        <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <ChartTooltip content={<ChartTooltipContent nameKey="revenue" />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
};
