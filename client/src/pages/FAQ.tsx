import React from "react";

const faqs = [
  {
    question: "How do I place an order?",
    answer: "Browse our products, add items to your cart, and proceed to checkout. Follow the prompts to complete your purchase."
  },
  {
    question: "What payment methods are accepted?",
    answer: "We accept all major credit cards, UPI, and net banking."
  },
  {
    question: "How can I track my order?",
    answer: "Once your order ships, you will receive a tracking link via email."
  },
  {
    question: "Can I change or cancel my order?",
    answer: "Contact us as soon as possible. If your order hasn't shipped, we can assist with changes or cancellations."
  },
  {
    question: "Do you ship internationally?",
    answer: "Currently, we only ship within India."
  }
];

const FAQ = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {faqs.map((faq, idx) => (
          <div key={idx}>
            <h2 className="font-semibold text-lg mb-1">{faq.question}</h2>
            <p className="text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;