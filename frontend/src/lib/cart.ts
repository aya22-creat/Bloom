import type { Product } from '@/services/product.service'

const KEY = 'hb_cart'

type CartItem = {
  id: number
  name: string
  price: number
  qty: number
  image_url?: string
}

const read = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const write = (items: CartItem[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items))
  } catch {}
}

export const cart = {
  get(): CartItem[] {
    return read()
  },
  add(p: Product, qty = 1) {
    const items = read()
    const existing = items.find((i) => i.id === p.id)
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, 99)
      write(items)
      return existing
    }
    const item: CartItem = {
      id: p.id,
      name: p.name,
      price: Number(p.price || 0),
      qty,
      image_url: p.image_url,
    }
    items.push(item)
    write(items)
    return item
  },
  remove(productId: number) {
    const items = read().filter((i) => i.id !== productId)
    write(items)
  },
  clear() {
    write([])
  },
  count(): number {
    return read().reduce((sum, i) => sum + i.qty, 0)
  },
}

