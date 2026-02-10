import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TopProduct {
  productId: number;
  name: string;
  units: number;
  revenueCents: number;
}

export const TopProductsTable = ({ products, currency }: { products: TopProduct[]; currency: string }) => {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value / 100);

  return (
    <Card className="p-6 bg-white shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Top Products</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Units Sold</TableHead>
            <TableHead>Revenue</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.productId}>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>{product.units}</TableCell>
              <TableCell>{formatCurrency(product.revenueCents)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
