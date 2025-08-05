import React from "react";

const Returns = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Returns & Exchanges</h1>
      <p className="mb-4 text-muted-foreground">We want you to love your purchase! If you're not satisfied, here's how to return or exchange an item:</p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Returns are accepted within 14 days of delivery.</li>
        <li>Items must be unused, unwashed, and in original packaging with tags attached.</li>
        <li>To initiate a return, email <a href="mailto:support@devthreads.com" className="text-primary underline">support@devthreads.com</a> with your order number and reason for return.</li>
        <li>Refunds are processed within 5-7 business days after we receive your return.</li>
        <li>Exchanges are subject to product availability.</li>
      </ul>
      <p className="mt-6 text-muted-foreground">For more details, please <a href="/contactus" className="text-primary underline">contact us</a>.</p>
    </div>
  );
};

export default Returns;