import { CircleDollarSign, CreditCard, Landmark, Vault, Wallet } from 'lucide-react'

// Tipo da conta (Q48, Q56) → nome e ícone.
export const ACCOUNT_TYPES = {
  wallet: { label: 'Carteira', icon: Wallet },
  checking: { label: 'Conta corrente', icon: Landmark },
  savings: { label: 'Poupança', icon: Vault },
  credit: { label: 'Cartão de crédito', icon: CreditCard },
  other: { label: 'Outra', icon: CircleDollarSign },
}
