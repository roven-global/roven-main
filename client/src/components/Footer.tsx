import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Twitter,
  Instagram
} from "lucide-react";

const Footer = () => {
  const companyLinks = [
    { name: "About Us", href: "/about" },
    { name: "Shop All", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "Contact Us", href: "/contactus" },
  ];

  const helpLinks = [
    { name: "Customer Support", href: "/contactus" },
    { name: "FAQ", href: "/faq" },
    { name: "Shipping Info", href: "/shipping-info" },
    { name: "Returns", href: "/returns" },
  ];

  return (
    <footer className="bg-white text-primary border-t border-accent-green/20 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231D352D' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      <div
        className="mx-auto mt-4 px-4 sm:px-6 relative z-10"
        style={{ width: "90%", maxWidth: "1200px" }}
      >
        {/* Main Footer */}
        <div className="py-12 sm:py-16 lg:py-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Column 1: Company Branding and Social Media */}
          <div className="lg:col-span-1 text-center lg:text-left">
            <div className="mb-4 sm:mb-6">
              <Link
                to="/"
                className="font-sans text-2xl sm:text-3xl font-bold text-primary mb-4 block hover:text-accent-green transition-all duration-500 transform hover:scale-105"
              >
                Roven
              </Link>
            </div>

            <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-xs sm:text-sm px-4 lg:px-0">
              Premium beauty products crafted with natural ingredients to
              enhance your unique radiance. Discover the perfect blend of luxury
              and wellness.
            </p>

            <div className="flex gap-3 justify-center lg:justify-start">
              <a
                href="https://www.instagram.com/roven_beauty/"
                className="group w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-xl flex items-center justify-center hover:from-accent-green hover:to-accent-green/80 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-lg border border-accent-green/20 hover:border-accent-green"
              >
                <Instagram className="h-4 w-4 sm:h-5 sm:w-5 text-accent-green group-hover:text-white" />
              </a>
              <a
                href="#"
                className="group w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-primary/10 to-primary/20 rounded-xl flex items-center justify-center hover:from-primary hover:to-primary/80 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-lg border border-primary/20 hover:border-primary"
              >
                <Facebook className="h-4 w-4 sm:h-5 sm:w-5 text-primary group-hover:text-white" />
              </a>
              <a
                href="#"
                className="group w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-xl flex items-center justify-center hover:from-accent-green hover:to-accent-green/80 hover:scale-110 transition-all duration-300 shadow-sm hover:shadow-lg border border-accent-green/20 hover:border-accent-green"
              >
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5 text-accent-green group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Column 2: Company Links */}
          <div className="relative">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-accent-green/20 shadow-sm hover:shadow-md transition-all duration-300">
              <h4 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                COMPANY
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {companyLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-700 hover:text-primary transition-all duration-200 block text-xs sm:text-sm group flex items-center gap-2 justify-center lg:justify-start"
                    >
                      <span className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-primary transition-colors duration-200"></span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 3: Help Links */}
          <div className="relative">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-accent-green/20 shadow-sm hover:shadow-md transition-all duration-300">
              <h4 className="text-xs sm:text-sm font-bold text-accent-green uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                HELP
              </h4>
              <ul className="space-y-3 sm:space-y-4">
                {helpLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-700 hover:text-accent-green transition-all duration-200 block text-xs sm:text-sm group flex items-center gap-2 justify-center lg:justify-start"
                    >
                      <span className="w-1 h-1 bg-gray-400 rounded-full group-hover:bg-accent-green transition-colors duration-200"></span>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Column 4: Contact Details */}
          <div className="relative">
            <div className="bg-gradient-to-br from-accent-green/10 to-accent-green/20 rounded-2xl p-4 sm:p-6 border border-accent-green/20 shadow-sm hover:shadow-md transition-all duration-300">
              <h4 className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-4 sm:mb-6 flex items-center gap-2 justify-center lg:justify-start">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                CONTACT DETAILS
              </h4>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 group justify-center lg:justify-start">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Email
                    </p>
                    <a
                      href="mailto:support@rovenbeauty.com"
                      className="text-gray-700 hover:text-primary transition-colors duration-200 text-xs sm:text-sm font-medium"
                    >
                      support@rovenbeauty.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3 group justify-center lg:justify-start">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Phone
                    </p>
                    <a
                      href="tel:+1234567890"
                      className="text-gray-700 hover:text-primary transition-colors duration-200 text-xs sm:text-sm font-medium"
                    >
                      +1 (234) 567-8900
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 group justify-center lg:justify-start">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-1" />
                  <div className="text-center lg:text-left">
                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                      Address
                    </p>
                    <p className="text-gray-700 text-xs sm:text-sm font-medium leading-relaxed">
                      Premium Beauty Hub,
                      <br />
                      New York, NY 10001
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 sm:py-8 border-t border-accent-green/20 relative">
          <div className="text-center">
            <div className="text-gray-600 text-xs sm:text-sm px-4">
              © Copyright 2024, All Rights Reserved by
              <span className="font-semibold text-primary ml-1">
                Roven Beauty
              </span>
            </div>
            <div className="flex justify-center space-x-6 mt-4 text-xs sm:text-sm">
              <Link
                to="/privacy-policy"
                className="text-gray-600 hover:text-primary transition-colors duration-300 hover:underline decoration-primary/60"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms-of-service"
                className="text-gray-600 hover:text-primary transition-colors duration-300 hover:underline decoration-primary/60"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
