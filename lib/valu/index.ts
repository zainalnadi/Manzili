// ValU BNPL integration — uses realistic mock when no credentials

export interface ValUPlan {
  months: number
  monthlyPayment: number
  totalAmount: number
  interestRate: number
  popular?: boolean
}

export interface ValUInitResult {
  planId: string
  plans: ValUPlan[]
  mock: boolean
}

export function getValUPlans(totalAmount: number): ValUPlan[] {
  // Mock: 0% interest for simplicity (real ValU has interest)
  return [
    {
      months: 3,
      monthlyPayment: Math.round((totalAmount / 3) * 100) / 100,
      totalAmount,
      interestRate: 0,
    },
    {
      months: 6,
      monthlyPayment: Math.round((totalAmount / 6) * 100) / 100,
      totalAmount,
      interestRate: 0,
      popular: true,
    },
    {
      months: 12,
      monthlyPayment: Math.round((totalAmount / 12) * 100) / 100,
      totalAmount,
      interestRate: 0,
    },
  ]
}

export async function initiateValUPayment(
  amount: number,
  _selectedMonths: number,
  _customerPhone: string
): Promise<ValUInitResult> {
  const plans = getValUPlans(amount)

  if (!process.env.VALU_MERCHANT_ID || !process.env.VALU_API_KEY) {
    // Mock mode
    return {
      planId: `VALU-MOCK-${Date.now()}`,
      plans,
      mock: true,
    }
  }

  // Real ValU integration would go here
  try {
    const res = await fetch(`${process.env.VALU_API_URL}/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Merchant-Id': process.env.VALU_MERCHANT_ID,
        'X-Api-Key': process.env.VALU_API_KEY,
      },
      body: JSON.stringify({
        amount,
        tenure: _selectedMonths,
        phone: _customerPhone,
      }),
    })
    const data = await res.json()
    return {
      planId: data.plan_id,
      plans,
      mock: false,
    }
  } catch {
    throw new Error('ValU payment initiation failed')
  }
}
