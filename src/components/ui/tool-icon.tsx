import {
  Calculator,
  Receipt,
  Files,
  QrCode,
  Image,
  Sparkles,
  TrendingUp,
  Truck,
  ShoppingBag,
  Users,
  Building2,
} from 'lucide-react';
const icons = {
  calculators: Calculator,
  business: TrendingUp,
  finance: Calculator,
  startup: TrendingUp,
  tax: Receipt,
  'gst-tax': Receipt,
  documents: Files,
  generators: Files,
  sharing: QrCode,
  files: Image,
  'media-files': Image,
  ai: Sparkles,
  'ai-tools': Sparkles,
  'retail-logistics': Truck,
  ecommerce: ShoppingBag,
  'hr-salary': Users,
  'marketing-digital': QrCode,
  'daily-utilities': Calculator,
};
export function ToolIcon({ category }: { category: string }) {
  const Icon = icons[category as keyof typeof icons] ?? Building2;
  return (
    <span className={`tool-icon icon-${category}`} aria-hidden="true">
      <Icon size={21} strokeWidth={1.75} />
    </span>
  );
}
