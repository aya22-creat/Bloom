import 'dotenv/config'

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'

  const post = async (path: string, body: any) => {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok || json?.success === false) throw new Error(`POST ${path} failed: ${JSON.stringify(json)}`)
    return json
  }

  const get = async (path: string) => {
    const res = await fetch(`${base}${path}`)
    const json = await res.json()
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
    return json
  }

  const vendor = await post('/api/marketplace/vendors', {
    name: 'متجر الاختبار',
    contact_email: 'vendor@example.com',
  })

  const vendorId = vendor?.id || vendor?.data?.id || vendor?.vendor?.id

  await post('/api/marketplace/products', {
    vendor_id: vendorId,
    name: 'منتج الاختبار',
    description: 'وصف بسيط',
    category: 'general',
    price: 350,
    currency: 'EGP',
    image_url: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20e-commerce%20product%20photo%2C%20modest%20medical%20apparel%20%E2%80%94%20soft%20cotton%20wireless%20bra%20for%20women%2C%20full%20coverage%20cups%2C%20wide%20straps%2C%20breathable%20fabric%2C%20seamless%20edges%2C%20front%20closure%2C%20tagless%20design%2C%20neutral%20beige%20color%2C%20clean%20white%20background%2C%20studio%20lighting%2C%20high%20detail%2C%20non-sexualized%2C%20educational%2C%20comfort%20and%20support%20focused%2C%2050mm%20lens%2C%20diffuse%20light%20%7C%20NEGATIVE%3A%20no%20person%2C%20no%20model%2C%20no%20cleavage%2C%20no%20see-through%2C%20no%20logos%2C%20no%20text%2C%20no%20background%20clutter&image_size=square_hd',
  })

  const list = await get('/api/marketplace/products')
  console.log(JSON.stringify(list, null, 2))
}

run().catch((e) => {
  console.error('Marketplace test failed:', e?.message || e)
  process.exit(1)
})
