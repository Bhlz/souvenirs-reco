'use client';
import { useState } from 'react';

export default function ImageUploader({ onUploaded }: { onUploaded: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setLoading(true); setError(null);
    try {
      const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (cloud && preset) {
        const fd = new FormData();
        fd.append('file', f);
        fd.append('upload_preset', preset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/upload`, { method: 'POST', body: fd });
        if (!res.ok) throw new Error('Cloudinary upload failed');
        const data = await res.json();
        onUploaded(data.secure_url);
      } else {
        const fd = new FormData();
        fd.append('file', f);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.details || data.error || 'Upload error');
        }
        onUploaded(data.url);
      }
    } catch (e: any) {
      console.error('Upload error:', e);
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input type="file" accept="image/*" onChange={onFile} />
      {loading && <span className="text-sm text-neutral-600">Subiendo...</span>}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
