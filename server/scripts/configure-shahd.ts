import 'dotenv/config'

async function run() {
  const base = process.env.TEST_BASE_URL || 'http://localhost:4000'

  const usersRes = await fetch(`${base}/api/users`)
  const users = await usersRes.json()
  let shahd = Array.isArray(users) ? users.find((u: any) => String(u.username || '').toLowerCase() === 'shahd') : null

  if (!shahd) {
    const regRes = await fetch(`${base}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'shahd',
        email: 'shahd@example.com',
        password: '12345678',
        userType: 'fighter',
        language: 'ar',
        phone: '+201234567890'
      })
    })
    const reg = await regRes.json()
    shahd = reg
  }

  const medical = {
    diagnoses: 'تشخيص سابق: BI-RADS 2 حميد، متابعة سنوية',
    surgeries: 'استئصال جزئي 2024 مع تعافي جيد',
    medications: 'تاموكسيفين 20mg يومياً، مسكنات خفيفة عند الحاجة',
    allergies: 'لا توجد حساسيات معروفة',
    familyHistory: 'خالة مصابة بسرطان الثدي بعد سن 55',
    lifestyle: 'غذاء متوازن، مشي 30 دقيقة يومياً، غير مدخنة',
    notes: 'توصية بعمل ماموجرام سنوي مع سونار عند الحاجة'
  }

  const profRes = await fetch(`${base}/api/profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: Number(shahd.id),
      firstName: 'Shahd',
      lastName: 'User',
      gender: 'female',
      country: 'EG',
      medicalHistory: JSON.stringify(medical)
    })
  })
  const prof = await profRes.json()
  console.log(JSON.stringify({ user: shahd, profile: prof }, null, 2))
}

run().catch((e) => {
  console.error('Configure Shahd failed:', e?.message || e)
  process.exit(1)
})

