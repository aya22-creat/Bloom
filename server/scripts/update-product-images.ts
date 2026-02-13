import 'dotenv/config'

function buildPrompt(name: string, category: string): string {
  const c = (category || '').toLowerCase()
  const isBreastCancer = c.includes('سرطان') || c.includes('ثدي') || c.includes('breast') || c.includes('mastectomy')
  const isProsthesis = c.includes('prosthesis') || c.includes('بديل') || c.includes('prothesis')
  const isPostSurgeryBra = c.includes('post_surgery_bra') || c.includes('bra')

  if (isBreastCancer || isPostSurgeryBra) {
    return 'professional e-commerce product photo, post-mastectomy bra for women, pocketed for breast prosthesis, gentle compression, front closure, soft cotton, breathable fabric, seamless edges, neutral beige color, clean white background, studio lighting, high detail, non-sexualized, medical garment, comfort and support focused | NEGATIVE: no person, no model, no cleavage, no see-through, no logos, no text, no background clutter'
  }
  if (isProsthesis) {
    return 'professional e-commerce product photo, medical silicone breast prosthesis with soft cotton cover, neutral beige, clean white background, studio lighting, high detail, non-sexualized | NEGATIVE: no person, no logos, no text, no background clutter'
  }
  return `professional e-commerce product photo, ${name || 'medical support product'}, clean white background, studio lighting, high detail | NEGATIVE: no person, no model, no logos, no text, no background clutter`
}

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'

  const get = async (path: string) => {
    const res = await fetch(`${base}${path}`)
    const json = await res.json()
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
    return json
  }

  const put = async (path: string, body: any) => {
    const res = await fetch(`${base}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) throw new Error(`PUT ${path} failed: ${JSON.stringify(json)}`)
    return json
  }

  const list = await get('/api/marketplace/products')
  const items = Array.isArray(list?.data) ? list.data : []

  for (const p of items) {
    if (!p.image_url) {
      const prompt = buildPrompt(String(p.name || ''), String(p.category || ''))
      const url = `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`
      await put(`/api/marketplace/products/${p.id}/image`, { image_url: url })
    }
  }

  const updated = await get('/api/marketplace/products')
  console.log(JSON.stringify(updated, null, 2))
}

run().catch((e) => {
  console.error('Update product images failed:', e?.message || e)
  process.exit(1)
})

