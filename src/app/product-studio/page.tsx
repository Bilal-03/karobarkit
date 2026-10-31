import { InfoPage } from '@/components/layout/info-page';
import { ProductStudio } from '@/components/product-studio/product-studio';
import { pageMetadata } from '@/lib/seo';
export const metadata = {
  ...pageMetadata({
    title: 'Product Studio',
    description: 'Plan experiments, compare roadmap assumptions and record product decisions.',
    path: '/product-studio',
  }),
  robots: { index: false, follow: true },
};
export default function Page() {
  return (
    <InfoPage
      eyebrow="Owner and portfolio workspace"
      title="Product Studio"
      intro="Make hypotheses, tradeoffs and decisions explicit. These planning records stay on your device when you choose to save."
    >
      <ProductStudio />
    </InfoPage>
  );
}
