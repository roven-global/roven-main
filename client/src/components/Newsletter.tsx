import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Newsletter = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-sage/25 via-forest/10 to-sage/15">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-deep-forest mb-4">
            Join The Roven Club
          </h2>
          <p className="text-lg text-forest mb-8 text-balance">
            Subscribe to our newsletter for exclusive offers, beauty tips,
            and early access to new products.
          </p>

          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email address"
              className="h-12 flex-grow bg-white border-warm-taupe focus:ring-sage-light focus:border-sage-dark rounded-full"
            />
            <Button size="lg" className="bg-sage text-white hover:bg-forest transition-all duration-300 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Subscribe
            </Button>
          </form>

          <p className="text-sm text-forest/70 mt-4">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;