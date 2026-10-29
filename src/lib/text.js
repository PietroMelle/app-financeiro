// Minúsculas e sem acento: "Saúde" e "saude" viram a mesma chave.
export const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
