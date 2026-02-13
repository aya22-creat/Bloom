import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { productService, Product } from '@/services/product.service'
import { cart } from '@/lib/cart'
import { getProductImage } from '@/lib/productImage'
import ProductImageAuto from '@/components/ProductImageAuto'
import { RefreshCw, ShoppingCart, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await productService.getProductById(Number(id))
        setProduct(res.data)
      } catch (e: any) {
        setError('تعذر تحميل تفاصيل المنتج')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const formatPrice = (price: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(price)

  const addToCart = () => {
    if (!product) return
    cart.add(product, 1)
    toast({ title: 'تمت الإضافة للسلة', description: product.name })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">جاري تحميل المنتج...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'المنتج غير موجود'}</p>
          <Button variant="outline" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            رجوع للسوق
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen gradient-blush">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/marketplace')} className="mb-4">
          {i18n.dir() === 'rtl' ? <ArrowLeft className="w-4 h-4 ml-1" /> : <ArrowLeft className="w-4 h-4 mr-1" />}
          رجوع
        </Button>
        <Card className="p-6 bg-white shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProductImageAuto
              src={getProductImage(product)}
              alt={product.name}
              className="w-full h-auto object-cover rounded"
            />
            <div>
              <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground mb-4">{product.description || 'لا يوجد وصف'}</p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-bold text-blue-600">{formatPrice(product.price)}</span>
                <span className="text-sm text-gray-500">{product.vendor_name}</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={addToCart} className="gradient-rose text-white">
                  <ShoppingCart className="w-4 h-4 ml-1" />
                  أضف للسلة
                </Button>
                <Button variant="outline" onClick={() => navigate('/marketplace')}>رجوع للسوق</Button>
              </div>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}
