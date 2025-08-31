import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-primary via-primary-light to-muted-brown border-t border-accent/40 shadow-elegant">
      <div className="container mx-auto px-4 py-12">
        {/* Keep layout same across screen sizes */}
        <div className="grid grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link
              to="/"
              className="font-sans text-2xl sm:text-3xl font-bold text-foreground mb-4 block hover:text-white transition-all duration-500 transform hover:scale-105"
            >
              Roven
            </Link>
            <p className="text-foreground mb-6 max-w-md leading-relaxed text-xs sm:text-sm md:text-base">
              Premium beauty products crafted with natural ingredients to
              enhance your unique radiance. Discover the perfect blend of luxury
              and wellness.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/roven_beauty/"
                className="text-muted-brown hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="#"
                className="text-muted-brown hover:text-white transition-all duration-300 transform hover:scale-110 hover:-rotate-3"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="#"
                className="text-muted-brown hover:text-white transition-all duration-300 transform hover:scale-110 hover:rotate-3"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
              <a
                href="#"
                className="text-muted-brown hover:text-white transition-all duration-300 transform hover:scale-110 hover:-rotate-3"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4 sm:h-5 sm:w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-semibold text-foreground mb-4 text-sm sm:text-lg border-b border-accent/30 pb-2">
              Quick Links
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm md:text-base">
              <li>
                <Link
                  to="/shop"
                  className="text-foreground hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2"
                >
                  Shop All
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-foreground hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2"
                >
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h2 className="font-semibold text-foreground mb-4 text-sm sm:text-lg border-b border-accent/30 pb-2">
              Customer Care
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm md:text-base">
              <li>
                <Link
                  to="/contactus"
                  className="text-foreground hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-foreground hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping-info"
                  className="text-foreground hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  to="/returns"
                  className="text-foreground hover:text-white transition-all duration-300 hover:pl-2 block border-l-2 border-transparent hover:border-white/60 pl-2"
                >
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-accent/40 pt-8 flex flex-row justify-between items-center">
          <p className="text-white text-xs sm:text-sm">
            © 2024 Roven Beauty. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-0 text-xs sm:text-sm">
            <Link
              to="/"
              className="text-white hover:text-white transition-colors duration-300 hover:underline decoration-white/60"
            >
              Privacy Policy
            </Link>
            <Link
              to="/"
              className="text-white hover:text-white transition-colors duration-300 hover:underline decoration-white/60"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
