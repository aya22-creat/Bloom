import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function getAuthToken(): string | null {
  try {
    const sessionRaw = sessionStorage.getItem('hopebloom_auth')
    if (sessionRaw) {
      const s = JSON.parse(sessionRaw)
      if (s?.token) return s.token
    }
  } catch {}
  try {
    const raw = localStorage.getItem('hopebloom_auth')
    if (raw) {
      const a = JSON.parse(raw)
      if (a?.token) return a.token
    }
  } catch {}
  return null
}

export class StripeService {
  static async createCheckoutSession(orderId: string, courseId: string, amount: number, courseTitle: string, courseImage?: string) {
    try {
      const stripe = await stripePromise
      
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // Create checkout session on the server
      const token = getAuthToken()
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId,
          courseId,
          amount,
          courseTitle,
          courseImage,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await response.json()

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (error) {
        throw new Error(error.message)
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw error
    }
  }
}
