'use client';

import { useMemo, useState } from 'react';
import type { CatalogProductImage } from '@/features/catalog/catalog.types';

export function ProductMediaGallery({ images, title }: { images: CatalogProductImage[]; title: string }) {
  const galleryImages = useMemo(
    () => images.length ? images : [{ id: 'fallback', url: '/mock-products/gift-box.svg', alt: title, sortOrder: 0, isPrimary: true }],
    [images, title]
  );
  const [activeImage, setActiveImage] = useState(galleryImages[0]?.url ?? '/mock-products/gift-box.svg');

  return (
    <div className="mediaGallery">
      <div className="mediaMain">
        <img src={activeImage} alt={title} />
      </div>
      <div className="mediaThumbs">
        {galleryImages.map((image) => (
          <button
            type="button"
            key={image.id}
            className={activeImage === image.url ? 'active' : ''}
            onClick={() => setActiveImage(image.url)}
          >
            <img src={image.url} alt={image.alt ?? ''} />
          </button>
        ))}
      </div>
    </div>
  );
}
