import './globals.css';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FreeShippingBar from '@/components/FreeShippingBar';
import Toaster from '@/components/Toaster';
import WhatsAppButton from '@/components/WhatsAppButton';

export const metadata: Metadata = {
  title: 'Souvenirs mexicanos auténticos | SouvenirsMX',
  description: 'Souvenirs y artesanías mexicanas con envío rápido, empaques para regalo y devoluciones fáciles.',
  icons: { icon: '/favicon.ico' },
  openGraph: { title: 'SouvenirsMX', description: 'Souvenirs mexicanos auténticos', type: 'website' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <FreeShippingBar/>
        <Header/>
        <main>{children}</main>
        <Footer/>
        <WhatsAppButton/>
        <Toaster/>
      </body>
    </html>
  );
}
