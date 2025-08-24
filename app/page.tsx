import Hero from '@/components/Hero';
import Collections from '@/components/Collections';
import ReviewsUGC from '@/components/ReviewsUGC';
import Benefits from '@/components/Benefits';
import Story from '@/components/Story';
import FAQ from '@/components/FAQ';

export default function Page() {
  return (
    <>
      <Hero/>
      <Collections/>
      <ReviewsUGC/>
      <Benefits/>
      <Story/>
      <FAQ/>
    </>
  );
}