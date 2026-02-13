import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ShoppingCart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../services/product.service';
import { getProductImage } from '../lib/productImage';
import ProductImageAuto from './ProductImageAuto';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/marketplace/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(price);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
      <div className="relative">
        <ProductImageAuto
          src={getProductImage(product)}
          alt={product.name}
          className="aspect-square w-full h-auto object-cover bg-gray-100"
        />
        
        {product.verified === 1 && (
          <Badge className="absolute top-2 right-2 bg-green-500 text-white">
            موثق
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2 text-right">
          {product.name}
        </CardTitle>
        <CardDescription className="text-right text-sm line-clamp-2">
          {product.description || 'لا يوجد وصف'}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
          <span className="text-sm text-gray-500">
            {product.vendor_name}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold text-blue-600">
            {formatPrice(product.price)}
          </span>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={handleViewDetails}
          >
            <Eye className="w-4 h-4 ml-1" />
            عرض التفاصيل
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="w-4 h-4 ml-1" />
            أضف للسلة
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
