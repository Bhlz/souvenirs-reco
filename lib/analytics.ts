'use client';
export type EventName = 'hero_cta_click'|'collection_card_click'|'add_to_cart'|'buy_now_click'|'faq_toggle'|'whatsapp_click';
export function track(event: EventName, payload?: Record<string, unknown>) {
  console.log('[analytics]', event, payload || {});
}
