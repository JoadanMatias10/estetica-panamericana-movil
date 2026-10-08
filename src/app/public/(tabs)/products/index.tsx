import { useRouter } from 'expo-router';
import { ProductsScreen } from '@/features/public/views/products-screen';
import { useProductsViewModel } from '@/features/public/view-models/use-products-view-model';

export default function ProductsPage() {
  const router = useRouter();
  const products = useProductsViewModel();
  return <ProductsScreen {...products} onLogin={() => router.push('/public/login')}
    onDetail={id => router.push({ pathname: '/public/products/[id]', params: { id } })} />;
}
