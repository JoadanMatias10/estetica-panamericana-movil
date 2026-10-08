import { useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { PublicProduct } from '../models/public-product';
import { styles } from '../styles/product-detail-screen.styles';
import { ProductImage } from './product-image';

export function ProductGallery({ product }: { product: PublicProduct }) {
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState(0);
  const images = product.images.length ? product.images : [undefined];
  return <View onLayout={event => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth !== width) {
      setWidth(nextWidth);
      scroll.current?.scrollTo({ x: active * nextWidth, animated: false });
    }
  }}>
    <ScrollView ref={scroll} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
      onMomentumScrollEnd={event => {
        if (width) setActive(Math.max(0, Math.min(images.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))));
      }}>
      {images.map((source, index) => <ProductImage key={index} source={source}
        label={`${product.name}, imagen ${index + 1} de ${images.length}`}
        style={[styles.galleryImage, { width: width || 320 }]} />)}
    </ScrollView>
    {product.images.length > 0 && <View style={styles.dots}>
      {images.map((_, index) => <Pressable key={index} accessibilityRole="button"
        accessibilityLabel={`Mostrar imagen ${index + 1} de ${images.length}`} accessibilityState={{ selected: active === index }}
        style={styles.dotButton} onPress={() => { setActive(index); scroll.current?.scrollTo({ x: index * width, animated: true }); }}>
        <View style={[styles.dot, active === index && styles.activeDot]} />
      </Pressable>)}
    </View>}
  </View>;
}
