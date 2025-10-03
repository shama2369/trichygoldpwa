// src/App.jsx
import { useState } from "react";

export default function App() {
  const [weight, setWeight] = useState("");
  const [tagPrice, setTagPrice] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [buffer, setBuffer] = useState("");
  const [cardFee, setCardFee] = useState("2.5");
  const [method, setMethod] = useState("cash");

  // --- Calculations ---
  const W = parseFloat(weight) || 0;
  const Mtag = parseFloat(tagPrice) || 0;
  const Pg = parseFloat(goldRate) || 0;
  const Ebuf = parseFloat(buffer) || 0;
  const f = (parseFloat(cardFee) || 0) / 100;

  const Mcash = Mtag + Ebuf;
  const Mtotal = W * Mcash;
  const Pcash = W * Pg + Mtotal;
  const Pcard = method === "card" ? Pcash / (1 - f) : Pcash;
  const cardFeeRecovered = method === "card" ? Pcard - Pcash : 0;
  const Mcard = method === "card" ? (Mtotal + cardFeeRecovered) / W : Mcash;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">💎 Jewellery Price Calculator</h1>

      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        <input
          type="number"
          placeholder="Weight (gm)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Tag Price / gm"
          value={tagPrice}
          onChange={(e) => setTagPrice(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Gold Rate / gm"
          value={goldRate}
          onChange={(e) => setGoldRate(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Buffer Margin / gm"
          value={buffer}
          onChange={(e) => setBuffer(e.target.value)}
          className="p-2 border rounded"
        />

        <div>
          <label className="block text-sm">Card Fee (%)</label>
          <input
            type="number"
            placeholder="2.5"
            value={cardFee}
            onChange={(e) => setCardFee(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="font-medium">Payment:</label>
          <button
            className={`px-4 py-2 rounded ${
              method === "cash" ? "bg-green-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setMethod("cash")}
          >
            Cash
          </button>
          <button
            className={`px-4 py-2 rounded ${
              method === "card" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setMethod("card")}
          >
            Card
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white shadow p-4 rounded w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">Result</h2>
        <p>💰 Cash Price: <b>{Pcash.toFixed(2)} AED</b></p>
        {method === "card" && (
          <>
            <p>💳 Card Price: <b>{Pcard.toFixed(2)} AED</b></p>
            <p>📈 Disguised Making/gm: <b>{Mcard.toFixed(2)} AED</b></p>
          </>
        )}
      </div>

      <button
        onClick={() => {
          const csv = `Weight,TagPrice/gm,GoldRate,Buffer,Method,Price\n${W},${Mtag},${Pg},${Ebuf},${method},${method==="cash"?Pcash:Pcard}`;
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "jewellery_pricing.csv";
          a.click();
        }}
        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
      >
        📤 Export to Sheets (CSV)
      </button>
    </div>
  );
}
