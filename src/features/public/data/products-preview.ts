import type { PublicProduct } from '../models/public-product';

// Mock catalog from the visual reference. These are not official prices or inventory.
// Photos are illustrative AVYNA references; replace with each actual SKU's approved photos.
export const previewProducts: readonly PublicProduct[] = [
  {
    id: 'shampoo-reparador', brand: 'AVYNA', name: 'Shampoo Reparador',
    categoryId: 'shampoo', categoryLabel: 'Cabello', presentation: '500 ml', price: 289, stock: 24,
    images: [require('../../../../assets/images/products/shampoo-preview.jpg')],
    description: 'Shampoo de cuidado capilar para acompañar tu rutina de limpieza. La fórmula y sus beneficios deben confirmarse con la etiqueta del producto real.',
    features: ['Presentación de 500 ml', 'Cuidado capilar', 'Uso externo', 'Consultar ingredientes en la etiqueta'],
    usage: 'Consulta el modo de uso de la etiqueta y las recomendaciones de tu estilista. Las instrucciones oficiales están pendientes de confirmar.',
  },
  {
    id: 'acondicionador-nutri', brand: 'AVYNA', name: 'Acondicionador Nutri',
    categoryId: 'treatment', categoryLabel: 'Cabello', presentation: '500 ml', price: 310, stock: 12,
    images: [require('../../../../assets/images/products/conditioner-preview.jpg')],
    description: 'Acondicionador de referencia para complementar el cuidado del cabello. Información del producto pendiente de confirmar.',
    features: ['Presentación de 500 ml', 'Cuidado capilar', 'Uso externo'],
    usage: 'Sigue las instrucciones de la etiqueta del producto real. Modo de uso pendiente de confirmar.',
  },
  {
    id: 'serum-capilar', brand: 'AVYNA', name: 'Sérum Capilar',
    categoryId: 'serum', categoryLabel: 'Cabello', presentation: '30 ml', price: 345, stock: 8,
    images: [require('../../../../assets/images/products/serum-preview.jpg')],
    description: 'Sérum de referencia para la rutina de cuidado capilar. Fórmula y beneficios pendientes de confirmar.',
    features: ['Presentación de 30 ml', 'Cuidado capilar', 'Uso externo'],
    usage: 'Consulta la cantidad y forma de aplicación en la etiqueta del producto real.',
  },
  {
    id: 'mascarilla-intensiva', brand: 'AVYNA', name: 'Mascarilla Intensiva',
    categoryId: 'treatment', categoryLabel: 'Cabello', presentation: '250 ml', price: 420, stock: 0,
    images: [require('../../../../assets/images/products/mask-preview.jpg')],
    description: 'Tratamiento capilar de referencia. Sus características y disponibilidad real están pendientes de confirmar.',
    features: ['Presentación de 250 ml', 'Tratamiento capilar', 'Uso externo'],
    usage: 'Verifica el tiempo de aplicación y el modo de enjuague en la etiqueta del producto real.',
  },
];
