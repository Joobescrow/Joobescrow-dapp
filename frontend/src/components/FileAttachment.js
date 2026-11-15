'use client';

// Affichage d'une piece jointe XMTP : apercu pour les images bitmap uniquement (jamais SVG ni HTML),
// sinon nom, poids et telechargement. Le fichier telecharge est force en octet-stream pour ne jamais
// etre interprete par le navigateur.
import { useEffect, useMemo, useState } from 'react';
import { CHAT_FILES } from '../config/chatFiles';
import { formatBytes } from '../lib/evidence';
import './EscrowFiles.css';

const safeName = (n) => (n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120);

export default function FileAttachment({ attachment, compact = false }) {
  const { filename, mimeType, content } = attachment || {};
  const canPreview = CHAT_FILES.previewMime.includes(mimeType);
  const [previewUrl, setPreviewUrl] = useState(null);

  const downloadUrl = useMemo(() => {
    if (!content) return null;
    return URL.createObjectURL(new Blob([content], { type: 'application/octet-stream' }));
  }, [content]);

  useEffect(() => {
    if (!canPreview || !content) return undefined;
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [canPreview, content, mimeType]);

  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);

  if (!content) return <span className="file-att-missing">File unavailable</span>;

  return (
    <div className={`file-att ${compact ? 'is-compact' : ''}`}>
      {previewUrl && !compact && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={safeName(filename)} className="file-att-preview" />
      )}
      <div className="file-att-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
        <span className="file-att-name" title={safeName(filename)}>{safeName(filename)}</span>
        <span className="file-att-size">{formatBytes(content.byteLength)}</span>
        <a href={downloadUrl} download={safeName(filename)} className="file-att-dl">Download</a>
      </div>
    </div>
  );
}
