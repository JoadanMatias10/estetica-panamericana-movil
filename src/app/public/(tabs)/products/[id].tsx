import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProductsCatalog } from '@/features/public/data/catalog-api';
import { ProductDetailScreen } from '@/features/public/views/product-detail-screen';
import { useProductDetailViewModel } from '@/features/public/view-models/use-product-detail-view-model';

export async function generateStaticParams() {
  const { products } = await getProductsCatalog();
  return products.map(product => ({ id: product.id }));
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const detail = useProductDetailViewModel(Array.isArray(id) ? id[0] : id);
  return <ProductDetailScreen {...detail} onLogin={() => router.push('/public/login')} onBack={() => {
    router.dismissTo('/public/products');
  }} />;
}
