import { Router } from 'express'
import { StripeService } from '../services/stripe.service'
import { authMiddleware } from '../middleware/auth.middleware'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Create checkout session
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { orderId, courseId, amount, courseTitle, courseImage } = req.body
    const userId = req.user.id

    if (!orderId || !courseId || !amount || !courseTitle) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderId, courseId, amount, courseTitle' 
      })
    }

    const sessionId = await StripeService.createCheckoutSession(
      orderId,
      courseId,
      amount,
      courseTitle,
      courseImage,
      userId
    )

    res.json({ sessionId })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Stripe webhook endpoint
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'] as string
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return res.status(500).json({ error: 'Webhook secret not configured' })
  }

  try {
    const event = await StripeService.constructWebhookEvent(
      req.body,
      signature,
      webhookSecret
    )

    console.log(`Received webhook event: ${event.type}`)

    // Handle the event
    await StripeService.handleWebhook(event)

    res.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(400).json({ 
      error: 'Webhook error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
