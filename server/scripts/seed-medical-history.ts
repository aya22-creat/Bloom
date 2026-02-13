import 'dotenv/config'

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'
  const userId = Number(process.env.SEED_USER_ID || 1)

  const medical = {
    diagnoses: 'BI-RADS 2 (حميد) عام 2025',
    surgeries: 'استئصال جزئي للثدي الأيمن عام 2024، تعافٍ جيد',
    medications: 'تاموكسيفين 20mg يومياً، فيتامين D أسبوعياً',
    allergies: 'لا توجد حساسيات معروفة',
    familyHistory: 'خالة مصابة بسرطان الثدي بعد سن 55',
    lifestyle: 'غذاء متوازن، مشي 30 دقيقة يومياً، غير مدخنة',
    notes: 'يوصى بمتابعة دورية: ماموجرام سنوي + سونار عند الحاجة'
  }
  const payload = {
    userId,
    firstName: 'A.S.',
    lastName: 'User',
    gender: 'female',
    country: 'EG',
    medicalHistory: JSON.stringify(medical),
  }

  const res = await fetch(`${base}/api/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  console.log(JSON.stringify(json, null, 2))
}

run().catch((e) => {
  console.error('Seed medical history failed:', e?.message || e)
  process.exit(1)
})
