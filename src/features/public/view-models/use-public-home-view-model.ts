import { getPublicHomeContent } from '../services/public-api-service';
import { usePublicApiResource } from './use-public-api-resource';

export function usePublicHomeViewModel() {
  const resource = usePublicApiResource(getPublicHomeContent);
  const data = resource.data;

  return {
    ...resource,
    businessName: data?.companyInformation.name || 'Estética Panamericana',
    banners: data?.carouselSlides ?? [],
    promotions: data?.promotions ?? [],
    featuredServices: data?.services.slice(0, 4) ?? [],
  };
}
