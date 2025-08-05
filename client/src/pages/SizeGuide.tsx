import React from "react";

const SizeGuide = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Size Guide</h1>
      <p className="mb-4 text-muted-foreground">Find your perfect fit! Use the chart below as a general guide. Sizing may vary by style.</p>
      <table className="w-full border mb-6">
        <thead>
          <tr className="bg-muted">
            <th className="py-2 px-4 border">Size</th>
            <th className="py-2 px-4 border">Chest (in)</th>
            <th className="py-2 px-4 border">Waist (in)</th>
            <th className="py-2 px-4 border">Hip (in)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 px-4 border">S</td>
            <td className="py-2 px-4 border">34-36</td>
            <td className="py-2 px-4 border">28-30</td>
            <td className="py-2 px-4 border">35-37</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border">M</td>
            <td className="py-2 px-4 border">38-40</td>
            <td className="py-2 px-4 border">32-34</td>
            <td className="py-2 px-4 border">39-41</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border">L</td>
            <td className="py-2 px-4 border">42-44</td>
            <td className="py-2 px-4 border">36-38</td>
            <td className="py-2 px-4 border">43-45</td>
          </tr>
          <tr>
            <td className="py-2 px-4 border">XL</td>
            <td className="py-2 px-4 border">46-48</td>
            <td className="py-2 px-4 border">40-42</td>
            <td className="py-2 px-4 border">47-49</td>
          </tr>
        </tbody>
      </table>
      <p className="text-muted-foreground">Tip: If you are between sizes, we recommend sizing up for a more relaxed fit.</p>
    </div>
  );
};

export default SizeGuide;