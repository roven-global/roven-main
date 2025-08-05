import React from "react";

const ShippingInfo = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Shipping Information</h1>
      <p className="mb-4 text-muted-foreground">We strive to deliver your order as quickly and safely as possible. Here are our shipping policies:</p>
      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>Standard shipping within India: 3-7 business days.</li>
        <li>Express shipping: 1-3 business days (extra charges apply).</li>
        <li>Free shipping on orders over ₹999.</li>
        <li>All orders are processed within 1-2 business days.</li>
        <li>Tracking information will be sent via email once your order ships.</li>
      </ul>
      <p className="mt-6 text-muted-foreground">If you have any questions about your shipment, please <a href="/contactus" className="text-primary underline">contact us</a>.</p>
    </div>
  );
};

export default ShippingInfo;