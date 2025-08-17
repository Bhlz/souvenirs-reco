'use client';
export function toast(message: string) {
  const ev = new CustomEvent('app:toast', { detail: { message } });
  window.dispatchEvent(ev);
}
