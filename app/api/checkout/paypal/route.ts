import { NextResponse } from 'next/server';

// ⚠️ DEMO: reenvía a PayPal Checkout si configuras tus credenciales.
// Implementa OAuth + Orders API con tus CLIENT_ID/SECRET.
export async function POST() {
  // TODO: Implementa fetch a PayPal para crear order
   const approvalUrl = 'https://www.paypal.com/checkoutnow?token=...';
  return NextResponse.json({ approvalUrl: null }); // ← pon la URL real cuando integres
}
