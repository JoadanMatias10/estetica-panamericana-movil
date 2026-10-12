import type { ImageSourcePropType } from 'react-native';

import type { ProductCategory, PublicProduct } from './public-product';
import type { PublicService, ServiceCategory } from './public-service';

export type PublicCompanyInformation = {
  name: string;
  address: string;
  phone: string;
  email: string;
  mission: string;
  vision: string;
  values: string[];
  facebookUrl: string;
  instagramUrl: string;
  aboutText: string;
  essence: string;
  mondayToSaturdaySchedule: string;
  sundaySchedule: string;
  map: {
    latitude?: number;
    longitude?: number;
    zoom: number;
    googleMapsUrl: string;
  };
  privacyDocument: {
    url: string;
    name: string;
    mimeType: string;
  };
};

export type PublicPromotion = {
  id: string;
  title: string;
  description: string;
  discount: string;
  featured: boolean;
};

export type PublicCarouselSlide = {
  id: string;
  image: ImageSourcePropType;
  imageUrl: string;
  order: number;
};

export type PublicPrivacySummarySection = {
  content: string;
  id: string;
  title: string;
};

export type PublicPrivacyDocument = {
  fileName: string;
  fileSizeText?: string;
  fileType: string;
  lastUpdatedText?: string;
  summarySections?: readonly PublicPrivacySummarySection[];
};

export type PublicProductsCatalog = {
  products: PublicProduct[];
  categories: ProductCategory[];
};

export type PublicServicesCatalog = {
  services: PublicService[];
  categories: ServiceCategory[];
};

export type PublicHomeHighlights = {
  products: PublicProduct[];
  services: PublicService[];
  promotions: PublicPromotion[];
};

export type PublicHomeContent = PublicHomeHighlights & {
  companyInformation: PublicCompanyInformation;
  carouselSlides: PublicCarouselSlide[];
};

export type PublicBootstrap = {
  companyInformation: PublicCompanyInformation;
  productCategories: ProductCategory[];
  products: PublicProduct[];
  serviceCategories: ServiceCategory[];
  services: PublicService[];
  promotions: PublicPromotion[];
  carouselSlides: PublicCarouselSlide[];
};
