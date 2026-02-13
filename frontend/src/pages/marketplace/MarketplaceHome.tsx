import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { ProductCard } from '../../components/ProductCard';
import { SearchAndFilter } from '../../components/SearchAndFilter';
import { productService, Product, ProductFilters } from '../../services/product.service';
import { cart } from '@/lib/cart';
import { useToast } from '@/hooks/use-toast';

export const MarketplaceHome: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({});

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [filters]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts(filters);
      setProducts(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError('فشل في تحميل المنتجات');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await productService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
      // استخدام فئات افتراضية إذا فشل التحميل
      setCategories(['إلكترونيات', 'أزياء', 'إكسسوارات', 'منزلية', 'رياضية']);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category: category || undefined, page: 1 }));
  };

  const handleVerifiedChange = (verified: boolean) => {
    setFilters(prev => ({ ...prev, verified: verified || undefined, page: 1 }));
  };

  const handleAddToCart = (product: Product) => {
    cart.add(product, 1);
    toast({ title: 'تمت الإضافة للسلة', description: product.name });
  };

  const handleRetry = () => {
    loadProducts();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل المنتجات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">حدث خطأ</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRetry} variant="outline">
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* عنوان الصفحة */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <ShoppingBag className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800">سوق بلوم</h1>
        </div>
        <p className="text-gray-600 text-lg">
          اكتشف أفضل المنتجات المعتمدة والموثوقة
        </p>
      </div>

      {/* شريط البحث والتصفية */}
      <div className="mb-8">
        <SearchAndFilter
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          onVerifiedChange={handleVerifiedChange}
          categories={categories}
          currentSearch={filters.search || ''}
          currentCategory={filters.category || ''}
          currentVerified={filters.verified || false}
        />
      </div>

      {/* عدد النتائج */}
      <div className="mb-6">
        <p className="text-gray-600">
          تم العثور على {(products?.length ?? 0)} منتج
        </p>
      </div>

      {/* شبكة المنتجات */}
      {(products?.length ?? 0) === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            لا توجد منتجات
          </h3>
          <p className="text-gray-500">
            حاول تغيير معايير البحث أو التصفية
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(products || []).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketplaceHome;
