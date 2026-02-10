import { Card } from "@/components/ui/card";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  trend?: string;
}

export const StatsCard = ({ title, value, icon, trend }: StatsCardProps) => {
  return (
    <Card className="p-5 bg-white shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-semibold text-foreground mt-2">{value}</h3>
          {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
        </div>
        {icon && <div className="text-primary">{icon}</div>}
      </div>
    </Card>
  );
};
