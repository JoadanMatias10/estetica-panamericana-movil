import type {
  PublicBootstrap,
  PublicCarouselSlide,
  PublicCompanyInformation,
  PublicHomeContent,
  PublicHomeHighlights,
  PublicProductsCatalog,
  PublicPromotion,
  PublicServicesCatalog,
} from '../models/public-content';
import type {
  PublicApiIdentifierDto,
  PublicCarouselSlideDto,
  PublicCompanyInformationDto,
  PublicProductCategoryDto,
  PublicProductDto,
  PublicPromotionDto,
  PublicServiceCategoryDto,
  PublicServiceDto,
  PublicServiceGalleryImageDto,
} from '../models/public-api-dtos';
import type { ProductCategory, PublicProduct } from '../models/public-product';
import type { PublicService, ServiceCategory } from '../models/public-service';

const DEFAULT_API_BASE_URL = 'https://proyecto-estetica-3dnx.onrender.com/api';
const REQUEST_TIMEOUT_MS = 30_000;
const CATALOG_CACHE_MS = 2 * 60_000;
const DETAIL_CACHE_MS = 2 * 60_000;
const CONTENT_CACHE_MS = 5 * 60_000;
const HOME_CACHE_MS = 60_000;
const HOME_RETRY_DELAY_MS = 1_000;

export type PublicApiLoadOptions = {
  forceRefresh?: boolean;
};

type UnknownRecord = Record<string, unknown>;
type CacheEntry = { expiresAt: number; value: unknown };

const responseCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

export class PublicApiError extends Error {
  readonly status?: number;
  readonly payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = 'PublicApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function normalizePublicApiBaseUrl(value?: string) {
  const configured = value?.trim() || DEFAULT_API_BASE_URL;
  const withoutTrailingSlash = configured.replace(/\/+$/, '');
  const withoutPublicEndpoint = withoutTrailingSlash.replace(/\/api\/public$/i, '/api');

  if (/\/api$/i.test(withoutPublicEndpoint)) return withoutPublicEndpoint;
  return `${withoutPublicEndpoint}/api`;
}

