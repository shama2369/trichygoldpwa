// src/App.jsx
import { useState, useEffect } from "react";
import { createWorker } from 'tesseract.js';

export default function App() {
  const [weight, setWeight] = useState("");
  const [tagPrice, setTagPrice] = useState("");
  const [goldRate, setGoldRate] = useState("");
  const [buffer, setBuffer] = useState("");
  const [cardFee, setCardFee] = useState("2.5");
  const [discountPercent, setDiscountPercent] = useState("");
  const [method, setMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [jewelryType, setJewelryType] = useState("24K");
  const [storedPrices, setStoredPrices] = useState({
    "24K": 0,
    "22K": 0,
    "18K": 0
  });
  const [salesView, setSalesView] = useState(false);
  const [inputMode22K, setInputMode22K] = useState("weight"); // "weight" or "piece"
  const [exchangeRate, setExchangeRate] = useState("");
  const [currencyName, setCurrencyName] = useState("");
  const [conversionMode, setConversionMode] = useState("multiply"); // "multiply" or "divide"
  const [showTagPricePercent, setShowTagPricePercent] = useState(false);
  const [showBufferPercent, setShowBufferPercent] = useState(false);
  const [customerType, setCustomerType] = useState("R"); // "R" for Resident, "T" for Tourist
  const [touristCurrency, setTouristCurrency] = useState(""); // Currency code for tourist
  const [gold24KType, setGold24KType] = useState(""); // "chain", "local", "pamp", "valkambi"
  const [gold24KWeight, setGold24KWeight] = useState(""); // Selected weight option
  const [inputMode24K, setInputMode24K] = useState("weight"); // "weight" or "piece"
  const [customerType18K, setCustomerType18K] = useState("R"); // "R" for Resident, "T" for Tourist (18K)
  const [touristCurrency18K, setTouristCurrency18K] = useState(""); // Currency code for 18K tourist
  const [diamondPrice, setDiamondPrice] = useState(""); // Diamond price for DiamondG
  const [diamondCarat, setDiamondCarat] = useState(""); // Diamond carat for DiamondG
  const [itag, setItag] = useState(""); // Initial tag price for discount calculation

  // --- Calculations ---
  const W = parseFloat(weight) || 0;
  
  // Calculate tag price for DiamondG automatically
  const calculateDiamondGTagPrice = () => {
    if (jewelryType === "DiamondG") {
      // If weight is not entered, tag price is 0
      if (!weight || parseFloat(weight) === 0) {
        return 0;
      }
      const Pg = parseFloat(goldRate) || 0;
      const Dc = parseFloat(diamondCarat) || 0;
      // If carat is less than 0.50, diamond price is fixed at 450 AED
      const Dp = (Dc > 0 && Dc < 0.50) ? 450 : (parseFloat(diamondPrice) || 0);
      // Formula: (gms * gold_price + diamond_price * 3.65 * diamond_carat + gms * 55 + 20) * 5.3
      // Making charge: gms * 55 (since 15 * 3.65 = 54.75 ≈ 55)
      const totalCost = W * Pg + Dp * 3.65 * Dc + W * 55 + 20;
      return totalCost * 5.3;
    }
    return 0;
  };
  
  // Use calculated tag price for DiamondG, otherwise use entered tag price
  const Mtag = jewelryType === "DiamondG" 
    ? calculateDiamondGTagPrice() 
    : parseFloat(tagPrice) || 0;
  const discount = parseFloat(discountPercent) || 0;

  // Get appropriate gold price based on jewelry type
  const getGoldPrice = () => {
    if (jewelryType === "Diamond") {
      // For diamonds, use 22K price if available, otherwise 18K
      return storedPrices["22K"] || storedPrices["18K"] || parseFloat(goldRate) || 0;
    }
    if (jewelryType === "DiamondG") {
      // For DiamondG, use the entered gold price
      return parseFloat(goldRate) || 0;
    }
    return storedPrices[jewelryType] || parseFloat(goldRate) || 0;
  };
  
  const Pg = getGoldPrice();
  const Ebuf = parseFloat(buffer) || 0;
  const f = (parseFloat(cardFee) || 0) / 100;

  // Calculate adjusted discount for Diamond/DiamondG when customer doesn't pay ATF
  const calculateAdjustedDiscount = () => {
    if ((jewelryType === "Diamond" || jewelryType === "DiamondG") && method === "card" && Mtag > 0 && discount > 0) {
      // Current calculation with ATF
      const currentItemPrice = Mtag * (1 - discount / 100);
      const currentTotalPrice = currentItemPrice * 1.05;
      const currentATF = currentTotalPrice * f;
      const currentTotalBill = currentTotalPrice + currentATF;
      
      // Without ATF, target Total Price = current Total Bill
      const targetTotalPrice = currentTotalBill;
      const targetItemPrice = targetTotalPrice / 1.05;
      
      // Calculate required discount
      const requiredDiscount = ((Mtag - targetItemPrice) / Mtag) * 100;
      
      return {
        currentDiscount: parseFloat(discount) || 0,
        adjustedDiscount: requiredDiscount,
        currentTotalBill: currentTotalBill,
        targetTotalPrice: targetTotalPrice,
        discountDifference: (parseFloat(discount) || 0) - requiredDiscount
      };
    }
    return null;
  };

  // Calculate discount percentage from Itag to current item price
  const calculateDiscountFromItag = () => {
    if (!itag || parseFloat(itag) <= 0) return null;
    
    const itagValue = parseFloat(itag);
    let currentItemPrice = 0;
    
    if (jewelryType === "Diamond" || jewelryType === "DiamondG") {
      // Current item price after discount
      currentItemPrice = Mtag * (1 - discount / 100);
    } else {
      // For other types, use the final price calculation
      currentItemPrice = Pcash || 0;
    }
    
    if (currentItemPrice <= 0) return null;
    
    // Calculate discount percentage: ((Itag - ItemPrice) / Itag) * 100
    const discountPercent = ((itagValue - currentItemPrice) / itagValue) * 100;
    
    return {
      itag: itagValue,
      itemPrice: currentItemPrice,
      discountPercent: discountPercent,
      discountAmount: itagValue - currentItemPrice
    };
  };

  // Tourist currency buffer mapping (for 22K/24K)
  const touristBufferMap = {
    "AM": 35, "AFAM": 35,
    "S": 20,
    "E": 35, "ES": 35,
    "AF": 35,
    "AR": 35,
    "O": 0,
    "C": 0
  };

  // Tourist currency buffer mapping for 18K (different values)
  const touristBufferMap18K = {
    "AM": 25, "AFAM": 25,
    "S": 25,
    "E": 25, "ES": 25,
    "AF": 30,
    "AR": 30,
    "O": 0,
    "C": 0
  };

  // 24K per-piece pricing
  const gold24KPricing = {
    chain: {
      "20": 35,
      "40": 65,
      "80": 85,
      "100": 100
    },
    local: {
      "4": 10,
      "8": 15,
      "10": 20
    },
    pamp: {
      "1": 35,
      "2": 45,
      "4": 55,
      "50": 65,
      "100": 75
    },
    valkambi: {
      "1": 35,
      "2": 45,
      "4": 55,
      "50": 65,
      "100": 75
    }
  };

  // Get buffer value based on customer type
  const getBufferValue = () => {
    if (customerType === "T" && touristCurrency) {
      return touristBufferMap[touristCurrency] || 0;
    }
    return parseFloat(buffer) || 0;
  };

  // Auto-update percentage display when tagPrice or goldRate changes
  useEffect(() => {
    // This will trigger re-render when tagPrice or Pg changes
  }, [tagPrice, Pg]);

  // Diamond calculation logic
  if (jewelryType === "Diamond") {
    // Diamond: Tag Price → Discount % → Item Price → 5% VAT → Card Fee
    const discountedPrice = Mtag * (1 - discount / 100);
    const vatAmount = discountedPrice * 0.05;
    const subtotal = discountedPrice + vatAmount; // Total Price (Item Price + VAT)
    // For card: Total Price = Item Price + VAT, ATF = 2.5% of Total Price, Total Bill = Total Price + ATF
    const Pcard = method === "card" ? subtotal + (subtotal * f) : subtotal;
    const cardFeeAmount = method === "card" ? subtotal * f : 0; // ATF = 2.5% of Total Price
    
    // Export diamond-specific calculations
    window.diamondCalculations = {
      tagPrice: Mtag,
      discountPercent: discount,
      discountedPrice: discountedPrice,
      vatAmount: vatAmount,
      subtotal: subtotal,
      cardFeeAmount: cardFeeAmount,
      totalPrice: Pcard,
      totalWithVAT: subtotal
    };
  }

  // 24K Per-Piece calculation logic (uses adjustable TP)
  if (jewelryType === "24K" && inputMode24K === "piece" && gold24KType && gold24KWeight) {
    const basePrice = gold24KPricing[gold24KType][gold24KWeight] || 0;
    const finalPrice = parseFloat(tagPrice) || basePrice; // Use editable TP
    
    // Export 24K per-piece calculations (no VAT)
    window.gold24KPieceCalculations = {
      type: gold24KType,
      weight: gold24KWeight,
      basePrice: basePrice,
      finalPrice: finalPrice,
      totalPrice: finalPrice
    };
  }

  // Gold calculation logic (24K weight mode, 22K, 18K, DiamondG)
  // For DiamondG, Mtag is already the total item price (not per gram)
  let Mcash, Mtotal, totalMakingCharge, goldCost, vatBase, Pcash;
  
  if (jewelryType === "DiamondG") {
    // DiamondG: Mtag is the calculated tag price (before discount)
    // Calculation logic follows Diamond pattern (discount applied after tag price)
    goldCost = W * Pg; // Gold cost component
    vatBase = Mtag; // Tag price (before discount)
    Mcash = 0; // Not used for DiamondG
    Mtotal = 0; // Not used for DiamondG
    totalMakingCharge = 0; // Not used for DiamondG
    Pcash = Mtag; // Base price is the tag price
  } else {
    // Standard gold calculation (24K, 22K, 18K)
    Mcash = Mtag + Ebuf;
    
    // For 18K < 1 gm, making charge is per piece (not per gram)
    if (jewelryType === "18K" && W < 1) {
      // Making charge is per piece rate (TP + BM is the total making charge)
      Mtotal = Mcash; // This is the total making charge per piece
      totalMakingCharge = Mcash; // Total making charge is the piece rate
    } else {
      // Standard calculation: making charge per gram × weight
      Mtotal = W * Mcash;
      totalMakingCharge = W * Mcash;
    }
    
    Pcash = W * Pg + Mtotal;

    // Base calculation (gold cost + total making charge)
    goldCost = W * Pg;
    vatBase = goldCost + totalMakingCharge;
  }
  
  // Initialize variables
  let vatAmount, totalWithVAT, Pcard, cardFeeRecovered, Mcard;
  
  // DiamondG calculation (same as Diamond: Tag Price → Discount % → Item Price → 5% VAT → Card Fee)
  if (jewelryType === "DiamondG") {
    // DiamondG: Tag Price → Discount % → Item Price → 5% VAT → Card Fee
    const discountedPrice = Mtag * (1 - discount / 100);
    vatAmount = discountedPrice * 0.05;
    const subtotal = discountedPrice + vatAmount;
    Pcard = method === "card" ? subtotal / (1 - f) : subtotal;
    cardFeeRecovered = method === "card" ? Pcard - subtotal : 0;
    totalWithVAT = subtotal;
    Mcard = 0; // Not applicable for DiamondG
  } else if (jewelryType === "24K") {
  // 24K has NO VAT
    if (method === "card") {
      // Card calculation for 24K (NO VAT)
      const rawCardFeeRecovered = vatBase * f;
      const bufferAdjustment = 6;
      const adjustedDifference = Math.max(0, rawCardFeeRecovered - bufferAdjustment);
      Mcard = Mcash + (adjustedDifference / W);

      const disguisedMakingCharge = W * Mcard;
      const disguisedVatBase = goldCost + disguisedMakingCharge;

      vatAmount = 0; // NO VAT for 24K
      Pcard = disguisedVatBase; // NO VAT added
      cardFeeRecovered = adjustedDifference;
      totalWithVAT = Pcard;
    } else {
      // Cash calculation for 24K (NO VAT)
      vatAmount = 0; // NO VAT for 24K
      totalWithVAT = vatBase; // NO VAT added
      Pcard = totalWithVAT;
      cardFeeRecovered = 0;
      Mcard = Mcash;
    }
  } else {
    // Card calculation logic for 22K and 18K (WITH VAT)
    if (method === "card") {
      // ATF as percentage ONLY with 6 AED buffer on recovered fee
      console.log("Card Debug:", { vatBase, f, cardFee, jewelryType });
      
      // Calculate VAT on original subtotal first
      const originalVAT = vatBase * 0.05;
      const subtotalWithVAT = vatBase + originalVAT;
      
      // Calculate difference based on (Subtotal + VAT)
      const rawCardFeeRecovered = subtotalWithVAT * f;
      const bufferAdjustment = 6;
      const adjustedDifference = Math.max(0, rawCardFeeRecovered - bufferAdjustment);
      
      // For 18K < 1 gm, Mcard is per piece rate (not per gram)
      if (jewelryType === "18K" && W < 1) {
        Mcard = Mcash + adjustedDifference; // Per piece rate
      } else {
        Mcard = Mcash + (adjustedDifference / W); // Per gram rate
      }

      // Use disguised making charge for AT calculation
      const disguisedMakingCharge = (jewelryType === "18K" && W < 1) ? Mcard : W * Mcard;
      const disguisedVatBase = goldCost + disguisedMakingCharge;

      vatAmount = disguisedVatBase * 0.05;
      Pcard = disguisedVatBase + vatAmount; // no additional ATF add-on

      cardFeeRecovered = adjustedDifference;
      totalWithVAT = Pcard;
    } else {
      // Cash calculation (KT) - unchanged
      vatAmount = vatBase * 0.05;
      totalWithVAT = vatBase + vatAmount;
      Pcard = totalWithVAT;
      cardFeeRecovered = 0;
      Mcard = Mcash;
    }
  }

  // OCR Functions
  const handleImageUpload = async (event, type) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      await extractFromImage(file, type);
    }
  };

  const extractFromImage = async (imageFile, type) => {
    setIsProcessing(true);
    setOcrResult("");
    
    try {
      console.log(`Starting OCR processing for ${type}...`);
      const worker = await createWorker();
      console.log('Worker created successfully');
      
      // Configure OCR for better text recognition
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      // Set parameters for better recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:.- ',
        tessedit_pageseg_mode: '6', // Single uniform block of text
        tessedit_ocr_engine_mode: '1' // Neural nets LSTM engine
      });
      
      // Use the recognize method with better configuration
      const { data: { text } } = await worker.recognize(imageFile);
      console.log('OCR completed, extracted text:', text);
      
      await worker.terminate();
      console.log('Worker terminated');
      
      // Parse based on type
      if (type === 'weight') {
        const weight = extractWeight(text);
        if (weight) {
          setWeight(weight.toString());
          setOcrResult(`Weight extracted: ${weight} gm`);
        } else {
          setOcrResult('No weight found. Please try a clearer image or enter manually.');
        }
      } else if (type === 'tagPrice') {
        const tagPrice = extractTagPrice(text);
        if (tagPrice) {
          setTagPrice(tagPrice.toString());
          setOcrResult(`Tag price extracted: ${tagPrice} AED`);
        } else {
          setOcrResult('No tag price code found. Please try a clearer image or enter manually.');
        }
      }
      
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrResult(`OCR Error: ${error.message}. Please try a clearer image or use manual input.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const extractWeight = (text) => {
    console.log('Extracting weight from text:', text);
    
    // Clean up the text first
    const cleanText = text.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Cleaned text:', cleanText);
    
    // Look for patterns like "Wt: 2.00", "Weight: 2.00", "2.00 gm"
    const weightPatterns = [
      /Wt:\s*(\d+\.?\d*)/i,
      /Weight:\s*(\d+\.?\d*)/i,
      /(\d+\.?\d*)\s*gm/i,
      /Wt\s*(\d+\.?\d*)/i,  // More flexible Wt pattern
      /(\d+\.\d{2})/g  // Look for decimal numbers with 2 decimal places
    ];
    
    for (const pattern of weightPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const weight = parseFloat(match[1]);
        if (weight > 0 && weight < 1000) { // Reasonable weight range
          console.log('Found weight:', weight);
          return weight;
        }
      }
    }
    
    // Fallback: look for decimal numbers that could be weights
    const numbers = cleanText.match(/\d+\.?\d*/g) || [];
    console.log('All numbers found:', numbers);
    
    for (const num of numbers) {
      const weight = parseFloat(num);
      if (weight > 0 && weight < 1000 && (weight.toString().includes('.') || weight >= 1)) {
        console.log('Using fallback weight:', weight);
        return weight;
      }
    }
    
    console.log('No weight found');
    return null;
  };

  const extractTagPrice = (text) => {
    console.log('Extracting tag price from text:', text);
    
    // Clean up the text first
    const cleanText = text.replace(/[\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
    console.log('Cleaned text:', cleanText);
    
    // Look for patterns like "9298050" and extract middle 2 digits
    const codePatterns = [
      /(\d{7,})/g,  // 7 or more digits
      /(\d{6,})/g,  // 6 or more digits (fallback)
      /(\d{5,})/g   // 5 or more digits (fallback)
    ];
    
    for (const pattern of codePatterns) {
      const matches = cleanText.match(pattern);
      if (matches) {
        for (const code of matches) {
          console.log('Found code:', code);
          
          // Extract middle 2 digits and convert to decimal
          if (code.length >= 5) {
            const middleStart = Math.floor((code.length - 2) / 2);
            const middleDigits = code.substring(middleStart, middleStart + 2);
            const tagPrice = parseFloat(middleDigits) / 100; // Convert to decimal
            
            // Validate the extracted price (should be reasonable for jewelry)
            if (tagPrice > 0 && tagPrice < 100) {
              console.log('Extracted tag price:', tagPrice);
              return tagPrice;
            }
          }
        }
      }
    }
    
    // Fallback: look for any sequence of digits and try to extract
    const allNumbers = cleanText.match(/\d+/g) || [];
    console.log('All number sequences found:', allNumbers);
    
    for (const numStr of allNumbers) {
      if (numStr.length >= 5) {
        const middleStart = Math.floor((numStr.length - 2) / 2);
        const middleDigits = numStr.substring(middleStart, middleStart + 2);
        const tagPrice = parseFloat(middleDigits) / 100;
        
        if (tagPrice > 0 && tagPrice < 100) {
          console.log('Fallback tag price:', tagPrice);
          return tagPrice;
        }
      }
    }
    
    console.log('No tag price code found');
    return null;
  };


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-6">💎 Jewellery Price Calculator</h1>

      {/* Jewelry Type Selection - Primary Interface */}
      <div className="w-full max-w-md mb-6">
        <h2 className="text-lg font-semibold mb-4 text-center">Select Jewelry Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {["24K", "22K", "18K", "Diamond", "DiamondG"].map((type) => (
            <button
              key={type}
              onClick={() => {
                const previousType = jewelryType;
                
                // Reset values when switching jewelry types
                if (previousType !== type) {
                  setWeight("");
                  setTagPrice("");
                  setDiscountPercent("");
                  setBuffer("");
                  setDiamondPrice("");
                  setDiamondCarat("");
                  setItag("");
                  setGold24KType("");
                  setGold24KWeight("");
                  setInputMode24K("weight");
                  setInputMode22K("weight");
                  setTouristCurrency("");
                  setTouristCurrency18K("");
                  setCustomerType("R");
                  setCustomerType18K("R");
                  setOcrResult("");
                  setShowTagPricePercent(false);
                  setShowBufferPercent(false);
                }
                
                setJewelryType(type);
                // Update gold rate when switching types
                const price = storedPrices[type] || (type === "Diamond" ? storedPrices["22K"] || storedPrices["18K"] : 0);
                if (price) {
                  setGoldRate(price.toString());
                } else if (type !== "Diamond" && type !== "DiamondG") {
                  // Clear gold rate if no stored price and not Diamond/DiamondG
                  setGoldRate("");
                }
              }}
              className={`px-3 py-2 rounded text-sm font-medium transition-all ${
                jewelryType === type
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm border border-gray-200"
              }`}
            >
              <div className="font-black text-lg">{type}</div>
              {storedPrices[type] && (
                <div className="text-xs opacity-75 mt-1">
                  {storedPrices[type]} AED/gm
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="w-full max-w-md mb-3">
        <div className="bg-white rounded-lg p-2 shadow-sm border border-purple-200">
          <div className="text-center">
            <div className="text-lg mb-1">
              {jewelryType === "Diamond" || jewelryType === "DiamondG" ? "💎" : 
               jewelryType === "24K" ? "🪙" : 
               jewelryType === "22K" ? "📿" : 
               "💍"}
            </div>
            <div className="text-sm font-medium text-purple-700">
              {jewelryType}
            </div>
            <div className="text-xs text-gray-500">
              {jewelryType === "Diamond" 
                ? "Uses 22K or 18K gold price" 
                : jewelryType === "DiamondG"
                ? `Price: ${Pg > 0 ? `${Pg} AED/gm` : 'Not set'}`
                : `Price: ${Pg > 0 ? `${Pg} AED/gm` : 'Not set'}`}
            </div>
          </div>
        </div>
      </div>

      {/* OCR Processing Indicator */}
      {isProcessing && (
        <div className="w-full max-w-md mb-4">
          <div className="bg-white shadow p-4 rounded text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing image...</p>
          </div>
        </div>
      )}

      {/* OCR Result Display */}
      {ocrResult && (
        <div className="w-full max-w-md mb-4">
          <div className="bg-white shadow p-4 rounded">
            <h3 className="font-medium mb-2">📷 OCR Result:</h3>
            <p className="text-sm text-gray-700">{ocrResult}</p>
          </div>
        </div>
      )}

      {/* Calculator Form - Only show after type selection */}
      <div className="grid grid-cols-1 gap-4 w-full max-w-md">
        {/* 24K Input Mode Selection */}
        {jewelryType === "24K" && (
          <div>
            <label className="block text-sm font-medium mb-1">Input Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInputMode24K("weight");
                  setGold24KType("");
                  setGold24KWeight("");
                }}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode24K === "weight" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Weight (gms)
              </button>
              <button
                onClick={() => {
                  setInputMode24K("piece");
                  setGold24KType("");
                  setGold24KWeight("");
                }}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode24K === "piece" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Per Piece
              </button>
            </div>
          </div>
        )}

        {/* 24K Per Piece Type Selection */}
        {jewelryType === "24K" && inputMode24K === "piece" && (
          <div>
            <label className="block text-sm font-medium mb-1">24K Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setGold24KType("chain");
                  setGold24KWeight("");
                }}
                className={`px-3 py-2 text-sm rounded ${
                  gold24KType === "chain" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Chain
              </button>
              <button
                onClick={() => {
                  setGold24KType("local");
                  setGold24KWeight("");
                }}
                className={`px-3 py-2 text-sm rounded ${
                  gold24KType === "local" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Local
              </button>
              <button
                onClick={() => {
                  setGold24KType("pamp");
                  setGold24KWeight("");
                }}
                className={`px-3 py-2 text-sm rounded ${
                  gold24KType === "pamp" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Pamp
              </button>
              <button
                onClick={() => {
                  setGold24KType("valkambi");
                  setGold24KWeight("");
                }}
                className={`px-3 py-2 text-sm rounded ${
                  gold24KType === "valkambi" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Valkambi
              </button>
            </div>
          </div>
        )}

        {/* 24K Weight Selection for Per Piece */}
        {jewelryType === "24K" && inputMode24K === "piece" && gold24KType && (
          <div>
            <label className="block text-sm font-medium mb-1">Select Weight (gms)</label>
            <select
              value={gold24KWeight}
              onChange={(e) => {
                const selectedWeight = e.target.value;
                setGold24KWeight(selectedWeight);
                // Auto-set base TP when weight is selected
                if (selectedWeight && gold24KType) {
                  const baseTP = gold24KPricing[gold24KType][selectedWeight];
                  setTagPrice(baseTP.toString());
                }
              }}
              className="p-2 border rounded w-full"
            >
              <option value="">Select weight</option>
              {gold24KType === "chain" && (
                <>
                  <option value="20">20 gms - Base: 35 AED</option>
                  <option value="40">40 gms - Base: 65 AED</option>
                  <option value="80">80 gms - Base: 85 AED</option>
                  <option value="100">100 gms - Base: 100 AED</option>
                </>
              )}
              {gold24KType === "local" && (
                <>
                  <option value="4">4 gms - Base: 10 AED</option>
                  <option value="8">8 gms - Base: 15 AED</option>
                  <option value="10">10 gms - Base: 20 AED</option>
                </>
              )}
              {(gold24KType === "pamp" || gold24KType === "valkambi") && (
                <>
                  <option value="1">1 gm - Base: 35 AED</option>
                  <option value="2">2 gms - Base: 45 AED</option>
                  <option value="4">4 gms - Base: 55 AED</option>
                  <option value="50">50 gms - Base: 65 AED</option>
                  <option value="100">100 gms - Base: 75 AED</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* 22K Input Mode Selection */}
        {jewelryType === "22K" && (
          <div>
            <label className="block text-sm font-medium mb-1">Input Mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setInputMode22K("weight");
                  setTagPrice("");
                }}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode22K === "weight" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Weight (gms)
              </button>
              <button
                onClick={() => {
                  setInputMode22K("piece");
                  setTagPrice("25");
                }}
                className={`px-3 py-1 text-sm rounded ${
                  inputMode22K === "piece" 
                    ? "bg-purple-500 text-white" 
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                Piece Cost
              </button>
            </div>
          </div>
        )}

        {/* Weight Input with OCR - Always show */}
        <div>
            <label className="block text-sm font-medium mb-1">
              {jewelryType === "DiamondG" ? "wt in gms" : "Weight (Wt) - gm"}
            </label>
            <div className="flex gap-2">
        <input
          type="number"
                placeholder={jewelryType === "DiamondG" ? "Enter weight in grams" : "Enter weight in grams"}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
                className="p-2 border rounded flex-1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'weight')}
                className="hidden"
                id="weight-upload"
              />
              <label
                htmlFor="weight-upload"
                className="px-2 py-1 bg-purple-500 text-white rounded cursor-pointer hover:bg-purple-600 text-xs"
              >
              📷
            </label>
          </div>
        </div>

        {/* Gold Rate Input - Only for DiamondG (moved below weight) */}
        {jewelryType === "DiamondG" && (
          <div>
            <label className="block text-sm font-medium mb-1">Gold Price / gm (AED)</label>
            <input
              type="number"
              placeholder="Enter gold price"
              value={goldRate}
              onChange={(e) => setGoldRate(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
        )}

        {/* Tag Price Input with OCR - Hide for DiamondG (calculated automatically) */}
        {jewelryType !== "DiamondG" && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">
                {jewelryType === "Diamond"
                  ? "Tag Price"
                  : jewelryType === "22K" && inputMode22K === "piece" 
                  ? "Tag price (starts at 25)" 
                  : jewelryType === "24K" && inputMode24K === "piece"
                  ? "Tag price (Base price, adjustable)"
                  : jewelryType === "24K" || jewelryType === "22K" || jewelryType === "18K"
                  ? "Tag price"
                  : "TP - AED/gm"}
              </label>
              {jewelryType !== "Diamond" && (
                <button
                  type="button"
                  onClick={() => setShowTagPricePercent(!showTagPricePercent)}
                  className={`px-3 py-1 text-sm rounded border ${
                    showTagPricePercent 
                      ? "bg-purple-500 text-white border-purple-500" 
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  title={showTagPricePercent ? "Switch to AED/gm" : "Switch to % of gold rate"}
                >
                  {showTagPricePercent ? "AED" : "%"}
                </button>
              )}
            </div>
            <div className="flex gap-2">
          <input
            type="number"
                placeholder={
                  jewelryType === "Diamond"
                    ? "Enter tag price"
                    : showTagPricePercent 
                    ? "Enter % of gold rate" 
                    : jewelryType === "22K" && inputMode22K === "piece" 
                      ? "Starts at 25" 
                      : jewelryType === "24K" || jewelryType === "22K" || jewelryType === "18K"
                      ? "Enter tag price"
                      : "Enter TP"
                }
            value={
              jewelryType === "Diamond"
                ? tagPrice
                : showTagPricePercent 
                ? (Mtag > 0 && Pg > 0 ? ((Mtag / Pg) * 100).toFixed(2) : "")
                : tagPrice
            }
            onChange={(e) => {
              if (jewelryType === "Diamond") {
                // For Diamond, just store the tag price directly (not per gram)
                setTagPrice(e.target.value);
              } else if (showTagPricePercent) {
                // In percentage mode: user enters percentage, we calculate AED/gm
                const percent = parseFloat(e.target.value) || 0;
                const calculatedTagPrice = (Pg * percent / 100).toFixed(2);
                setTagPrice(calculatedTagPrice);
              } else {
                // In AED/gm mode: user enters AED/gm, we store it directly
                const value = parseFloat(e.target.value) || 0;
                
                // Piece cost validation for 22K
                if (jewelryType === "22K" && inputMode22K === "piece") {
                  if (method === "cash" && value < 20) {
                    alert("⚠️ Piece cost cannot be less than 20 AED for cash payment!");
                    return;
                  } else if (method === "card" && value < 30) {
                    alert("⚠️ Piece cost cannot be less than 30 AED for card payment!");
                    return;
                  }
                }
                
                setTagPrice(e.target.value);
              }
            }}
                className="p-2 border rounded flex-1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'tagPrice')}
                className="hidden"
                id="tagprice-upload"
              />
              <label
                htmlFor="tagprice-upload"
                className="px-2 py-1 bg-purple-500 text-white rounded cursor-pointer hover:bg-purple-600 text-xs"
              >
                📷
              </label>
            </div>
          </div>
        )}

        {/* Diamond Price and Carat Inputs - Only for DiamondG */}
        {jewelryType === "DiamondG" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Diamond Carat</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter diamond carat"
                value={diamondCarat}
                onChange={(e) => {
                  setDiamondCarat(e.target.value);
                  // If carat < 0.50, clear diamond price field (it's fixed at 450 internally)
                  const carat = parseFloat(e.target.value) || 0;
                  if (carat > 0 && carat < 0.50) {
                    setDiamondPrice(""); // Keep blank, but calculation uses 450
                  } else if (carat >= 0.50 && !diamondPrice) {
                    // Field becomes editable when carat >= 0.50
                    // Don't auto-set value, let user enter
                  }
                }}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Diamond Price</label>
              <input
                type="number"
                placeholder={parseFloat(diamondCarat) > 0 && parseFloat(diamondCarat) < 0.50 ? "Fixed" : "Enter price"}
                value={parseFloat(diamondCarat) > 0 && parseFloat(diamondCarat) < 0.50 ? "" : diamondPrice}
                onChange={(e) => {
                  // Only allow editing if carat >= 0.50
                  if (!(parseFloat(diamondCarat) > 0 && parseFloat(diamondCarat) < 0.50)) {
                    setDiamondPrice(e.target.value);
                  }
                }}
                disabled={parseFloat(diamondCarat) > 0 && parseFloat(diamondCarat) < 0.50}
                className={`p-2 border rounded w-full ${parseFloat(diamondCarat) > 0 && parseFloat(diamondCarat) < 0.50 ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </div>
            {/* Tag Price Display - Below Diamond Carat */}
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Tag Price</label>
                <span className="text-lg font-medium text-gray-800">
                  {Mtag > 0 ? Mtag.toFixed(2) : "0.00"} AED
                </span>
              </div>
            </div>
          </>
        )}

        {/* Discount Percent Input - Only for Diamond and DiamondG */}
        {(jewelryType === "Diamond" || jewelryType === "DiamondG") && (
          <div>
            <label className="block text-sm font-medium mb-1">Discount %</label>
            <input
              type="number"
              placeholder="Enter discount percentage (max 70%)"
              value={discountPercent}
              onChange={(e) => {
                // Allow typing any value - don't block input
                setDiscountPercent(e.target.value);
              }}
              onBlur={(e) => {
                // Validate when user finishes typing (on blur)
                const value = parseFloat(e.target.value);
                if (value > 70 && e.target.value !== "") {
                  alert("⚠️ Discount cannot be more than 70% for Diamond jewelry!");
                  setDiscountPercent("70");
                }
              }}
              className="p-2 border rounded w-full"
            />
            {parseFloat(discountPercent) > 70 && discountPercent !== "" && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ Maximum discount is 70%
              </div>
            )}
          </div>
        )}

        {/* Itag Input - Only for Diamond and DiamondG */}
        {(jewelryType === "Diamond" || jewelryType === "DiamondG") && (
          <div>
            <label className="block text-sm font-medium mb-1">Itag (Initial Tag Price)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Enter initial tag price"
              value={itag}
              onChange={(e) => setItag(e.target.value)}
              className="p-2 border rounded w-full"
            />
            {(() => {
              const itagCalc = calculateDiscountFromItag();
              if (itagCalc && itagCalc.discountPercent >= 0 && itagCalc.discountPercent <= 100) {
                return (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">Calculated Discount:</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Discount %:</span>
                      <span className="text-lg font-bold text-blue-700">
                        {itagCalc.discountPercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-600">Discount Amount:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {itagCalc.discountAmount.toFixed(2)} AED
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-600">Item Price:</span>
                      <span className="text-sm font-medium text-gray-800">
                        {itagCalc.itemPrice.toFixed(2)} AED
                      </span>
                    </div>
                  </div>
                );
              } else if (itagCalc && itagCalc.discountPercent < 0) {
                return (
                  <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                    <div className="text-xs text-red-600">
                      ⚠️ Item price ({itagCalc.itemPrice.toFixed(2)} AED) is higher than Itag ({itagCalc.itag.toFixed(2)} AED)
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Gold Rate Input - Only for Gold (24K, 22K, 18K) - DiamondG moved above */}
        {jewelryType !== "Diamond" && jewelryType !== "DiamondG" && (
          <div>
            <label className="block text-sm font-medium mb-1">Gold Rate / gm (AED)</label>
        <input
          type="number"
              placeholder="Enter current gold rate"
          value={goldRate}
          onChange={(e) => setGoldRate(e.target.value)}
              className="p-2 border rounded w-full"
            />
          </div>
        )}
        
        {/* BM Input - Only for Gold (24K, 22K, 18K) */}
        {jewelryType !== "Diamond" && jewelryType !== "DiamondG" && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium">BM - AED/gm</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (jewelryType === "18K") {
                      setCustomerType18K("R");
                    } else {
                      setCustomerType("R");
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    (jewelryType === "18K" ? customerType18K : customerType) === "R" 
                      ? "bg-purple-500 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  R
                </button>
                <button
                  onClick={() => {
                    if (jewelryType === "18K") {
                      setCustomerType18K("T");
                    } else {
                      setCustomerType("T");
                    }
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    (jewelryType === "18K" ? customerType18K : customerType) === "T" 
                      ? "bg-purple-500 text-white" 
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  T
                </button>
              </div>
            </div>
            
            {(jewelryType === "18K" ? customerType18K : customerType) === "R" ? (
              <input
                type="number"
                placeholder="Enter BM"
                value={buffer}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  // Different validation for 18K vs 22K/24K
                  const minLimit = jewelryType === "18K" ? -25 : -6;
                  const limitText = jewelryType === "18K" ? "25" : "6";
                  
                  if (value < minLimit && value !== 0) {
                    alert(`⚠️ Cannot reduce more than ${limitText} AED from tag price!`);
                  } else {
                    setBuffer(e.target.value);
                  }
                }}
                className="p-2 border rounded w-full"
              />
            ) : (
              <div>
                <select
                  value={jewelryType === "18K" ? touristCurrency18K : touristCurrency}
                  onChange={(e) => {
                    if (jewelryType === "18K") {
                      setTouristCurrency18K(e.target.value);
                    } else {
                      setTouristCurrency(e.target.value);
                    }
                    if (e.target.value) {
                      // Use 18K-specific buffer map for 18K, otherwise use standard map
                      const bufferMap = jewelryType === "18K" ? touristBufferMap18K : touristBufferMap;
                      setBuffer(bufferMap[e.target.value].toString());
                    }
                  }}
                  className="p-2 border rounded w-full mb-2"
                >
                  <option value="">Select Currency</option>
                  <option value="AM">AM</option>
                  <option value="AFAM">AFAM</option>
                  <option value="S">S</option>
                  <option value="E">E</option>
                  <option value="ES">ES</option>
                  <option value="AF">AF</option>
                  <option value="AR">AR</option>
                  <option value="O">O</option>
                  <option value="C">C</option>
                </select>
        <input
          type="number"
                  placeholder="Enter BM"
          value={buffer}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    const currentCurrency = jewelryType === "18K" ? touristCurrency18K : touristCurrency;
                    const maxReduction = currentCurrency === "S" ? 0 : 5;
                    if (value < -maxReduction && value !== 0) {
                      const proceed = window.confirm(
                        `⚠️ WARNING: You are reducing more than ${maxReduction} AED for ${currentCurrency} currency!\n\n` +
                        `This exceeds the recommended limit. Are you sure you want to proceed?\n\n` +
                        `Click OK to continue or Cancel to revert.`
                      );
                      if (proceed) {
                        setBuffer(e.target.value);
                      }
                    } else {
                      setBuffer(e.target.value);
                    }
                  }}
                  className="p-2 border rounded w-full"
                />
              </div>
            )}
            
            {jewelryType === "18K" && parseFloat(buffer) < -25 && parseFloat(buffer) !== 0 && customerType18K === "R" && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ Can't reduce more than 25 AED
              </div>
            )}
            {jewelryType !== "18K" && parseFloat(buffer) < -6 && parseFloat(buffer) !== 0 && customerType === "R" && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ Can't reduce more
              </div>
            )}
          </div>
        )}

        {/* Making Charge Display with Percentage Toggle - Only for Gold (24K, 22K, 18K) */}
        {jewelryType !== "Diamond" && jewelryType !== "DiamondG" && (
          <div className="bg-white border border-gray-200 rounded p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-gray-700">Making Charge/gm:</span>
              <button
                type="button"
                onClick={() => setShowBufferPercent(!showBufferPercent)}
                className={`px-3 py-1 text-sm rounded border ${
                  showBufferPercent 
                    ? "bg-purple-500 text-white border-purple-500" 
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                title={showBufferPercent ? "Switch to AED/gm" : "Switch to % of gold rate"}
              >
                {showBufferPercent ? "AED" : "%"}
              </button>
            </div>
            <div className="text-right text-lg text-gray-800">
              {showBufferPercent 
                ? (() => {
                    const total = Mtag + parseFloat(buffer || 0);
                    const percentage = Pg > 0 ? (total / Pg * 100) : 0;
                    return `${percentage.toFixed(2)}% of gold rate`;
                  })()
                : `${Mcash.toFixed(2)} AED`
              }
            </div>
          </div>
        )}

        {/* ATF Input - Always show for non-Diamond */}
        {jewelryType !== "Diamond" && (
        <div>
            <label className="block text-sm">ATF</label>
          <input
            type="number"
              placeholder="Enter ATF %"
            value={cardFee}
            onChange={(e) => setCardFee(e.target.value)}
            className="p-2 border rounded w-full"
          />
        </div>
        )}

        {/* Payment Method - Always show */}
        <div className="flex items-center gap-4">
          <button
            className={`px-3 py-1 rounded text-sm ${
              method === "cash" ? "bg-purple-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setMethod("cash")}
          >
            KT
          </button>
          <button
            className={`px-3 py-1 rounded text-sm ${
              method === "card" ? "bg-purple-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setMethod("card")}
          >
            AT
            </button>
        </div>

      {/* Sales View Toggle - Always show */}
      <div className="flex items-center justify-start">
        <div className="bg-white rounded-lg p-1 shadow-md border border-gray-200">
          <button
            onClick={() => setSalesView(!salesView)}
            className={`px-4 py-1 rounded-md text-xs font-medium transition-all duration-200 ${
              salesView
                ? "bg-purple-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {salesView ? "S View" : "C View"}
          </button>
        </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow p-4 rounded w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">💎 {jewelryType} Calculation Result</h2>
        <div className="space-y-2">
          {jewelryType === "24K" && inputMode24K === "piece" && gold24KType && gold24KWeight ? (
            // 24K Per-Piece calculation display (NO VAT)
            <>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium capitalize">{gold24KType}</span>
              </div>
              <div className="flex justify-between">
                <span>Weight:</span>
                <span className="font-medium">{gold24KWeight} gms</span>
              </div>
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span className="font-medium">{gold24KPricing[gold24KType][gold24KWeight]} AED</span>
              </div>
              {parseFloat(tagPrice) !== gold24KPricing[gold24KType][gold24KWeight] && (
                <div className="flex justify-between">
                  <span>Adjusted TP:</span>
                  <span className="font-medium text-orange-600">{parseFloat(tagPrice).toFixed(2)} AED</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total Price:</span>
                <span className="font-bold text-lg text-purple-600">
                  {(parseFloat(tagPrice) || gold24KPricing[gold24KType][gold24KWeight]).toFixed(2)} AED
                </span>
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                ✓ No VAT applicable for 24K per-piece
              </div>
            </>
          ) : jewelryType === "Diamond" ? (
            // Diamond calculation display
            <>
              <div className="flex justify-between">
                <span>Tag Price:</span>
                <span className="font-medium">{Mtag.toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({discount}%):</span>
                <span className="font-medium">-{(Mtag * discount / 100).toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Item Price (after discount):</span>
                <span className="font-medium">{(Mtag * (1 - discount / 100)).toFixed(2)} AED</span>
              </div>
              {/* Itag Discount Calculation Display */}
              {(() => {
                const itagCalc = calculateDiscountFromItag();
                if (itagCalc && itagCalc.discountPercent >= 0 && itagCalc.discountPercent <= 100) {
                  return (
                    <div className="flex justify-between mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                      <span className="text-sm">Discount from Itag ({itagCalc.itag.toFixed(2)} AED):</span>
                      <span className="text-sm font-bold text-blue-700">
                        {itagCalc.discountPercent.toFixed(2)}%
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
              <hr className="my-2" />
              {method === "cash" && (
                <>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-gray-700">{(Mtag * (1 - discount / 100)).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (5%):</span>
                    <span className="font-medium">{((Mtag * (1 - discount / 100)) * 0.05).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span>Total Bill (KT):</span>
                    <span className="text-yellow-700">{((Mtag * (1 - discount / 100)) * 1.05).toFixed(2)} AED</span>
                  </div>
                </>
              )}
              {method === "card" && (
                <>
                  <div className="flex justify-between">
                    <span>VAT (5%):</span>
                    <span className="font-medium">{((Mtag * (1 - discount / 100)) * 0.05).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-gray-700">{((Mtag * (1 - discount / 100)) * 1.05).toFixed(2)} AED</span>
                  </div>
                  {salesView && (
                    <div className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                      <span className="text-gray-700">📈 ATF:</span>
                      <span className="font-medium text-gray-800">{(((Mtag * (1 - discount / 100)) * 1.05) * f).toFixed(2)} AED</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span>Total Bill (AT):</span>
                    <span className="text-yellow-700">{(((Mtag * (1 - discount / 100)) * 1.05) * (1 + f)).toFixed(2)} AED</span>
                  </div>
                  {/* Adjusted Discount Calculator (No ATF) - Only in Sales View */}
                  {salesView && (() => {
                    const adjusted = calculateAdjustedDiscount();
                    if (adjusted && adjusted.adjustedDiscount >= 0 && adjusted.adjustedDiscount <= 100) {
                      return (
                        <div className="flex justify-between text-sm mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-gray-700">Adj Dis:</span>
                          <span className="font-bold text-gray-800">{adjusted.adjustedDiscount.toFixed(2)}%</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </>
          ) : jewelryType === "DiamondG" ? (
            // DiamondG calculation display (same as Diamond)
            <>
              <div className="flex justify-between">
                <span>Tag Price:</span>
                <span className="font-medium">{Mtag.toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({discount}%):</span>
                <span className="font-medium">-{(Mtag * discount / 100).toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Item Price (after discount):</span>
                <span className="font-medium">{(Mtag * (1 - discount / 100)).toFixed(2)} AED</span>
              </div>
              <hr className="my-2" />
              {method === "cash" && (
                <>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-gray-700">{(Mtag * (1 - discount / 100)).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (5%):</span>
                    <span className="font-medium">{((Mtag * (1 - discount / 100)) * 0.05).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span>Total Bill (KT):</span>
                    <span className="text-yellow-700">{((Mtag * (1 - discount / 100)) * 1.05).toFixed(2)} AED</span>
                  </div>
                </>
              )}
              {method === "card" && (
                <>
                  <div className="flex justify-between">
                    <span>VAT (5%):</span>
                    <span className="font-medium">{((Mtag * (1 - discount / 100)) * 0.05).toFixed(2)} AED</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price:</span>
                    <span className="text-gray-700">{((Mtag * (1 - discount / 100)) * 1.05).toFixed(2)} AED</span>
                  </div>
                  {salesView && (
                    <div className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                      <span className="text-gray-700">📈 ATF:</span>
                      <span className="font-medium text-gray-800">{(((Mtag * (1 - discount / 100)) * 1.05) * f).toFixed(2)} AED</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold bg-yellow-50 p-2 rounded border border-yellow-200">
                    <span>Total Bill (AT):</span>
                    <span className="text-yellow-700">{(((Mtag * (1 - discount / 100)) * 1.05) * (1 + f)).toFixed(2)} AED</span>
                  </div>
                  {/* Adjusted Discount Calculator (No ATF) - Only in Sales View */}
                  {salesView && (() => {
                    const adjusted = calculateAdjustedDiscount();
                    if (adjusted && adjusted.adjustedDiscount >= 0 && adjusted.adjustedDiscount <= 100) {
                      return (
                        <div className="flex justify-between text-sm mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                          <span className="text-gray-700">Adj Dis:</span>
                          <span className="font-bold text-gray-800">{adjusted.adjustedDiscount.toFixed(2)}%</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              )}
            </>
          ) : (
            // Gold calculation display (24K, 22K, 18K)
            <>
              <div className="flex justify-between">
                <span>Gold Rate ({jewelryType}):</span>
                <span className="font-medium">{Pg.toFixed(2)} AED/gm</span>
              </div>
              <div className="flex justify-between">
                <span>Weight (Wt):</span>
                <span className="font-medium">{W} gm</span>
              </div>
              <div className="flex justify-between">
                <span>Gold Cost:</span>
                <span className="font-medium">{goldCost.toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>{jewelryType === "18K" && W < 1 ? "Making Charge/pc:" : "Making Charge/gm:"}</span>
                <span className="font-medium">{method === "card" ? Mcard.toFixed(2) : Mcash.toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Total Making Charge:</span>
                <span className="font-medium">{method === "card" ? ((jewelryType === "18K" && W < 1) ? Mcard.toFixed(2) : (W * Mcard).toFixed(2)) : totalMakingCharge.toFixed(2)} AED</span>
              </div>
              <div className="flex justify-between">
                <span>Item Price:</span>
                <span className="font-medium">{method === "card" ? (goldCost + ((jewelryType === "18K" && W < 1) ? Mcard : (W * Mcard))).toFixed(2) : vatBase.toFixed(2)} AED</span>
              </div>
              {jewelryType !== "24K" && (
                <div className="flex justify-between">
                  <span>VAT (5%):</span>
                  <span className="font-medium">{vatAmount.toFixed(2)} AED</span>
                </div>
              )}
              {jewelryType === "24K" && (
                <div className="flex justify-between">
                  <span>VAT:</span>
                  <span className="font-medium text-green-600">0.00 AED (No VAT for 24K)</span>
                </div>
              )}
              <hr className="my-2" />
              {method === "cash" && (
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Price (KT):</span>
                  <span className="text-gray-700">{totalWithVAT.toFixed(2)} AED</span>
                </div>
              )}
        {method === "card" && (
          <>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Price (AT):</span>
                    <span className="text-gray-700">{Pcard.toFixed(2)} AED</span>
                  </div>
                  {salesView && (
                    <>
                      <div className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                        <span className="text-gray-700">Making Charge/gm:</span>
                        <span className="font-medium text-gray-800">{Mcash.toFixed(2)} AED</span>
                      </div>
                      <div className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                        <span className="text-gray-700">📈 D Making/gm:</span>
                        <span className="font-medium text-gray-800">{Mcard.toFixed(2)} AED</span>
                      </div>
                      <div className="flex justify-between text-sm bg-white p-2 rounded border border-gray-200">
                        <span className="text-gray-700">Difference:</span>
                        <span className="font-medium text-gray-800">{Math.max(Mtotal + cardFeeRecovered, Mtotal).toFixed(2)} - {Math.min(Mtotal + cardFeeRecovered, Mtotal).toFixed(2)} = {Math.abs(cardFeeRecovered).toFixed(2)} AED</span>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Currency Conversion Section */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="text-sm font-medium mb-2">Currency Conversion</div>
                
                {/* Conversion Mode Selection */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() => setConversionMode("multiply")}
                    className={`px-3 py-1 text-xs rounded flex-1 ${
                      conversionMode === "multiply" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    × Multiply (INR, PKR, etc.)
                  </button>
                  <button
                    onClick={() => setConversionMode("divide")}
                    className={`px-3 py-1 text-xs rounded flex-1 ${
                      conversionMode === "divide" 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    ÷ Divide (GBP, USD, etc.)
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs mb-1">Currency</label>
                    <input
                      type="text"
                      placeholder={conversionMode === "multiply" ? "INR, PKR" : "GBP, USD"}
                      value={currencyName}
                      onChange={(e) => setCurrencyName(e.target.value)}
                      className="p-1 border rounded w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">
                      {conversionMode === "multiply" ? "1 AED = ?" : "1 " + (currencyName || "Currency") + " = ? AED"}
                    </label>
                    <input
                      type="number"
                      placeholder={conversionMode === "multiply" ? "e.g., 22.5" : "e.g., 4.8"}
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(e.target.value)}
                      className="p-1 border rounded w-full text-sm"
                    />
                  </div>
                </div>
                {exchangeRate && parseFloat(exchangeRate) > 0 && (
                  <div className="flex justify-between text-sm font-bold bg-white p-2 rounded border border-blue-300">
                    <span>Total in {currencyName}:</span>
                    <span className="text-blue-700">
                      {conversionMode === "multiply" 
                        ? ((method === "card" ? Pcard : totalWithVAT) * parseFloat(exchangeRate)).toFixed(2)
                        : ((method === "card" ? Pcard : totalWithVAT) / parseFloat(exchangeRate)).toFixed(2)
                      } {currencyName}
                    </span>
                  </div>
                )}
              </div>
          </>
        )}
        </div>
      </div>

      {/* Stored Gold Prices */}
      {(storedPrices["24K"] || storedPrices["22K"] || storedPrices["18K"]) && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded p-4 w-full max-w-md">
          <h3 className="text-sm font-semibold text-green-800 mb-2">💰 Stored Gold Prices:</h3>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {["24K", "22K", "18K"].map((karat) => (
              <div key={karat} className="text-center">
                <div className="font-medium text-green-700">{karat}</div>
                <div className="text-green-600">
                  {storedPrices[karat] ? `${storedPrices[karat]} AED` : "N/A"}
                </div>
                <button
                  onClick={() => {
                    const newPrice = prompt(`Enter correct ${karat} price:`, storedPrices[karat] || '');
                    if (newPrice && !isNaN(parseFloat(newPrice))) {
                      setStoredPrices(prev => ({ ...prev, [karat]: parseFloat(newPrice) }));
                      if (jewelryType === karat) {
                        setGoldRate(newPrice);
                      }
                    }
                  }}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-green-600">
            Current: <strong>{jewelryType}</strong> - {Pg.toFixed(2)} AED/gm
          </div>
        </div>
      )}

      {/* OCR Results */}
      {ocrResult && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 w-full max-w-md">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">📄 Extracted Text:</h3>
          <div className="text-xs text-blue-700 bg-white p-2 rounded border max-h-32 overflow-y-auto">
            {ocrResult}
          </div>
          <button
            onClick={() => setOcrResult("")}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
      )}

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
