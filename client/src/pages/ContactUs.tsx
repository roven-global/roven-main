import React from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactUs = () => {
  return (
    <div className="bg-warm-cream">
      <Navigation />
      <div className="container mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="font-sans text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Get in Touch
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-brown">
              We're here to help and answer any question you might have.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start">
            {/* Contact Form */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4 sm:mb-6">
                Send us a Message
              </h2>
              <form className="space-y-4 sm:space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block font-medium text-muted-brown mb-2"
                  >
                    Full Name
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block font-medium text-muted-brown mb-2"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block font-medium text-muted-brown mb-2"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    rows={5}
                    placeholder="How can we help you?"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-primary text-white hover:bg-muted-brown rounded-full"
                >
                  Send Message
                </Button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Email Us
                  </h3>
                  <p className="text-muted-brown">
                    Reach out to us via email for any inquiries.
                  </p>
                  <a
                    href="mailto:support@roven.com"
                    className="text-primary font-medium hover:underline"
                  >
                    support@roven.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-full">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Call Us
                  </h3>
                  <p className="text-muted-brown">
                    Our team is available during business hours.
                  </p>
                  <a
                    href="tel:+1234567890"
                    className="text-primary font-medium hover:underline"
                  >
                    (123) 456-7890
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-primary/20 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    Visit Us
                  </h3>
                  <p className="text-muted-brown">
                    123 Beauty Lane, Suite 100
                    <br />
                    Wellness City, 12345
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
