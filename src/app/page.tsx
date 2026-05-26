import Hero from '@/components/sections/hero';
import Manifesto from '@/components/sections/manifesto';
import Character from '@/components/sections/character';
import Universe from '@/components/sections/universe';
import Newsletter from '@/components/sections/newsletter';
import Footer from '@/components/sections/footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifesto />
      <Character />
      <Universe />
      <Newsletter />
      <Footer />
    </main>
  );
}
