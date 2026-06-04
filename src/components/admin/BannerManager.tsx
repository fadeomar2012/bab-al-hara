'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createBannerAction,
  updateBannerAction,
  setBannerActiveAction,
  deleteBannerAction
} from '@/features/admin/banners/banner-admin.actions';
import { BANNER_PLACEMENTS } from '@/features/admin/banners/banner-admin.validation';
import type { AdminBannerListItem } from '@/features/admin/banners/banner-admin.queries';
import { formatDateTime } from '@/features/admin/shared/admin-format';
import { ImageUploadButton } from './ImageUploadButton';

type EditorState = {
  id?: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  href: string;
  ctaLabel: string;
  placement: (typeof BANNER_PLACEMENTS)[number];
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const PLACEMENT_LABEL: Record<string, string> = {
  HOME_HERO: 'Home hero',
  HOME_PROMO: 'Home promo',
  CATEGORY_TOP: 'Category top'
};

function emptyEditor(sortOrder: number): EditorState {
  return { title: '', subtitle: '', eyebrow: '', imageUrl: '', cloudinaryPublicId: '', href: '', ctaLabel: '', placement: 'HOME_HERO', sortOrder: String(sortOrder), isActive: true, startsAt: '', endsAt: '' };
}

export function BannerManager({ banners }: { banners: AdminBannerListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [issues, setIssues] = useState<Record<string, string>>({});
  const [formMessage, setFormMessage] = useState<string | null>(null);

  function openAdd() {
    setIssues({});
    setFormMessage(null);
    setEditor(emptyEditor(banners.length + 1));
  }

  function openEdit(banner: AdminBannerListItem) {
    setIssues({});
    setFormMessage(null);
    setEditor({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      eyebrow: banner.eyebrow,
      imageUrl: banner.imageUrl,
      cloudinaryPublicId: banner.cloudinaryPublicId,
      href: banner.href,
      ctaLabel: banner.ctaLabel,
      placement: banner.placement,
      sortOrder: String(banner.sortOrder),
      isActive: banner.isActive,
      startsAt: banner.startsAtInput,
      endsAt: banner.endsAtInput
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!editor) return;
    setIssues({});
    setFormMessage(null);

    const payload = {
      title: editor.title.trim(),
      subtitle: editor.subtitle.trim() || undefined,
      eyebrow: editor.eyebrow.trim() || undefined,
      imageUrl: editor.imageUrl.trim() || undefined,
      cloudinaryPublicId: editor.cloudinaryPublicId.trim() || undefined,
      href: editor.href.trim() || undefined,
      ctaLabel: editor.ctaLabel.trim() || undefined,
      placement: editor.placement,
      sortOrder: Number(editor.sortOrder) || 0,
      isActive: editor.isActive,
      startsAt: editor.startsAt || undefined,
      endsAt: editor.endsAt || undefined
    };

    startTransition(async () => {
      const result = editor.id ? await updateBannerAction(editor.id, payload) : await createBannerAction(payload);
      if (result.ok) {
        setEditor(null);
        router.refresh();
      } else {
        setFormMessage(result.message);
        const map: Record<string, string> = {};
        result.issues.forEach((issue) => { map[issue.path] = issue.message; });
        setIssues(map);
      }
    });
  }

  function toggleActive(banner: AdminBannerListItem) {
    startTransition(async () => {
      await setBannerActiveAction(banner.id, !banner.isActive);
      router.refresh();
    });
  }

  function remove(banner: AdminBannerListItem) {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    startTransition(async () => {
      await deleteBannerAction(banner.id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="adminCardHeader">
        <p className="adminMuted">{banners.length} banners.</p>
        {!editor && <button type="button" className="adminBtn adminBtnPrimary" onClick={openAdd}>+ Add banner</button>}
      </div>

      {editor && (
        <form className="adminCard adminForm" onSubmit={submit} style={{ marginBottom: 16 }}>
          <div className="adminCardHeader"><h2>{editor.id ? 'Edit banner' : 'New banner'}</h2></div>
          {formMessage && <div className="adminAlert isError">{formMessage}</div>}
          <div className="adminFormGrid two">
            <div className="adminField spanTwo">
              <label>Title *</label>
              <input className={issues.title ? 'hasError' : ''} value={editor.title} onChange={(e) => setEditor({ ...editor, title: e.target.value })} required />
              {issues.title && <span className="adminFieldError">{issues.title}</span>}
            </div>
            <div className="adminField">
              <label>Eyebrow</label>
              <input value={editor.eyebrow} onChange={(e) => setEditor({ ...editor, eyebrow: e.target.value })} />
            </div>
            <div className="adminField">
              <label>CTA label</label>
              <input value={editor.ctaLabel} onChange={(e) => setEditor({ ...editor, ctaLabel: e.target.value })} />
            </div>
            <div className="adminField spanTwo">
              <label>Subtitle</label>
              <textarea value={editor.subtitle} onChange={(e) => setEditor({ ...editor, subtitle: e.target.value })} />
            </div>
            <div className="adminField spanTwo">
              <label>صورة البانر</label>
              <div className="adminImageRow">
                {editor.imageUrl ? (
                  <img className="adminImagePreview" src={editor.imageUrl} alt="معاينة البانر" />
                ) : (
                  <div className="adminImagePreview adminImagePreviewEmpty" aria-hidden="true">لا معاينة</div>
                )}
                <div style={{ flex: 1, minWidth: 0, display: 'grid', gap: 8 }}>
                  <input
                    className={issues.imageUrl ? 'hasError' : ''}
                    value={editor.imageUrl}
                    onChange={(e) => setEditor({ ...editor, imageUrl: e.target.value })}
                    placeholder="رابط الصورة أو /mock-products/bag-camel.svg"
                  />
                  {issues.imageUrl && <span className="adminFieldError">{issues.imageUrl}</span>}
                  <ImageUploadButton
                    kind="banner"
                    label={editor.imageUrl ? 'استبدال الصورة' : 'رفع صورة البانر'}
                    onUploaded={(image) => setEditor((prev) => (prev ? { ...prev, imageUrl: image.secureUrl, cloudinaryPublicId: image.publicId } : prev))}
                  />
                </div>
              </div>
            </div>
            <div className="adminField">
              <label>Link (href)</label>
              <input className={issues.href ? 'hasError' : ''} value={editor.href} onChange={(e) => setEditor({ ...editor, href: e.target.value })} placeholder="/category/sale" />
              {issues.href && <span className="adminFieldError">{issues.href}</span>}
            </div>
            <div className="adminField">
              <label>Placement *</label>
              <select value={editor.placement} onChange={(e) => setEditor({ ...editor, placement: e.target.value as EditorState['placement'] })}>
                {BANNER_PLACEMENTS.map((placement) => (
                  <option key={placement} value={placement}>{PLACEMENT_LABEL[placement]}</option>
                ))}
              </select>
            </div>
            <div className="adminField">
              <label>Sort order</label>
              <input type="number" min="0" step="1" value={editor.sortOrder} onChange={(e) => setEditor({ ...editor, sortOrder: e.target.value })} />
            </div>
            <div className="adminField">
              <label>Starts at</label>
              <input type="datetime-local" value={editor.startsAt} onChange={(e) => setEditor({ ...editor, startsAt: e.target.value })} />
            </div>
            <div className="adminField">
              <label>Ends at</label>
              <input className={issues.endsAt ? 'hasError' : ''} type="datetime-local" value={editor.endsAt} onChange={(e) => setEditor({ ...editor, endsAt: e.target.value })} />
              {issues.endsAt && <span className="adminFieldError">{issues.endsAt}</span>}
            </div>
            <div className="adminField">
              <label>&nbsp;</label>
              <label className={`adminCheck${editor.isActive ? ' isOn' : ''}`}>
                <input type="checkbox" checked={editor.isActive} onChange={(e) => setEditor({ ...editor, isActive: e.target.checked })} /> Active
              </label>
            </div>
          </div>
          <div className="adminBtnRow">
            <button type="submit" className="adminBtn adminBtnPrimary" disabled={pending}>{pending ? 'Saving…' : editor.id ? 'Save banner' : 'Create banner'}</button>
            <button type="button" className="adminBtn adminBtnGhost" disabled={pending} onClick={() => setEditor(null)}>Cancel</button>
          </div>
        </form>
      )}

      {banners.length === 0 ? (
        <div className="adminEmptyState">No banners yet.</div>
      ) : (
        <div className="adminCardList">
          {banners.map((banner) => (
            <div key={banner.id} className="adminRecordCard">
              <div className="adminRecordTop">
                <img className="adminThumb" src={banner.imageUrl || '/mock-products/gift-box.svg'} alt={banner.title} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong>{banner.title}</strong>
                  <div className="adminMuted" style={{ fontSize: 12 }}>{PLACEMENT_LABEL[banner.placement]} · sort {banner.sortOrder}</div>
                </div>
                <span className={`adminBadge ${banner.isActive ? 'isActive' : 'isArchived'}`}>{banner.isActive ? 'Active' : 'Disabled'}</span>
              </div>
              <div className="adminRecordMeta">
                {banner.startsAt && <span>From: <b>{formatDateTime(banner.startsAt)}</b></span>}
                {banner.endsAt && <span>Until: <b>{formatDateTime(banner.endsAt)}</b></span>}
                {banner.href && <span>Link: <b>{banner.href}</b></span>}
              </div>
              <div className="adminBtnRow">
                <button type="button" className="adminBtn adminBtnSm" onClick={() => openEdit(banner)} disabled={pending}>Edit</button>
                <button type="button" className="adminBtn adminBtnGhost adminBtnSm" onClick={() => toggleActive(banner)} disabled={pending}>{banner.isActive ? 'Disable' : 'Enable'}</button>
                <button type="button" className="adminBtn adminBtnDanger adminBtnSm" onClick={() => remove(banner)} disabled={pending}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
