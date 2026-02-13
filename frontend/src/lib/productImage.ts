import { Product } from '../services/product.service'

const baseUrl = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image'

function buildPrompt(product: Product): string {
  const category = (product.category || '').toLowerCase()
  const name = (product.name || '').trim()

  const isBreastCancer =
    category.includes('سرطان') ||
    category.includes('ثدي') ||
    category.includes('استئصال') ||
    category.includes('breast') ||
    category.includes('mastectomy')

  if (isBreastCancer) {
    return (
      'professional e-commerce product photo, post-mastectomy bra for women, pocketed for breast prosthesis, gentle compression, front closure, soft cotton, breathable fabric, seamless edges, neutral beige color, clean white background, studio lighting, high detail, non-sexualized, medical garment, comfort and support focused | NEGATIVE: no person, no model, no cleavage, no see-through, no logos, no text, no background clutter'
    )
  }

  const generic = `professional e-commerce product photo, ${name || 'medical support product'}, clean white background, studio lighting, high detail | NEGATIVE: no person, no model, no logos, no text, no background clutter`
  return generic
}

export function getProductImage(product: Product): string {
  if (product.image_url) return product.image_url
  const prompt = buildPrompt(product)
  const url = `${baseUrl}?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`
  return url
}

