import Header from "@/components/header";
import Hero from "@/components/hero";
import TTSTool from "@/components/tts-tool";
import FileManager from "@/components/file-manager";
import Features from "@/components/features";
import Pricing from "@/components/pricing";
import Footer from "@/components/footer";
import UpgradeBanner from "@/components/upgrade-banner";
import ScrollToTop from "@/components/scroll-to-top";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <Hero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <UpgradeBanner />
      </div>
      <TTSTool />
      <FileManager />
      <Features />
      <Pricing />
      <Footer />
      <ScrollToTop />
    </div>
  );
}
