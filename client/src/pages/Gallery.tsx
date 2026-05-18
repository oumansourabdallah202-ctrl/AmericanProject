import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Gallery() {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    { src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80", alt: "Gourmet dish", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80", alt: "Fresh salad", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80", alt: "Pizza", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", alt: "Pancakes", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&q=80", alt: "Pasta dish", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=80", alt: "Grilled meat", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80", alt: "Fine dining plate", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80", alt: "Breakfast plate", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600&q=80", alt: "Pasta carbonara", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80", alt: "Dessert", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80", alt: "Cocktail", categoryKey: "gallery.bar" },
    { src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80", alt: "Healthy bowl", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80", alt: "Seafood dish", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&q=80", alt: "Risotto", categoryKey: "gallery.food" },
    { src: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&q=80", alt: "Burger", categoryKey: "gallery.food" },
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[280px] sm:min-h-[320px] md:h-80 lg:h-96 flex items-center justify-center">
        <div
          className="hero-bg absolute inset-0"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80)" }}
        >
          <div className="hero-overlay absolute inset-0" />
        </div>
        
        <div className="relative z-10 container text-center text-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">{t("gallery.title")}</h1>
          <div className="gold-divider"></div>
          <p className="text-xl">{t("gallery.subtitle")}</p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-spacing cream-bg">
        <div className="container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {images.map((image, idx) => (
              <div
                key={idx}
                className="group relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-pointer bg-muted min-h-[200px] sm:min-h-0"
                onClick={() => setSelectedImage(image.src)}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 sm:group-hover:scale-110 relative z-0"
                  loading="lazy"
                  decoding="async"
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onError={(e) => {
                    const parent = e.currentTarget.parentElement;
                    if (parent) parent.style.display = "none";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:text-[#2563eb] transition-colors z-10 rounded-full hover:bg-white/10"
            onClick={() => setSelectedImage(null)}
            aria-label="Close"
          >
            <X size={28} className="sm:w-8 sm:h-8" />
          </button>
          <img
            src={selectedImage}
            alt="Selected"
            className="max-w-full max-h-[85vh] sm:max-h-[90vh] w-auto h-auto object-contain rounded"
            onClick={(e) => e.stopPropagation()}
            decoding="async"
            onError={(e) => {
              console.error(`Failed to load image in lightbox: ${selectedImage}`);
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      )}

      {/* Visit CTA */}
      <section className="section-spacing bg-background text-foreground">
        <div className="container text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("home.visitTitle")}</h2>
          <div className="gold-divider"></div>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t("home.visitDesc1")} {t("home.visitDesc2")}
          </p>
          <Link href="/reservations">
            <Button size="lg" className="gold-bg text-black hover:bg-[#1d4ed8] font-semibold text-lg px-8">
              {t("nav.bookTable")}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
