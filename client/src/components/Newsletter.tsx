import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Newsletter = () => {
  return (
    <section className="py-16 bg-gradient-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-4">
            Stay Beautiful
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Subscribe to our newsletter for exclusive offers, beauty tips, 
            and early access to new products.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
            <Button variant="luxury" className="whitespace-nowrap">
              Subscribe
            </Button>
          </div>
          
          <p className="text-sm text-white/70 mt-4">
            Unsubscribe at any time. We respect your privacy.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;