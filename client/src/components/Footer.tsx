import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-sage via-sage-light to-forest border-t border-gold-accent/40 shadow-elegant">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-playfair text-3xl font-bold text-deep-forest mb-4 block hover:text-white transition-all duration-500 transform hover:scale-105">
              Roven
            </Link>
            <p className="text-deep-forest mb-6 max-w-md leading-relaxed">
              Premium beauty products crafted with natural ingredients to enhance
              your unique radiance. Discover the perfect blend of luxury and wellness.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/roven_beauty/" className="text-forest hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-forest hover:text-white transition-all duration-300 transform hover:scale-110 hover:-rotate-3">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-forest hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-forest hover:text-white transition-all duration-300 transform hover:scale-110 hover:-rotate-3">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-deep-forest mb-4 text-lg border-b border-gold-accent/30 pb-2">Quick Links</h4>
            <ul className="space-y-3">
              <li><Link to="/shop" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">Shop All</Link></li>
              <li><Link to="/about" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">About Us</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-deep-forest mb-4 text-lg border-b border-gold-accent/30 pb-2">Customer Care</h4>
            <ul className="space-y-3">
              <li><Link to="/contactus" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">Contact Us</Link></li>
              <li><Link to="/faq" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">FAQ</Link></li>
              <li><Link to="/shipping-info" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">Returns</Link></li>
              <li><Link to="/size-guide" className="text-deep-forest hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2">Size Guide</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gold-accent/40 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-forest text-sm">
            © 2024 Roven Beauty. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-forest hover:text-white text-sm transition-colors duration-300 hover:underline decoration-white/60">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-forest hover:text-white text-sm transition-colors duration-300 hover:underline decoration-white/60">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;