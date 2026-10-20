/// <reference types="jest" />
import {
  clearPublicApiCache,
  getCarouselSlides,
  getCompanyInformation,
  getProduct,
  getProductsCatalog,
  getPublicBootstrap,
  getPublicHomeContent,
  getPromotions,
  getService,
  getServicesCatalog,
  normalizePublicApiBaseUrl,
  PublicApiError,
} from '../src/features/public/services/public-api-service';

const originalFetch = globalThis.fetch;
const fetchMock = jest.fn<Promise<Response>, [input: RequestInfo | URL, init?: RequestInit]>();

function respond(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

function mockRoutes(routes: Record<string, unknown>) {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    const path = new URL(url).pathname;
    if (!(path in routes)) throw new Error(`Ruta inesperada: ${path}`);
    return respond(routes[path]);
  });
}

beforeAll(() => {
  globalThis.fetch = fetchMock;
});

beforeEach(() => {
  clearPublicApiCache();
  fetchMock.mockReset();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

afterEach(() => jest.useRealTimers());

describe('API pública', () => {
  it('normaliza la base sin duplicar /api ni el endpoint público', () => {
    expect(normalizePublicApiBaseUrl(' https://example.invalid/ ')).toBe('https://example.invalid/api');
    expect(normalizePublicApiBaseUrl('https://example.invalid/api/')).toBe('https://example.invalid/api');
    expect(normalizePublicApiBaseUrl('https://example.invalid/api/public')).toBe('https://example.invalid/api');
  });

  it('mapea productos y categorías, filtra registros inválidos y evita URLs de imagen inseguras', async () => {
    mockRoutes({
      '/api/public/products': { products: [
        { _id: 'p1', nombre: ' Champú ', categoria: 'Cabello', precio: '120,50', stock: 3,
          marca: 'Marca', cantidadMedida: '250', unidadMedida: 'ml',
          imagen: 'https://example.invalid/p1.png', imagenes: ['https://example.invalid/p1.png', 'javascript:alert(1)'],
          descripcion: '<b>Suave</b>', caracteristicas: 'Brillo, Suavidad', destacadoInicio: true },
        { nombre: 'Sin identificador' },
      ] },
      '/api/public/product-categories': { categories: [
        { id: 'c1', nombre: 'Cabello' },
        { id: 'c2', nombre: 'cabello' },
      ] },
    });

    const catalog = await getProductsCatalog();
    expect(catalog.categories).toEqual([{ id: 'all', label: 'Todos' }, { id: 'c1', label: 'Cabello' }]);
    expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0]).toMatchObject({
      id: 'p1', name: 'Champú', categoryId: 'c1', price: 120.5,
      stock: 3, presentation: '250 ml', description: 'Suave',
      features: ['Brillo', 'Suavidad'], featured: true,
    });
    expect(catalog.products[0].images).toEqual([{ uri: 'https://example.invalid/p1.png' }]);
  });

  it('mapea servicios y duración; distingue categorías con igual nombre entre segmentos', async () => {
    mockRoutes({
      '/api/public/services': { services: [
        { id: 's1', nombre: 'Corte', segmento: 'Caballero', subcategoria: 'Corte',
          precio: '150', tiempo: '1 hora 30 min', imagen: 'https://example.invalid/corte.png' },
        { id: 's2', nombre: 'Corte infantil', segmento: 'Infantil', subcategoria: 'Corte',
          precio: -5, tiempo: '45 min' },
        { id: 's3' },
      ] },
      '/api/public/service-categories': { categories: [
        { id: 'sc1', nombre: 'Corte', segmento: 'Caballero' },
        { id: 'sc2', nombre: 'Corte', segmento: 'Infantil' },
      ] },
    });

    const catalog = await getServicesCatalog();
    expect(catalog.services).toHaveLength(2);
    expect(catalog.categories.map((item) => item.label)).toEqual(['Todos', 'Corte · Caballero', 'Corte · Infantil']);
    expect(catalog.services[0]).toMatchObject({ id: 's1', categoryId: 'sc1', durationMinutes: 90, priceFrom: 150 });
    expect(catalog.services[1]).toMatchObject({ id: 's2', categoryId: 'sc2', durationMinutes: 45, priceFrom: 0 });
  });

  it('comparte peticiones simultáneas, usa caché y permite actualización forzada', async () => {
    mockRoutes({ '/api/public/company-info': { companyInfo: { nombre: 'Estética' } } });
    const first = getCompanyInformation();
    const second = getCompanyInformation();
    expect(await first).toEqual(await second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await getCompanyInformation();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await getCompanyInformation({ forceRefresh: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('devuelve undefined para identificadores vacíos o detalles inexistentes', async () => {
    expect(await getProduct('  ')).toBeUndefined();
    expect(await getService('')).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockResolvedValue(respond({ message: 'No encontrado' }, 404));
    expect(await getProduct('sin-producto')).toBeUndefined();
    expect(await getService('sin-servicio')).toBeUndefined();
  });

  it('codifica identificadores en URLs y propaga errores HTTP con su estado', async () => {
    fetchMock.mockResolvedValueOnce(respond({ product: { id: 'a/b', nombre: 'Crema' } }));
    expect((await getProduct(' a/b '))?.name).toBe('Crema');
    expect(String(fetchMock.mock.calls[0][0])).toContain('/public/products/a%2Fb');

    fetchMock.mockResolvedValueOnce(respond({ errors: [{ message: 'Sin permiso' }] }, 403));
    await expect(getService('privado')).rejects.toMatchObject({
      name: 'PublicApiError', status: 403, message: 'Sin permiso',
    } satisfies Partial<PublicApiError>);
  });

  it('informa los fallos de red sin exponer el error original', async () => {
    fetchMock.mockRejectedValueOnce(new Error('detalle interno'));
    await expect(getCompanyInformation()).rejects.toMatchObject({
      name: 'PublicApiError',
      message: 'No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.',
    });
  });

  it('mapea información de empresa y limita el zoom a un rango válido', async () => {
    mockRoutes({ '/api/public/company-info': { companyInfo: {
      nombre: ' Estética ', valores: 'Respeto;Calidad', mapLat: '19,43', mapLng: '-99.13', mapZoom: 99,
      politicasDocumento: 'https://example.invalid/privacidad.pdf',
    } } });
    const company = await getCompanyInformation();
    expect(company.name).toBe('Estética');
    expect(company.values).toEqual(['Respeto', 'Calidad']);
    expect(company.map).toMatchObject({ latitude: 19.43, longitude: -99.13, zoom: 22 });
    expect(company.privacyDocument.url).toBe('https://example.invalid/privacidad.pdf');
  });

  it('filtra promociones e imágenes inválidas y ordena el carrusel', async () => {
    mockRoutes({ '/api/public/carousel': { slides: [
      { id: 'second', image: 'https://example.invalid/2.png', orden: 2 },
      { id: 'invalid', image: 'javascript:alert(1)', orden: 0 },
      { id: 'first', image: 'https://example.invalid/1.png', orden: 1 },
    ] } });
    expect((await getCarouselSlides()).map((slide) => slide.id)).toEqual(['first', 'second']);
  });

  it('compone el contenido de inicio con tres respuestas reales mapeadas', async () => {
    mockRoutes({
      '/api/public/company-info': { companyInfo: { nombre: 'Estética' } },
      '/api/public/home-highlights': { products: [{ id: 'p1', nombre: 'Champú' }], services: [],
        promotions: [{ id: 'promo', titulo: 'Oferta' }, { id: 'sin-titulo' }] },
      '/api/public/carousel': { slides: [{ id: 'slide', image: 'https://example.invalid/slide.png' }] },
    });
    const home = await getPublicHomeContent();
    expect(home.companyInformation.name).toBe('Estética');
    expect(home.products.map((product) => product.id)).toEqual(['p1']);
    expect(home.promotions.map((promotion) => promotion.id)).toEqual(['promo']);
    expect(home.carouselSlides.map((slide) => slide.id)).toEqual(['slide']);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('mapea en un solo bootstrap los catálogos y promociones públicas', async () => {
    mockRoutes({ '/api/public/bootstrap': { products: [{ id: 'p1', nombre: 'Champú' }],
      productCategories: [], services: [{ id: 's1', nombre: 'Corte', tiempo: '30 min' }],
      serviceCategories: [], promotions: [{ id: 'promo', titulo: 'Oferta' }],
      carouselSlides: [{ id: 'slide', image: 'https://example.invalid/slide.png' }],
      companyInfo: { nombre: 'Estética' },
    } });
    const bootstrap = await getPublicBootstrap();
    expect(bootstrap.products).toHaveLength(1);
    expect(bootstrap.services).toHaveLength(1);
    expect(bootstrap.promotions).toHaveLength(1);
    expect(bootstrap.carouselSlides).toHaveLength(1);
    expect(bootstrap.companyInformation.name).toBe('Estética');
  });

  it('mapea el detalle real de un servicio y sus imágenes de galería', async () => {
    mockRoutes({ '/api/public/services/s-1': { service: {
      id: 's-1', nombre: 'Corte', segmento: 'Cabello', subcategoria: 'Corte', precio: 250,
      galeriaImagenes: [{ secure_url: 'https://example.invalid/one.png' }],
      tiempo: '30 min',
    } } });
    const detail = await getService('s-1');
    expect(detail).toMatchObject({ id: 's-1', name: 'Corte', priceFrom: 250, durationMinutes: 30 });
    expect(detail?.images).toEqual([{ uri: 'https://example.invalid/one.png' }]);
  });

  it('filtra promociones sin título o identificador', async () => {
    mockRoutes({ '/api/public/promotions': { promotions: [
      { id: 'promo-1', titulo: 'Oferta de octubre' }, { id: 'invalid' }, null,
    ] } });
    expect((await getPromotions()).map((item) => item.id)).toEqual(['promo-1']);
  });

  it('propaga errores HTTP distintos de 404 para un producto', async () => {
    fetchMock.mockResolvedValue(respond({ error: 'Servidor ocupado' }, 503));
    await expect(getProduct('p-1')).rejects.toMatchObject({
      name: 'PublicApiError', status: 503, message: 'Servidor ocupado',
    });
  });

  it('distingue un tiempo de espera agotado de un fallo de red inmediato', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation((_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    const request = getCompanyInformation();
    jest.advanceTimersByTime(30_000);
    await expect(request).rejects.toMatchObject({
      name: 'PublicApiError', message: 'El servidor tardó demasiado en responder. Inténtalo nuevamente.',
    });
  });
});
