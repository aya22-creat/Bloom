import 'dotenv/config'

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'

  const form = new FormData()
  const sampleText = `Patient: A.S.\nDate: 2026-02-10\nStudy: Breast ultrasound (right).\nFindings: No discrete mass. Mild ductal ectasia. No suspicious calcifications.\nImpression: BI-RADS 2 (benign). Recommend routine follow-up in 12 months.`
  const blob = new Blob([sampleText], { type: 'text/plain' })
  form.append('file', blob, 'report.txt')
  form.append('user_id', '1')

  const res = await fetch(`${base}/api/report-analysis/upload`, {
    method: 'POST',
    body: form,
  })
  const json = await res.json()
  console.log(JSON.stringify(json, null, 2))
}

run().catch((e) => {
  console.error('Report analysis test failed:', e?.message || e)
  process.exit(1)
})

