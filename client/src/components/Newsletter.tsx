import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Axios from "@/utils/Axios";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!email) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      const response = await Axios.post("/api/newsletter/subscribe", { email });
      setStatus("success");
      setMessage(response.data.message || "Thank you for subscribing!");
      setEmail("");
    } catch (error: any) {
      setStatus("error");
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage("Subscription failed. Please try again later.");
      }
      console.error(error);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/25 via-muted-brown/10 to-primary/15">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-sans text-4xl md:text-5xl font-bold text-foreground mb-4">
            Join The Roven Club
          </h2>
          <p className="text-lg text-foreground/70 mb-8 text-balance">
            Subscribe to our newsletter for exclusive offers, beauty tips, and
            early access to new products.
          </p>
          {status === "success" ? (
            <div className="text-center p-4 bg-accent-green/10 text-accent-green rounded-lg">
              <p className="font-semibold">{message}</p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                required
                className="h-12 flex-grow bg-white border-accent-green focus:ring-teal-vibrant focus:border-accent-green rounded-full"
              />
              <Button
                type="submit"
                size="lg"
                disabled={status === "loading"}
                className="bg-primary text-primary-foreground hover:bg-accent-green hover:text-white transition-all duration-300 rounded-full text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          )}

          {status === "error" && message && (
            <p className="text-sm text-destructive mt-4">{message}</p>
          )}

          {status !== "success" && (
            <p className="text-sm text-muted-brown/70 mt-4">
              We respect your privacy. Unsubscribe at any time.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
