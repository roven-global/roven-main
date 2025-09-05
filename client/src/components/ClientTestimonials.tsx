import { Star } from "lucide-react";

const ClientTestimonials = () => {
  const testimonials = [
    {
      text: "Absolutely love the quality of products from Roven Global! The shipping was fast and the customer service is outstanding. Will definitely order again!",
      author: "Sarah Johnson",
      role: "Fashion Enthusiast",
      rating: 5,
    },
    {
      text: "The variety of products available is amazing. I found everything I was looking for in one place. Highly recommend this store!",
      author: "Michael Chen",
      role: "Online Shopper",
      rating: 5,
    },
    {
      text: "Great prices and even better quality! The checkout process was smooth and my order arrived exactly as described. Five stars!",
      author: "Emily Rodriguez",
      role: "Happy Customer",
      rating: 5,
    },
    {
      text: "Roven Global has become my go-to online store. The product descriptions are accurate and the return policy is very customer-friendly.",
      author: "David Thompson",
      role: "Loyal Customer",
      rating: 5,
    },
    {
      text: "Excellent shopping experience! The website is easy to navigate and the products are exactly what I expected. Will shop here again!",
      author: "Lisa Park",
      role: "Satisfied Buyer",
      rating: 5,
    },
    {
      text: "Fast delivery and great packaging. The quality of the items exceeded my expectations. Roven Global is now my favorite online store!",
      author: "James Wilson",
      role: "Repeat Customer",
      rating: 5,
    },
    {
      text: "The customer support team was incredibly helpful when I had questions about my order. Great service and amazing products!",
      author: "Maria Garcia",
      role: "Happy Shopper",
      rating: 5,
    },
    {
      text: "I've been shopping with Roven Global for months now and I'm never disappointed. The quality is consistent and the prices are fair.",
      author: "Robert Brown",
      role: "Long-time Customer",
      rating: 5,
    },
    {
      text: "The product selection is fantastic and the website is user-friendly. My orders always arrive on time and in perfect condition.",
      author: "Jennifer Lee",
      role: "Online Buyer",
      rating: 5,
    },
    {
      text: "Roven Global offers the best value for money. The products are high quality and the customer service is top-notch. Highly recommended!",
      author: "Christopher Davis",
      role: "Satisfied Customer",
      rating: 5,
    },
    {
      text: "Love the variety of products available. The search function works great and I can always find what I'm looking for. Great store!",
      author: "Amanda Taylor",
      role: "Frequent Shopper",
      rating: 5,
    },
    {
      text: "The checkout process is so easy and secure. I feel confident shopping here and the products always meet my expectations.",
      author: "Kevin Martinez",
      role: "Trusted Customer",
      rating: 5,
    },
    {
      text: "Excellent quality products at reasonable prices. The shipping is fast and the packaging is always secure. Will continue shopping here!",
      author: "Rachel Green",
      role: "Happy Customer",
      rating: 5,
    },
    {
      text: "Roven Global has everything I need in one place. The website is well-organized and the product photos are accurate. Love it!",
      author: "Daniel Kim",
      role: "Online Shopper",
      rating: 5,
    },
    {
      text: "The customer service is outstanding and the product quality is excellent. I've recommended Roven Global to all my friends!",
      author: "Nicole White",
      role: "Brand Advocate",
      rating: 5,
    },
  ];

  const getInitial = (author: string) => {
    if (!author) return "?";
    return author.charAt(0).toUpperCase();
  };

  // Create offset arrays for each column
  const testimonialsCol1 = testimonials;
  const testimonialsCol2 = testimonials
    .slice(1)
    .concat(testimonials.slice(0, 1));
  const testimonialsCol3 = testimonials
    .slice(2)
    .concat(testimonials.slice(0, 2));

  return (
    <section className="relative py-20 font-sans overflow-hidden bg-white">
      <div className="container mx-auto max-w-7xl px-0 md:px-8 pt-12">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-accent/20 text-primary rounded-full text-xs sm:text-sm font-medium mb-4">
            Customer Reviews
          </div>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            WHAT OUR <span className="text-primary">CUSTOMERS SAY</span>
          </h2>
          <p className="text-sm sm:text-lg text-foreground/70 mb-8 leading-relaxed max-w-2xl mx-auto">
            Discover why thousands of satisfied customers trust Roven Global for
            their shopping needs. Read authentic reviews from our valued
            customers.
          </p>
        </div>

        {/* Mobile View: Single Horizontal Scrolling Row */}
        <div className="block md:hidden">
          <div className="relative overflow-hidden">
            <div
              className="flex gap-6 animate-testimonials-scroll-horizontal"
              style={{ width: "max-content" }}
            >
              {/* Duplicate testimonials for seamless loop */}
              {testimonials.concat(testimonials).map((testimonial, i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-2xl shadow-lg p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:shadow-xl group min-w-[300px] max-w-[300px]"
                  tabIndex={0}
                  style={{ willChange: "transform" }}
                >
                  <div className="flex items-center mb-2">
                    {[...Array(testimonial.rating)].map((_, idx) => (
                      <Star
                        key={idx}
                        className="w-4 h-4 text-yellow-500 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed mb-4">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        {getInitial(testimonial.author)}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-xs sm:text-sm">
                        {testimonial.author}
                      </div>
                      <div className="text-xs sm:text-xs text-foreground/60">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop View: 3-Column Vertical Scrolling */}
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {/* Column 1: Down */}
          <div className="relative h-[500px] overflow-hidden testimonials-fade-mask">
            <div
              className="animate-testimonials-scroll-down flex flex-col gap-8 will-change-transform"
              style={{ animationDuration: "150s" }}
            >
              {testimonialsCol1
                .concat(testimonialsCol1)
                .map((testimonial, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-2xl shadow-lg p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                    tabIndex={0}
                    style={{ willChange: "transform" }}
                  >
                    <div className="flex items-center mb-2">
                      {[...Array(testimonial.rating)].map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-4 h-4 text-yellow-500 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed mb-4">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">
                          {getInitial(testimonial.author)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-xs sm:text-sm">
                          {testimonial.author}
                        </div>
                        <div className="text-xs sm:text-xs text-foreground/60">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Column 2: Up */}
          <div className="relative h-[500px] overflow-hidden testimonials-fade-mask">
            <div
              className="animate-testimonials-scroll-up flex flex-col gap-8 will-change-transform"
              style={{ animationDuration: "150s" }}
            >
              {testimonialsCol2
                .concat(testimonialsCol2)
                .map((testimonial, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-2xl shadow-lg p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                    tabIndex={0}
                    style={{ willChange: "transform" }}
                  >
                    <div className="flex items-center mb-2">
                      {[...Array(testimonial.rating)].map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-4 h-4 text-yellow-500 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed mb-4">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">
                          {getInitial(testimonial.author)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-xs sm:text-sm">
                          {testimonial.author}
                        </div>
                        <div className="text-xs sm:text-xs text-foreground/60">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          {/* Column 3: Down */}
          <div className="relative h-[500px] overflow-hidden testimonials-fade-mask">
            <div
              className="animate-testimonials-scroll-down flex flex-col gap-8 will-change-transform"
              style={{ animationDuration: "150s" }}
            >
              {testimonialsCol3
                .concat(testimonialsCol3)
                .map((testimonial, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-2xl shadow-lg p-6 flex flex-col gap-4 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                    tabIndex={0}
                    style={{ willChange: "transform" }}
                  >
                    <div className="flex items-center mb-2">
                      {[...Array(testimonial.rating)].map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-4 h-4 text-yellow-500 fill-current"
                        />
                      ))}
                    </div>
                    <p className="text-foreground/80 text-xs sm:text-sm leading-relaxed mb-4">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-sm">
                          {getInitial(testimonial.author)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground text-xs sm:text-sm">
                          {testimonial.author}
                        </div>
                        <div className="text-xs sm:text-xs text-foreground/60">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      {/* Required CSS for animations */}
      <style>{`
        @keyframes testimonials-scroll-down {
          0% { transform: translateY(-50%); }
          100% { transform: translateY(0); }
        }
        @keyframes testimonials-scroll-up {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes testimonials-scroll-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-testimonials-scroll-down {
          animation-name: testimonials-scroll-down;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .animate-testimonials-scroll-up {
          animation-name: testimonials-scroll-up;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .animate-testimonials-scroll-horizontal {
          animation-name: testimonials-scroll-horizontal;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-duration: 60s;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-testimonials-scroll-down, .animate-testimonials-scroll-up, .animate-testimonials-scroll-horizontal {
            animation: none !important;
          }
        }
        .testimonials-fade-mask {
          mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
        }
      `}</style>
    </section>
  );
};

export default ClientTestimonials;
