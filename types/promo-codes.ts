export type PromoPlanType = 'lifetime' | 'early_access' | 'monthly' | 'annual'

export interface PromoCode {
  id: string
  code: string
  is_used: boolean
  used_by?: string | null
  used_at?: string | null
  created_by?: string | null
  plan_type: PromoPlanType
  duration_days?: number | null
  description?: string | null
  expires_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface RedeemPromoResponse {
  success: boolean
  message?: string
  error?: string
  plan_type?: PromoPlanType
  premium_until?: string | null
}
