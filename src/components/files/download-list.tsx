import { Button } from '@/components/ui/button';

export interface DownloadListItem {
  name: string;
  detail?: string;
  onDownload: () => void;
}

export function DownloadList({ items }: { items: readonly DownloadListItem[] }) {
  if (!items.length) return null;
  return (
    <div className="download-list" aria-label="Available downloads">
      {items.map((item) => (
        <div className="download-list__item" key={item.name}>
          <div>
            <strong>{item.name}</strong>
            {item.detail ? <span>{item.detail}</span> : null}
          </div>
          <Button type="button" variant="secondary" onClick={item.onDownload}>
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}
