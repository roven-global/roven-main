import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-warm-cream border-t border-warm-taupe/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-playfair text-3xl font-bold text-deep-forest mb-4 block">
              Roven
            </Link>
            <p className="text-forest mb-6 max-w-md">
              Premium beauty products crafted with natural ingredients to enhance
              your unique radiance. Discover the perfect blend of luxury and wellness.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/roven_beauty/" className="text-forest hover:text-sage transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-forest hover:text-sage transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-forest hover:text-sage transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-forest hover:text-sage transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-deep-forest mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/shop" className="text-forest hover:text-sage transition-colors">Shop All</Link></li>
              <li><Link to="/about" className="text-forest hover:text-sage transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-deep-forest mb-4">Customer Care</h4>
            <ul className="space-y-2">
              <li><Link to="/contactus" className="text-forest hover:text-sage transition-colors">Contact Us</Link></li>
              <li><Link to="/faq" className="text-forest hover:text-sage transition-colors">FAQ</Link></li>
              <li><Link to="/shipping-info" className="text-forest hover:text-sage transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-forest hover:text-sage transition-colors">Returns</Link></li>
              <li><Link to="/size-guide" className="text-forest hover:text-sage transition-colors">Size Guide</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-warm-taupe/50 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-forest/80 text-sm">
            © 2024 Roven Beauty. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-forest/80 hover:text-sage text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-forest/80 hover:text-sage text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;