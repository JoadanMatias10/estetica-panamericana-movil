export type PublicApiIdentifierDto = {
  id?: unknown;
  _id?: unknown;
};

export type PublicProductDto = PublicApiIdentifierDto & {
  nombre?: unknown;
  marca?: unknown;
  precio?: unknown;
  stock?: unknown;
  cantidadMedida?: unknown;
  unidadMedida?: unknown;
  categoria?: unknown;
  descripcion?: unknown;
  description?: unknown;
  detalle?: unknown;
  imagen?: unknown;
  imagenes?: unknown;
  rating?: unknown;
  caracteristicas?: unknown;
  modoUso?: unknown;
  destacadoInicio?: unknown;
};

export type PublicProductCategoryDto = PublicApiIdentifierDto & {
  nombre?: unknown;
  descripcion?: unknown;
  estado?: unknown;
};

export type PublicServiceGalleryImageDto = {
  url?: unknown;
  image?: unknown;
  imagen?: unknown;
  secure_url?: unknown;
  secureUrl?: unknown;
  src?: unknown;
};

export type PublicServiceDto = PublicApiIdentifierDto & {
  nombre?: unknown;
  segmento?: unknown;
  subcategoria?: unknown;
  precio?: unknown;
  tiempo?: unknown;
  descripcion?: unknown;
  description?: unknown;
  detalle?: unknown;
  beneficios?: unknown;
  imagen?: unknown;
  galeriaImagenes?: unknown;
  destacadoInicio?: unknown;
};

export type PublicServiceCategoryDto = PublicApiIdentifierDto & {
  nombre?: unknown;
  segmento?: unknown;
  descripcion?: unknown;
  estado?: unknown;
};

export type PublicCompanyInformationDto = {
  nombre?: unknown;
  direccion?: unknown;
  telefono?: unknown;
  email?: unknown;
  mision?: unknown;
  vision?: unknown;
  valores?: unknown;
  facebook?: unknown;
  instagram?: unknown;
  quienesSomosTexto?: unknown;
  quienesSomosEsencia?: unknown;
  horarioLunesSabado?: unknown;
  horarioDomingo?: unknown;
  mapLat?: unknown;
  mapLng?: unknown;
  mapZoom?: unknown;
  mapGoogleUrl?: unknown;
  politicasDocumento?: unknown;
  politicasDocumentoNombre?: unknown;
  politicasDocumentoTipo?: unknown;
};

export type PublicPromotionDto = PublicApiIdentifierDto & {
  titulo?: unknown;
  descripcion?: unknown;
  descuento?: unknown;
  destacadoInicio?: unknown;
};

export type PublicCarouselSlideDto = PublicApiIdentifierDto & {
  image?: unknown;
  orden?: unknown;
};
