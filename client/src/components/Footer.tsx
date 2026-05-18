import { MapPin, Phone, Mail, Clock, Instagram } from "lucide-react";

/** Facebook icon with capital F */
function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4h2v16H7V4zm0 0h10v2H7V4zm0 6h8v2H7v-2z" />
    </svg>
  );
}

/** TripAdvisor logo (owl) – inline SVG for footer link */
function TripAdvisorIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.006 4.295c-2.67 0-5.338.784-7.645 2.353H0l1.963 2.135a5.997 5.997 0 0 0 4.04 10.43 5.976 5.976 0 0 0 4.075-1.6L12 19.705l1.922-2.09a5.976 5.976 0 0 0 4.075 1.6 5.997 5.997 0 0 0 4.04-10.43L24 6.648h-4.35a13.573 13.573 0 0 0-7.644-2.353zM12 6.255c1.531 0 3.063.303 4.504.91a7.273 7.273 0 0 1 3.104 2.587 7.272 7.272 0 0 1-3.104 2.586 10.02 10.02 0 0 1-4.504.91 10.02 10.02 0 0 1-4.504-.91 7.272 7.272 0 0 1-3.104-2.586 7.272 7.272 0 0 1 3.104-2.587A10.02 10.02 0 0 1 12 6.255z" />
    </svg>
  );
}

/** TikTok logo – inline SVG for footer link */
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-white-bg text-foreground">
      <div className="container section-spacing">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div data-aos="fade-up">
            <h3 className="brand-font text-2xl font-bold blue-text mb-6">TestRestaurant</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 blue-text flex-shrink-0 mt-0.5" />
                <span>123 Main Street<br />Cityville, Country</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 blue-text flex-shrink-0" />
                <a href="tel:+1234567890" className="hover:text-blue-600 transition-colors">
                  +1 234 567 890
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 blue-text flex-shrink-0" />
                <a href="mailto:info@testrestaurant.com" className="hover:text-blue-600 transition-colors">
                  info@testrestaurant.com
                </a>
              </div>
              <div className="pt-2">
                <Link href="/careers" className="text-sm hover:text-blue-600 transition-colors font-medium">
                  Careers
                </Link>
              </div>
            </div>
          </div>

          {/* Opening Hours */}
          <div data-aos="fade-up" data-aos-delay="100">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Clock className="w-5 h-5 blue-text mr-2" />
              Opening Hours
            </h3>
            <div className="space-y-4 text-sm overflow-x-auto">
              <div>
                <h4 className="font-semibold mb-2">Kitchen</h4>
                <table className="w-full border border-border rounded-md overflow-hidden">
                  <tbody>
                    <tr className="border-b border-border"><td className="p-2">Mon-Fri</td><td className="p-2 blue-text">12:00-22:00</td></tr>
                    <tr className="border-b border-border"><td className="p-2">Saturday</td><td className="p-2 blue-text">14:00-23:00</td></tr>
                    <tr><td className="p-2">Sunday</td><td className="p-2 blue-text">Closed</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bar</h4>
                <table className="w-full border border-border rounded-md overflow-hidden">
                  <tbody>
                    <tr className="border-b border-border"><td className="p-2">Mon-Fri</td><td className="p-2 blue-text">12:00-23:00</td></tr>
                    <tr className="border-b border-border"><td className="p-2">Saturday</td><td className="p-2 blue-text">14:00-00:00</td></tr>
                    <tr><td className="p-2">Sunday</td><td className="p-2 blue-text">Closed</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Social & Newsletter */}
          <div data-aos="fade-up" data-aos-delay="200">
            <h3 className="text-xl font-bold mb-6">Stay Connected</h3>
            <p className="text-sm mb-4">
              Follow us for offers, events, and more!
            </p>
            <div className="flex space-x-4 mb-6">
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full blue-bg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full blue-bg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                aria-label="Facebook"
              >
                <FacebookIcon size={20} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full blue-bg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon size={20} />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full blue-bg flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                aria-label="TripAdvisor"
              >
                <TripAdvisorIcon size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} TestRestaurant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