export const PUBLIC_API_BASE_URL = normalizePublicApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
);

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toSafeDescription(...values: unknown[]) {
  const activeMarkupPattern = /<\s*(?:body|embed|iframe|math|object|script|style|svg)\b|\bon\w+\s*=|javascript\s*:|data\s*:\s*text\/html/i;
  for (const value of values) {
    const text = toStringValue(value);
    if (!text || activeMarkupPattern.test(text)) continue;

    const plainText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (plainText) return plainText;
  }

  return '';
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;

  const parsed = Number(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toNonNegativeNumber(value: unknown, fallback = 0) {
  const number = toNumberValue(value);
  return number === undefined ? fallback : Math.max(0, number);
}

function toOptionalNonNegativeNumber(value: unknown) {
  const number = toNumberValue(value);
  return number === undefined ? undefined : Math.max(0, number);
}

function toBooleanValue(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function identifierOf(record: PublicApiIdentifierDto) {
  return toStringValue(record.id) || toStringValue(record._id);
}

function normalizedKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

function slug(value: string) {
  return normalizedKey(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sin-categoria';
}

function toRemoteImageSource(value: unknown) {
  const uri = toStringValue(value);
  return /^https?:\/\/[^\s]+$/i.test(uri) ? { uri } : undefined;
}

function imageUrlFrom(value: unknown) {
  if (typeof value === 'string') return toStringValue(value);
  if (!isRecord(value)) return '';

  const image = value as PublicServiceGalleryImageDto;
  return toStringValue(image.secure_url)
    || toStringValue(image.secureUrl)
    || toStringValue(image.url)
    || toStringValue(image.image)
    || toStringValue(image.imagen)
    || toStringValue(image.src);
}

function extractImageUrls(primary: unknown, gallery?: unknown) {
  const candidates = [imageUrlFrom(primary), ...toArray(gallery).map(imageUrlFrom)];
  return Array.from(new Set(candidates.filter((url) => /^https?:\/\/[^\s]+$/i.test(url))));
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) return fallback;

  const errors = payload.errors;
  if (Array.isArray(errors)) {
    for (const candidate of errors) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
      if (isRecord(candidate)) {
        const nestedMessage = toStringValue(candidate.message) || toStringValue(candidate.msg);
        if (nestedMessage) return nestedMessage;
      }
    }
  }

  if (typeof errors === 'string' && errors.trim()) return errors.trim();
  return toStringValue(payload.error) || toStringValue(payload.message) || fallback;
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_API_BASE_URL}${normalizedPath}`;
}

async function requestJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new PublicApiError(
        getErrorMessage(payload, 'No fue posible procesar la solicitud.'),
        response.status,
        payload,
      );
    }

    return payload;
  } catch (error) {
    if (error instanceof PublicApiError) throw error;
    if (timedOut) {
      throw new PublicApiError('El servidor tardó demasiado en responder. Inténtalo nuevamente.');
    }
    throw new PublicApiError('No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.');
  } finally {
    clearTimeout(timeout);
  }
}

async function withCache<T>(
  key: string,
  lifetimeMs: number,
  loader: () => Promise<T>,
  options: PublicApiLoadOptions = {},
) {
  const now = Date.now();
  const cached = responseCache.get(key);
  if (!options.forceRefresh && cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const pending = pendingRequests.get(key);
  if (pending) return pending as Promise<T>;

  const request = loader()
    .then((value) => {
      responseCache.set(key, { expiresAt: Date.now() + lifetimeMs, value });
      return value;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}

function mapProductCategories(records: unknown[]) {
  const categories: ProductCategory[] = [{ id: 'all', label: 'Todos' }];
  const byName = new Map<string, ProductCategory>();

  records.forEach((value) => {
    const dto = toRecord(value) as PublicProductCategoryDto;
    const label = toStringValue(dto.nombre);
    const id = identifierOf(dto);
    if (!label || !id || byName.has(normalizedKey(label))) return;

    const category = { id, label };
    categories.push(category);
    byName.set(normalizedKey(label), category);
  });

  return { byName, categories };
}

function ensureProductCategory(
  categoryName: string,
  categories: ProductCategory[],
  byName: Map<string, ProductCategory>,
) {
  const key = normalizedKey(categoryName);
  const existing = byName.get(key);
  if (existing) return existing;

  const category = {
    id: `product-category-${slug(categoryName)}`,
    label: categoryName || 'Sin categoría',
  };
  categories.push(category);
  byName.set(key, category);
  return category;
}

function formatPresentation(dto: PublicProductDto) {
  const amount = toOptionalNonNegativeNumber(dto.cantidadMedida);
  const unit = toStringValue(dto.unidadMedida);
  if (amount === undefined) return '';
  return `${amount} ${unit}`.trim();
}

function mapStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(toStringValue).filter(Boolean);
  }
  const text = toStringValue(value);
  return text ? text.split(/[\n,;|]+/).map((item) => item.trim()).filter(Boolean) : [];
}

function mapProduct(
  value: unknown,
  categories: ProductCategory[],
  categoriesByName: Map<string, ProductCategory>,
): PublicProduct | undefined {
  const dto = toRecord(value) as PublicProductDto;
  const id = identifierOf(dto);
  const name = toStringValue(dto.nombre);
  if (!id || !name) return undefined;

  const categoryName = toStringValue(dto.categoria) || 'Sin categoría';
  const category = ensureProductCategory(categoryName, categories, categoriesByName);
  const imageUrls = extractImageUrls(dto.imagen, dto.imagenes);

  return {
    id,
    name,
    brand: toStringValue(dto.marca) || 'Sin marca',
    categoryId: category.id,
    categoryLabel: category.label,
    presentation: formatPresentation(dto),
    price: toNonNegativeNumber(dto.precio),
    stock: toOptionalNonNegativeNumber(dto.stock),
    rating: toOptionalNonNegativeNumber(dto.rating),
    images: imageUrls.map((uri) => ({ uri })),
    description: toSafeDescription(dto.descripcion, dto.description, dto.detalle),
    features: mapStringList(dto.caracteristicas),
    usage: toStringValue(dto.modoUso),
    featured: toBooleanValue(dto.destacadoInicio),
  };
}

function serviceCategoryKey(segment: string, subcategory: string) {
  return `${normalizedKey(segment)}|${normalizedKey(subcategory)}`;
}

function mapServiceCategories(records: unknown[]) {
  const dtos = records
    .map((value) => toRecord(value) as PublicServiceCategoryDto)
    .filter((dto) => identifierOf(dto) && toStringValue(dto.nombre));
  const labelCounts = new Map<string, number>();

  dtos.forEach((dto) => {
    const key = normalizedKey(toStringValue(dto.nombre));
    labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1);
  });

  const categories: ServiceCategory[] = [{ id: 'all', label: 'Todos' }];
  const bySegmentAndName = new Map<string, ServiceCategory>();

  dtos.forEach((dto) => {
    const id = identifierOf(dto);
    const segment = toStringValue(dto.segmento);
    const subcategory = toStringValue(dto.nombre);
    const key = serviceCategoryKey(segment, subcategory);
    if (!id || bySegmentAndName.has(key)) return;

    const duplicatedLabel = (labelCounts.get(normalizedKey(subcategory)) ?? 0) > 1;
    const category: ServiceCategory = {
      id,
      label: duplicatedLabel && segment ? `${subcategory} · ${segment}` : subcategory,
      segment,
      subcategory,
    };
    categories.push(category);
    bySegmentAndName.set(key, category);
  });

  return { bySegmentAndName, categories };
}

function ensureServiceCategory(
  segment: string,
  subcategory: string,
  categories: ServiceCategory[],
  bySegmentAndName: Map<string, ServiceCategory>,
) {
  const key = serviceCategoryKey(segment, subcategory);
  const existing = bySegmentAndName.get(key);
  if (existing) return existing;

  const category: ServiceCategory = {
    id: `service-category-${slug(`${segment}-${subcategory}`)}`,
    label: subcategory || segment || 'Sin categoría',
    segment,
    subcategory,
  };
  categories.push(category);
  bySegmentAndName.set(key, category);
  return category;
}

function parseDurationMinutes(value: string): number | undefined {
  const normalized = normalizedKey(value);
  const numbers = Array.from(normalized.matchAll(/\d+(?:[.,]\d+)?/g))
    .map((match) => Number(match[0].replace(',', '.')))
    .filter(Number.isFinite);
  if (!numbers.length) return undefined;

  if (/\b(h|hr|hrs|hora|horas)\b/.test(normalized)) {
    const hourMatches = Array.from(normalized.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:h|hr|hrs|hora|horas)\b/g));
    const hours = hourMatches.map((match) => Number(match[1].replace(',', '.'))).filter(Number.isFinite);
    const minuteMatch = normalized.match(/(\d+)\s*(?:m|min|mins|minuto|minutos)\b/);
    if (hours.length) return Math.ceil(Math.max(...hours) * 60 + Number(minuteMatch?.[1] ?? 0));
    return Math.ceil(Math.max(...numbers) * 60);
  }

  return Math.ceil(Math.max(...numbers));
}

function mapService(
  value: unknown,
  categories: ServiceCategory[],
  categoriesByName: Map<string, ServiceCategory>,
): PublicService | undefined {
  const dto = toRecord(value) as PublicServiceDto;
  const id = identifierOf(dto);
  const name = toStringValue(dto.nombre);
  if (!id || !name || normalizedKey(name) === 'servicio de prueba') return undefined;

  const segment = toStringValue(dto.segmento);
  const subcategory = toStringValue(dto.subcategoria);
  const category = ensureServiceCategory(segment, subcategory, categories, categoriesByName);
  const imageUrls = extractImageUrls(dto.imagen, dto.galeriaImagenes);
  const durationLabel = toStringValue(dto.tiempo);

  return {
    id,
    name,
    categoryId: category.id,
    segment,
    subcategory,
    description: toSafeDescription(dto.descripcion, dto.description, dto.detalle, dto.beneficios),
    priceFrom: toNonNegativeNumber(dto.precio),
    durationLabel,
    durationMinutes: parseDurationMinutes(durationLabel),
    image: toRemoteImageSource(imageUrls[0]),
    images: imageUrls.map((uri) => ({ uri })),
    featured: toBooleanValue(dto.destacadoInicio),
  };
}

function mapCompanyInformation(value: unknown): PublicCompanyInformation {
  const dto = toRecord(value) as PublicCompanyInformationDto;
  const latitude = toNumberValue(dto.mapLat);
  const longitude = toNumberValue(dto.mapLng);
  const zoom = toNumberValue(dto.mapZoom);

  return {
    name: toStringValue(dto.nombre) || 'Estética Panamericana',
    address: toStringValue(dto.direccion),
    phone: toStringValue(dto.telefono),
    email: toStringValue(dto.email),
    mission: toStringValue(dto.mision),
    vision: toStringValue(dto.vision),
    values: mapStringList(dto.valores),
    facebookUrl: toStringValue(dto.facebook),
    instagramUrl: toStringValue(dto.instagram),
    aboutText: toStringValue(dto.quienesSomosTexto),
    essence: toStringValue(dto.quienesSomosEsencia),
    mondayToSaturdaySchedule: toStringValue(dto.horarioLunesSabado),
    sundaySchedule: toStringValue(dto.horarioDomingo),
    map: {
      latitude,
      longitude,
      zoom: zoom === undefined ? 15 : Math.min(22, Math.max(1, zoom)),
      googleMapsUrl: toStringValue(dto.mapGoogleUrl),
    },
    privacyDocument: {
      url: toStringValue(dto.politicasDocumento),
      name: toStringValue(dto.politicasDocumentoNombre),
      mimeType: toStringValue(dto.politicasDocumentoTipo),
    },
  };
}

function mapPromotion(value: unknown): PublicPromotion | undefined {
  const dto = toRecord(value) as PublicPromotionDto;
  const id = identifierOf(dto);
  const title = toStringValue(dto.titulo);
  if (!id || !title) return undefined;

  return {
    id,
    title,
    description: toStringValue(dto.descripcion),
    discount: toStringValue(dto.descuento),
    featured: toBooleanValue(dto.destacadoInicio),
  };
}

function mapCarouselSlide(value: unknown): PublicCarouselSlide | undefined {
  const dto = toRecord(value) as PublicCarouselSlideDto;
  const id = identifierOf(dto);
  const imageUrl = toStringValue(dto.image);
  const image = toRemoteImageSource(imageUrl);
  if (!id || !image) return undefined;

  return {
    id,
    image,
    imageUrl,
    order: toNonNegativeNumber(dto.orden),
  };
}

function mapProductsCatalog(productValues: unknown[], categoryValues: unknown[]): PublicProductsCatalog {
  const { byName, categories } = mapProductCategories(categoryValues);
  const products = productValues
    .map((value) => mapProduct(value, categories, byName))
    .filter((product): product is PublicProduct => Boolean(product));
  return { categories, products };
}

function mapServicesCatalog(serviceValues: unknown[], categoryValues: unknown[]): PublicServicesCatalog {
  const { bySegmentAndName, categories } = mapServiceCategories(categoryValues);
  const services = serviceValues
    .map((value) => mapService(value, categories, bySegmentAndName))
    .filter((service): service is PublicService => Boolean(service));
  return { categories, services };
}

export function clearPublicApiCache() {
  responseCache.clear();
}

export function getCompanyInformation(options: PublicApiLoadOptions = {}) {
  return withCache('company-information', CONTENT_CACHE_MS, async () => {
    const payload = toRecord(await requestJson('/public/company-info'));
    return mapCompanyInformation(payload.companyInfo);
  }, options);
}

export function getProductsCatalog(options: PublicApiLoadOptions = {}) {
  return withCache('products-catalog', CATALOG_CACHE_MS, async () => {
    const [productsPayload, categoriesPayload] = await Promise.all([
      requestJson('/public/products'),
      requestJson('/public/product-categories'),
    ]);

    return mapProductsCatalog(
      toArray(toRecord(productsPayload).products),
      toArray(toRecord(categoriesPayload).categories),
    );
  }, options);
}

export function getServicesCatalog(options: PublicApiLoadOptions = {}) {
  return withCache('services-catalog', CATALOG_CACHE_MS, async () => {
    const [servicesPayload, categoriesPayload] = await Promise.all([
      requestJson('/public/services'),
      requestJson('/public/service-categories'),
    ]);

    return mapServicesCatalog(
      toArray(toRecord(servicesPayload).services),
      toArray(toRecord(categoriesPayload).categories),
    );
  }, options);
}

export function getProduct(id: string, options: PublicApiLoadOptions = {}) {
  const normalizedId = id.trim();
  if (!normalizedId) return Promise.resolve(undefined);

  return withCache(`product:${normalizedId}`, DETAIL_CACHE_MS, async () => {
    try {
      const payload = toRecord(await requestJson(`/public/products/${encodeURIComponent(normalizedId)}`));
      const categories: ProductCategory[] = [{ id: 'all', label: 'Todos' }];
      return mapProduct(payload.product, categories, new Map());
    } catch (error) {
      if (error instanceof PublicApiError && error.status === 404) return undefined;
      throw error;
    }
  }, options);
}

export function getService(id: string, options: PublicApiLoadOptions = {}) {
  const normalizedId = id.trim();
  if (!normalizedId) return Promise.resolve(undefined);

  return withCache(`service:${normalizedId}`, DETAIL_CACHE_MS, async () => {
    try {
      const payload = toRecord(await requestJson(`/public/services/${encodeURIComponent(normalizedId)}`));
      const categories: ServiceCategory[] = [{ id: 'all', label: 'Todos' }];
      return mapService(payload.service, categories, new Map());
    } catch (error) {
      if (error instanceof PublicApiError && error.status === 404) return undefined;
      throw error;
    }
  }, options);
}

export function getPromotions(options: PublicApiLoadOptions = {}) {
  return withCache('promotions', HOME_CACHE_MS, async () => {
    const payload = toRecord(await requestJson('/public/promotions'));
    return toArray(payload.promotions)
      .map(mapPromotion)
      .filter((promotion): promotion is PublicPromotion => Boolean(promotion));
  }, options);
}

export function getCarouselSlides(options: PublicApiLoadOptions = {}) {
  return withCache('carousel-slides', CONTENT_CACHE_MS, async () => {
    const payload = toRecord(await requestJson('/public/carousel'));
    return toArray(payload.slides)
      .map(mapCarouselSlide)
      .filter((slide): slide is PublicCarouselSlide => Boolean(slide))
      .sort((left, right) => left.order - right.order);
  }, options);
}

export function getHomeHighlights(options: PublicApiLoadOptions = {}) {
  return withCache<PublicHomeHighlights>('home-highlights', HOME_CACHE_MS, async () => {
    const payload = toRecord(await requestJson('/public/home-highlights'));
    const productsCatalog = mapProductsCatalog(toArray(payload.products), []);
    const servicesCatalog = mapServicesCatalog(toArray(payload.services), []);

    return {
      products: productsCatalog.products,
      services: servicesCatalog.services,
      promotions: toArray(payload.promotions)
        .map(mapPromotion)
        .filter((promotion): promotion is PublicPromotion => Boolean(promotion)),
    };
  }, options);
}

export async function getPublicHomeContent(
  options: PublicApiLoadOptions = {},
): Promise<PublicHomeContent> {
  const load = () => Promise.all([
    getCompanyInformation(options),
    getHomeHighlights(options),
    getCarouselSlides(options),
  ] as const);

  let content: Awaited<ReturnType<typeof load>>;
  try {
    content = await load();
  } catch (error) {
    const retryable = error instanceof PublicApiError
      && (error.status === undefined || [502, 503, 504].includes(error.status));
    if (!retryable) throw error;

    await new Promise((resolve) => setTimeout(resolve, HOME_RETRY_DELAY_MS));
    content = await load();
  }

  const [companyInformation, highlights, carouselSlides] = content;

  return {
    companyInformation,
    carouselSlides,
    ...highlights,
  };
}

export function getPublicBootstrap(options: PublicApiLoadOptions = {}) {
  return withCache<PublicBootstrap>('public-bootstrap', CONTENT_CACHE_MS, async () => {
    const payload = toRecord(await requestJson('/public/bootstrap'));
    const productsCatalog = mapProductsCatalog(
      toArray(payload.products),
      toArray(payload.productCategories),
    );
    const servicesCatalog = mapServicesCatalog(
      toArray(payload.services),
      toArray(payload.serviceCategories),
    );

    return {
      companyInformation: mapCompanyInformation(payload.companyInfo),
      productCategories: productsCatalog.categories,
      products: productsCatalog.products,
      serviceCategories: servicesCatalog.categories,
      services: servicesCatalog.services,
      promotions: toArray(payload.promotions)
        .map(mapPromotion)
        .filter((promotion): promotion is PublicPromotion => Boolean(promotion)),
      carouselSlides: toArray(payload.carouselSlides)
        .map(mapCarouselSlide)
        .filter((slide): slide is PublicCarouselSlide => Boolean(slide))
        .sort((left, right) => left.order - right.order),
    };
  }, options);
}
