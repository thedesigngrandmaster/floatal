import { store } from './store'
import { getSupabase, supabaseEnabled } from './supabase'
import { phoneDigits, phoneMatches } from './format'
import { DEMO_OTP } from './seed'
import { remoteOperatorSignIn, remoteRequestOtp, remoteVerifyOtp } from './remote'

export { DEMO_OTP }

export function findAgentByPhone(phone: string) {
  return (
    store
      .getSnapshot()
      .data.agents.find((agent) => phoneMatches(agent.phone, phone)) ?? null
  )
}

export async function requestAgentOtp(phone: string): Promise<{ ok: boolean; error?: string }> {
  if (phoneDigits(phone).length < 7) {
    return { ok: false, error: 'Enter a valid mobile number' }
  }
  if (supabaseEnabled) {
    return remoteRequestOtp(phone)
  }
  const agent = findAgentByPhone(phone)
  if (!agent) {
    return { ok: false, error: 'No Floatal agent is registered with this number' }
  }
  await new Promise((resolve) => window.setTimeout(resolve, 650))
  return { ok: true }
}

export async function verifyAgentOtp(
  phone: string,
  token: string,
): Promise<{ ok: boolean; error?: string; agentId?: string }> {
  if (token.replace(/\D/g, '').length !== 6) {
    return { ok: false, error: 'Enter the 6-digit code' }
  }
  if (supabaseEnabled) {
    const result = await remoteVerifyOtp(phone, token)
    return result
  }
  await new Promise((resolve) => window.setTimeout(resolve, 700))
  if (token !== DEMO_OTP) {
    return { ok: false, error: 'That code is not correct. Try 246810.' }
  }
  const agent = findAgentByPhone(phone)
  if (!agent) return { ok: false, error: 'No agent is linked to this number' }
  return { ok: true, agentId: agent.id }
}

export async function signInOperator(email: string, password: string) {
  if (!supabaseEnabled) {
    const operator = store.getSnapshot().data.operator
    return { ok: true as const, operatorId: operator.id }
  }
  return remoteOperatorSignIn(email, password)
}

export async function signOutRemote() {
  if (!supabaseEnabled) return
  const supabase = await getSupabase()
  await supabase?.auth.signOut()
}

