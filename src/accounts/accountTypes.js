import { CircleDollarSign, Landmark, Vault, Wallet } from 'lucide-react'

// Tipo da conta (Q48) → nome e ícone.
export const ACCOUNT_TYPES = {
  wallet: { label: 'Carteira', icon: Wallet },
  checking: { label: 'Conta corrente', icon: Landmark },
  savings: { label: 'Poupança', icon: Vault },
  other: { label: 'Outra', icon: CircleDollarSign },
}
