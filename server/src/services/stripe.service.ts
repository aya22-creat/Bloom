import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('Stripe is not configured (missing STRIPE_SECRET_KEY)')
  }
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' })
}

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase is not configured for payments')
  }
  return createClient(url, serviceKey)
}

export class StripeService {
  static async createCheckoutSession(
    orderId: string | undefined,
    courseId: string,
    amount: number,
    courseTitle: string,
    courseImage?: string,
    userId?: string
  ): Promise<string> {
    try {
      const supabase = getSupabase()
      let ensuredOrderId = orderId
      if (!ensuredOrderId) {
        if (!userId) throw new Error('Missing userId to create order')
        const { data, error } = await supabase
          .from('orders')
          .insert({ user_id: userId, course_id: courseId, amount, status: 'pending' })
          .select()
          .single()
        if (error) throw new Error(`Failed to create order: ${error.message}`)
        ensuredOrderId = data.id
      }
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'egp',
              product_data: {
                name: courseTitle,
                images: courseImage ? [courseImage] : undefined,
              },
              unit_amount: Math.round(amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.COURSE_BASE_URL || 'http://localhost:8081'}/#/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.COURSE_BASE_URL || 'http://localhost:8081'}/#/courses/${courseId}`,
        metadata: {
          orderId: ensuredOrderId!,
          courseId,
          userId: userId || '',
        },
      })

      return session.id
    } catch (error) {
      console.error('Error creating checkout session:', error)
      throw new Error('Failed to create checkout session')
    }
  }

  static async handleWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session
        await this.handleSuccessfulPayment(session)
        break
      
      case 'payment_intent.succeeded':
        // Handle additional payment success events if needed
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  private static async handleSuccessfulPayment(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const { orderId, courseId, userId } = session.metadata || {}

      if (!orderId || !courseId || !userId) {
        throw new Error('Missing metadata in session')
      }

      // Update order status
      const supabase = getSupabase()
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) {
        throw new Error(`Failed to update order: ${orderError.message}`)
      }

      // Create enrollment
      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
          completed_lessons: []
        })

      if (enrollmentError) {
        // Check if enrollment already exists (unique constraint)
        if (enrollmentError.code === '23505') {
          console.log('Enrollment already exists for this user and course')
        } else {
          throw new Error(`Failed to create enrollment: ${enrollmentError.message}`)
        }
      }

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          stripe_payment_id: session.payment_intent as string,
          amount: session.amount_total! / 100, // Convert from cents
          currency: session.currency || 'egp',
          status: 'succeeded',
          stripe_data: session
        })

      if (paymentError) {
        throw new Error(`Failed to create payment record: ${paymentError.message}`)
      }

      console.log('Payment processed successfully for order:', orderId)
    } catch (error) {
      console.error('Error processing successful payment:', error)
      throw error
    }
  }

  static async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<Stripe.Event> {
    const stripe = getStripe()
    return stripe.webhooks.constructEvent(payload, signature, secret)
  }
}
