'use client';
import Image from 'next/image';

export default function WhatsAppButton() {
  const phone = '5213333901072';
  const message = encodeURIComponent('¡Hola! 👋 Me interesa conocer más sobre Souvenirs Greco. Quisiera información sobre sus productos, disponibilidad y envíos.');
  const href = `https://wa.me/${phone}?text=${message}`;
  
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer" 
      className="fixed bottom-20 right-5 z-50 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-xl hover:bg-[#20b358] transition-all duration-300 hover:scale-105 flex items-center gap-2"
    >
      <Image
        src="uploads/29ae79f2c84d29b4fd57d9dd55730b29.png"
        alt="WhatsApp Logo"
        width={20}
        height={20}
        className="w-5 h-5 opacity-100"
      />
      WhatsApp
    </a>
  );
}