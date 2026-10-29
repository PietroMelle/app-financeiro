// Foto de recibo (Q69c): reduz para no máximo 1568 px no lado maior (o que a IA aproveita)
// e vira JPEG. Fica leve para enviar e para guardar no histórico da conversa.
const MAX_SIDE = 1568

export async function resizeImage(file) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return { mediaType: 'image/jpeg', data: dataUrl.split(',')[1], preview: dataUrl }
}
