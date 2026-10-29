import {
  Briefcase,
  Car,
  GraduationCap,
  Gift,
  HeartPulse,
  House,
  Laptop,
  PawPrint,
  Plane,
  Popcorn,
  Shapes,
  Shirt,
  ShoppingCart,
  Tag,
  TrendingUp,
  Tv,
  UtensilsCrossed,
} from 'lucide-react'
import { iconKeyFor } from './categoryLook'

const ICONS = {
  cart: ShoppingCart,
  food: UtensilsCrossed,
  home: House,
  car: Car,
  health: HeartPulse,
  education: GraduationCap,
  fun: Popcorn,
  travel: Plane,
  subscription: Tv,
  pet: PawPrint,
  clothes: Shirt,
  gift: Gift,
  salary: Briefcase,
  freelance: Laptop,
  invest: TrendingUp,
  other: Shapes,
  tag: Tag,
}

export const categoryIcon = (name) => (name ? ICONS[iconKeyFor(name)] : Tag)
