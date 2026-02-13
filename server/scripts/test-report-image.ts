import 'dotenv/config'

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'

  // Fetch a sample medical garment image (non-diagnostic) to simulate upload
  const imgUrl = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=' +
    encodeURIComponent('medical product photo, post-mastectomy bra, pocketed for prosthesis, neutral background | NEGATIVE: no person, no logos, no text') +
    '&image_size=square_hd'

  const imgRes = await fetch(imgUrl)
  const imgBuf = await imgRes.arrayBuffer()
  const imgBlob = new Blob([imgBuf], { type: 'image/png' })

  const form = new FormData()
  form.append('file', imgBlob, 'medical_image.png')
  form.append('user_id', '1')

  const res = await fetch(`${base}/api/report-analysis/upload`, {
    method: 'POST',
    body: form,
  })
  const json = await res.json()
  console.log(JSON.stringify(json, null, 2))
}

run().catch((e) => {
  console.error('Image analysis test failed:', e?.message || e)
  process.exit(1)
})

