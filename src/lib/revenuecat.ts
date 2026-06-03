/**
 * RevenueCat integration for Kjørebok
 *
 * Setup:
 * 1. Opprett konto på revenuecat.com (gratis)
 * 2. Opprett app → iOS → lim inn Bundle ID: no.kjorebok.app
 * 3. Legg inn Apple Shared Secret (fra App Store Connect)
 * 4. Opprett "Offering" med produkt-ID: no.kjorebok.app.monthly
 * 5. Lim inn din Public API key nedenfor
 */

import { Capacitor } from '@capacitor/core'

const REVENUECAT_API_KEY_IOS = 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' // ← bytt ut

let initialized = false

export async function initRevenueCat(userId: string) {
  if (!Capacitor.isNativePlatform()) return
  if (initialized) return

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS, appUserID: userId })
    initialized = true
    console.log('[RevenueCat] initialized for user:', userId)
  } catch (e) {
    console.warn('[RevenueCat] init failed:', e)
  }
}

export async function getOfferings() {
  if (!Capacitor.isNativePlatform()) return null
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { current } = await Purchases.getOfferings()
    return current
  } catch {
    return null
  }
}

export async function purchaseMonthly(): Promise<'success' | 'cancelled' | 'error'> {
  if (!Capacitor.isNativePlatform()) return 'error'
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const offerings = await Purchases.getOfferings()
    const pkg = offerings.current?.monthly
    if (!pkg) return 'error'

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })
    const active = customerInfo.entitlements.active['pro']
    return active ? 'success' : 'error'
  } catch (e: any) {
    if (e?.userCancelled) return 'cancelled'
    return 'error'
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.restorePurchases()
    return !!customerInfo.entitlements.active['pro']
  } catch {
    return false
  }
}

export async function checkSubscriptionStatus(): Promise<'active' | 'inactive'> {
  if (!Capacitor.isNativePlatform()) return 'inactive'
  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const { customerInfo } = await Purchases.getCustomerInfo()
    return customerInfo.entitlements.active['pro'] ? 'active' : 'inactive'
  } catch {
    return 'inactive'
  }
}
