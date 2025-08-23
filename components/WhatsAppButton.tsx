'use client';
export default function WhatsAppButton() {
  const phone = '5213333901072';
  const message = encodeURIComponent('Hola, tengo una duda sobre un producto de SouvenirsMX.');
  const href = `https://wa.me/${phone}?text=${message}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="fixed bottom-5 right-5 z-50 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-xl">
      WhatsApp
    </a>
  );
}
