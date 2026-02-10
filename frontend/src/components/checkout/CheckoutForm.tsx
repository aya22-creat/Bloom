import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(7, "Phone number is required"),
  address: z.string().min(10, "Address is required"),
  notes: z.string().optional(),
});

export type CheckoutValues = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  onSubmit: (values: CheckoutValues) => void;
  isSubmitting?: boolean;
}

export const CheckoutForm = ({ onSubmit, isSubmitting }: CheckoutFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
  });

  return (
    <Card className="p-6 bg-white shadow-soft">
      <h3 className="text-lg font-semibold text-foreground mb-4">Shipping Information</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" {...register("fullName")}
            placeholder="Your full name" />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} placeholder="+20 1xx xxx xxxx" />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" {...register("address")} placeholder="Street, city, country" />
          {errors.address && (
            <p className="text-sm text-destructive">{errors.address.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Delivery Notes (Optional)</Label>
          <Textarea id="notes" {...register("notes")} placeholder="Optional notes for delivery" />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Placing order..." : "Place Order"}
        </Button>
      </form>
    </Card>
  );
};
