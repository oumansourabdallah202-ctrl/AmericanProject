import { Heart, Users, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function About() {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[280px] sm:min-h-[320px] md:h-80 lg:h-96 flex items-center justify-center" data-aos="fade-down">
        <div
          className="hero-bg absolute inset-0"
          style={{ backgroundImage: "url(/gallery_1.jpeg)" }}
        >
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 container text-center text-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Welcome to TestRestaurant</h1>
          <div className="blue-border mx-auto my-4" style={{height:'2px',maxWidth:'200px',background:'#2563eb'}}></div>
          <p className="text-xl">A new dining experience</p>
        </div>
      </section>

      {/* Story Section */}
      <section className="section-spacing white-bg" data-aos="fade-up">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Our Story</h2>
            <div className="blue-border mx-auto my-4" style={{height:'2px',maxWidth:'200px',background:'#2563eb'}}></div>
          </div>
          <div className="prose prose-lg max-w-none text-foreground">
            <p className="text-lg leading-relaxed mb-6">
              TestRestaurant was founded to bring a fresh, modern dining experience to Cityville. Our team is passionate about great food, friendly service, and a welcoming atmosphere.
            </p>
            <p className="text-lg leading-relaxed mb-6">
              We believe in using quality ingredients and creative recipes to delight every guest.
            </p>
            <p className="text-xl font-semibold blue-text text-center">
              "Every meal is a new memory."
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="section-spacing white-bg" data-aos="fade-up">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Our Values</h2>
            <div className="blue-border mx-auto my-4" style={{height:'2px',maxWidth:'200px',background:'#2563eb'}}></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 blue-bg rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 blue-text">Passion</h3>
              <p className="text-lg text-muted-foreground">
                We love what we do and it shows in every dish.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 blue-bg rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 blue-text">Respect</h3>
              <p className="text-lg text-muted-foreground">
                For our guests, our team, and our community.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 blue-bg rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 blue-text">Quality</h3>
              <p className="text-lg text-muted-foreground">
                Only the best ingredients and service for every guest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="section-spacing white-bg" data-aos="fade-up">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Experience TestRestaurant</h2>
              <div className="blue-border mx-0 my-4" style={{height:'2px',maxWidth:'200px',background:'#2563eb'}}></div>
              <p className="text-lg mb-6 leading-relaxed">
                Enjoy a modern, vibrant space with delicious food and friendly faces.
              </p>
              <p className="text-lg mb-6 leading-relaxed">
                Whether it's a family dinner or a night out with friends, we make every visit special.
              </p>
              <p className="text-lg leading-relaxed">
                Discover your new favorite spot in Cityville.
              </p>
            </div>
            <div className="relative min-h-[240px] sm:min-h-[280px] lg:min-h-[380px] w-full overflow-hidden rounded-lg aspect-[4/3]">
              <img
                src="/gallery_2.jpeg"
                alt="TestRestaurant interior"
                width={800}
                height={600}
                className="w-full h-full object-cover object-center rounded-lg shadow-2xl"
                loading="lazy"
                decoding="async"
                data-aos="zoom-in"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
