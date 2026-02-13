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
    name: 'متجر بلوم',
    contact_email: 'bloom.vendor@example.com',
    contact_phone: '+201000000000',
  })

  const vendorId = vendor?.id || vendor?.data?.id || vendor?.vendor?.id

  const products = [
    {
      name: 'حمالة صدر بعد الاستئصال',
      description: 'حمالة صدر طبية بجيوب لتركيب بديل الثدي، قطن ناعم وإغلاق أمامي.',
      category: 'سرطان الثدي',
      price: 450,
      currency: 'EGP',
      image_url: null,
    },
    {
      name: 'بديل ثدي سيليكون طبي',
      description: 'بديل ثدي سيليكون مريح ومتوازن بعد الجراحة، يأتي مع غطاء قطني.',
      category: 'breast_prosthesis',
      price: 1200,
      currency: 'EGP',
      image_url: null,
    },
    {
      name: 'حمالة صدر طبية أمامية الإغلاق',
      description: 'مناسبة لفترة ما بعد الجراحة، ضغط لطيف وأكتاف عريضة لراحة أكبر.',
      category: 'post_surgery_bra',
      price: 390,
      currency: 'EGP',
      image_url:
        'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20e-commerce%20product%20photo%2C%20post-surgery%20medical%20bra%2C%20front%20closure%2C%20gentle%20compression%2C%20soft%20cotton%2C%20neutral%20beige%20%7C%20NEGATIVE%3A%20no%20person%2C%20no%20cleavage%2C%20no%20logos%2C%20no%20text&image_size=square_hd',
    },
    {
      name: 'حزام دعم طبي عام',
      description: 'حزام دعم مرن للاستخدام العام، خفيف ومريح للارتداء اليومي.',
      category: 'general',
      price: 250,
      currency: 'EGP',
      image_url: null,
    },
  ]

  for (const p of products) {
    await post('/api/marketplace/products', {
      vendor_id: vendorId,
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      currency: p.currency,
      image_url: p.image_url,
    })
  }

  const list = await get('/api/marketplace/products')
  console.log(JSON.stringify(list, null, 2))
}

run().catch((e) => {
  console.error('Marketplace seed failed:', e?.message || e)
  process.exit(1)
})

