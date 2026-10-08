import type { PublicService } from '../models/public-service';

// Visual examples only. Replace with the public catalog supplied by the existing server.
export const previewServices: readonly PublicService[] = [
  {
    id: 'preview-hair', name: 'Corte y Peinado', categoryId: 'hair',
    description: 'Corte y acabado para renovar tu estilo. El precio final depende del largo y del servicio solicitado.',
    priceFrom: 350, durationMinutes: 45,
    image: require('../../../../assets/images/services/hair-preview.jpg'),
  },
  {
    id: 'preview-face', name: 'Limpieza Facial Profunda', categoryId: 'face',
    description: 'Limpieza y cuidado facial. El tratamiento se adapta a las necesidades de la piel.',
    priceFrom: 580, durationMinutes: 60,
    image: require('../../../../assets/images/services/facial-preview.jpg'),
  },
  {
    id: 'preview-nails', name: 'Manicure Gel', categoryId: 'nails',
    description: 'Cuidado de manos y acabado con esmalte en gel. Los diseños adicionales pueden modificar el precio.',
    priceFrom: 420, durationMinutes: 50,
    image: require('../../../../assets/images/services/nails-preview.jpg'),
  },
];
