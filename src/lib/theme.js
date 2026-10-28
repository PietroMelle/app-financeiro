// Preferência de tema por aparelho: 'dark' (padrão), 'light' ou 'system'.
// O index.html aplica o mesmo cálculo antes do primeiro desenho para não piscar.
const KEY = 'mea-theme'
const query = () => window.matchMedia('(prefers-color-scheme: dark)')

export function getThemePreference() {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'system' ? value : 'dark'
  } catch {
    return 'dark'
  }
}

function resolve(preference) {
  if (preference === 'system') return query().matches ? 'dark' : 'light'
  return preference
}

export function applyTheme(preference = getThemePreference()) {
  document.documentElement.dataset.theme = resolve(preference)
}

export function setThemePreference(preference) {
  try {
    localStorage.setItem(KEY, preference)
  } catch {
    // Sem armazenamento (aba privada): vale só nesta sessão.
  }
  applyTheme(preference)
}

// Acompanha a troca de tema do sistema quando a preferência é 'system'.
export function watchSystemTheme() {
  const media = query()
  const onChange = () => getThemePreference() === 'system' && applyTheme('system')
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}
