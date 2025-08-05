import React from "react";

const ContactUs = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="mb-6 text-muted-foreground">We'd love to hear from you! Fill out the form below or reach us at <a href="mailto:support@devthreads.com" className="text-primary underline">support@devthreads.com</a>.</p>
      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="block font-medium mb-1">Name</label>
          <input id="name" type="text" className="w-full border rounded px-3 py-2" placeholder="Your Name" required />
        </div>
        <div>
          <label htmlFor="email" className="block font-medium mb-1">Email</label>
          <input id="email" type="email" className="w-full border rounded px-3 py-2" placeholder="you@email.com" required />
        </div>
        <div>
          <label htmlFor="message" className="block font-medium mb-1">Message</label>
          <textarea id="message" className="w-full border rounded px-3 py-2" rows={5} placeholder="How can we help you?" required />
        </div>
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90">Send Message</button>
      </form>
      <div className="mt-8 text-sm text-muted-foreground">
        <p>Address: 123 DevThreads Lane, Code City, 12345</p>
        <p>Phone: (123) 456-7890</p>
      </div>
    </div>
  );
};

export default ContactUs;