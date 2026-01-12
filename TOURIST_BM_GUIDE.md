# Tourist Buffer Margin (BM) Guide
## Trichy Gold Calculator - Sales Personnel Reference

---

## Overview
The Tourist BM system provides automatic buffer margins for international customers based on their currency, ensuring competitive pricing while maintaining profitability.

---

## Customer Type Selection

### **R - Resident**
- Manual buffer entry by salesperson
- Standard buffer rules apply
- Maximum reduction: **6 AED from tag price**
- Hard limit with alert (cannot proceed)

### **T - Tourist**
- Automatic buffer based on currency selection
- Pre-set values to show attractive discounts
- Flexible adjustment with warnings
- Reduction limits vary by currency

---

## Tourist Currency Buffer Map

| Currency Code | Full Name | Initial Buffer | Max Reduction | Notes |
|--------------|-----------|----------------|---------------|-------|
| **AM** | American Dollar (USD) | **35 AED** | 5 AED | High-value currency |
| **AFAM** | African American | **35 AED** | 5 AED | Special category |
| **S** | Singapore Dollar (SGD) | **20 AED** | 0 AED | **No reduction allowed** |
| **E** | Euro (EUR) | **35 AED** | 5 AED | European currency |
| **ES** | European/Spanish | **35 AED** | 5 AED | European category |
| **AF** | African | **35 AED** | 5 AED | African currencies |
| **AR** | Arab | **35 AED** | 5 AED | Arab region currencies |
| **O** | Others | **0 AED** | 5 AED | Unlisted currencies |
| **C** | Custom | **0 AED** | 5 AED | Custom pricing |

---

## How to Use - Step by Step

### **For Resident Customers:**
1. Select **R** button in BM section
2. Manually enter buffer value
3. System validates: Cannot reduce more than 6 AED
4. If exceeded, alert appears and input is blocked

### **For Tourist Customers:**
1. Select **T** button in BM section
2. Choose currency from dropdown (AM, S, E, etc.)
3. Buffer **automatically sets** to pre-defined value
4. Adjust if needed (see reduction rules below)

---

## Buffer Adjustment Rules

### **Automatic Buffer Setting:**
When you select a tourist currency:
```
Example: Select "AM" → Buffer automatically becomes 35 AED
Example: Select "S" → Buffer automatically becomes 20 AED
Example: Select "O" → Buffer automatically becomes 0 AED
```

### **Manual Adjustment After Selection:**

#### **For S Currency (Singapore):**
- **Initial**: 20 AED
- **Can increase**: Any positive value (e.g., 25, 30, 35...)
- **Cannot reduce**: Below 20 AED (0 reduction allowed)
- **Warning**: Appears if trying to reduce below 20 AED
- **Action**: Choose OK (proceed) or Cancel (revert)

#### **For All Other Currencies (AM, E, ES, AF, AR, AFAM, O, C):**
- **Initial**: 35 AED (or 0 for O/C)
- **Can increase**: Any positive value
- **Can reduce**: Up to 5 AED from initial value
  - AM: Can go down to 30 AED (35 - 5)
  - O: Can go down to -5 AED (0 - 5)
- **Warning**: Appears if exceeding 5 AED reduction
- **Action**: Choose OK (proceed) or Cancel (revert)

---

## Warning Dialog System

### **When Warning Appears:**
If you exceed the recommended reduction limit, a dialog box appears:

```
⚠️ WARNING: You are reducing more than X AED for [CURRENCY] currency!

This exceeds the recommended limit. Are you sure you want to proceed?

Click OK to continue or Cancel to revert.
```

### **Your Options:**
- **Click OK**: Value is accepted, calculation proceeds (use for special cases)
- **Click Cancel**: Input reverts to previous value (recommended)

---

## Practical Examples

### **Example 1: American Tourist (AM)**
```
1. Customer Type: T (Tourist)
2. Currency: AM
3. Auto Buffer: 35 AED
4. Tag Price: 40 AED/gm
5. Making Charge/gm: 40 + 35 = 75 AED/gm ✅

Adjustment:
- Want to give extra discount? Reduce to 32 AED ✅ (within 5 AED limit)
- Try to reduce to 28 AED ⚠️ (warning appears, can proceed if approved)
```

### **Example 2: Singapore Tourist (S)**
```
1. Customer Type: T (Tourist)
2. Currency: S
3. Auto Buffer: 20 AED
4. Tag Price: 40 AED/gm
5. Making Charge/gm: 40 + 20 = 60 AED/gm ✅

Adjustment:
- Want to increase? Change to 25 AED ✅ (allowed)
- Try to reduce to 18 AED ⚠️ (warning: cannot reduce for S currency)
```

### **Example 3: Other Currency (O)**
```
1. Customer Type: T (Tourist)
2. Currency: O
3. Auto Buffer: 0 AED
4. Tag Price: 40 AED/gm
5. Making Charge/gm: 40 + 0 = 40 AED/gm ✅

Adjustment:
- Can add discount: Change to -3 AED ✅ (within 5 AED reduction)
- Can add buffer: Change to 10 AED ✅ (allowed)
- Try to reduce to -8 AED ⚠️ (warning appears)
```

### **Example 4: Resident Customer (R)**
```
1. Customer Type: R (Resident)
2. Manual Entry: Enter buffer value
3. Tag Price: 40 AED/gm
4. Buffer: -4 AED (discount of 4 AED)
5. Making Charge/gm: 40 - 4 = 36 AED/gm ✅

Restriction:
- Try to enter -7 AED 🚫 (blocked with alert, cannot proceed)
- Maximum reduction: -6 AED only
```

---

## Best Practices

### **✅ DO:**
- Always select correct currency for tourist customers
- Use automatic buffer values for consistency
- Check warning dialogs before clicking OK
- Document special approvals if exceeding limits
- Verify total price before finalizing

### **❌ DON'T:**
- Mix up resident and tourist modes
- Ignore warning dialogs
- Exceed limits without supervisor approval
- Manually override without understanding impact
- Skip currency selection for tourists

---

## Common Scenarios

### **Scenario 1: Tourist wants extra discount**
- **Initial Buffer**: 35 AED (AM currency)
- **Customer Request**: More discount
- **Action**: Reduce buffer by up to 5 AED (to 30 AED) without warning
- **Beyond that**: Warning appears, get supervisor approval

### **Scenario 2: High-value purchase with VIP customer**
- **Initial Buffer**: 35 AED
- **Customer Status**: VIP/Bulk purchase
- **Action**: Can reduce further if warning is accepted
- **Recommendation**: Document reason for audit

### **Scenario 3: Singapore customer wants discount**
- **Initial Buffer**: 20 AED (S currency)
- **Limitation**: Cannot reduce (0 reduction allowed)
- **Alternative**: Offer other benefits (free cleaning, packaging, etc.)

### **Scenario 4: Currency not listed**
- **Selection**: Choose "O" (Others)
- **Initial Buffer**: 0 AED
- **Action**: Manually set appropriate buffer based on exchange rate
- **Flexibility**: Can adjust ±5 AED without warning

---

## Quick Reference Chart

### Buffer Adjustment Limits at a Glance:

```
Currency    Initial    Min Value    Max Reduction    Warning Threshold
--------    -------    ---------    -------------    -----------------
AM          35 AED     30 AED       5 AED            Below 30 AED
AFAM        35 AED     30 AED       5 AED            Below 30 AED
S           20 AED     20 AED       0 AED            Below 20 AED ⚠️
E           35 AED     30 AED       5 AED            Below 30 AED
ES          35 AED     30 AED       5 AED            Below 30 AED
AF          35 AED     30 AED       5 AED            Below 30 AED
AR          35 AED     30 AED       5 AED            Below 30 AED
O           0 AED      -5 AED       5 AED            Below -5 AED
C           0 AED      -5 AED       5 AED            Below -5 AED

RESIDENT    Manual     Tag-6        6 AED            Below -6 AED 🚫
```

---

## Troubleshooting

### **Issue: Warning keeps appearing**
- **Cause**: Exceeding reduction limit
- **Solution**: Stay within recommended limits or get approval

### **Issue: Cannot reduce buffer for S currency**
- **Cause**: S currency has 0 reduction limit
- **Solution**: Use initial 20 AED buffer or increase it

### **Issue: Buffer shows 0 for O/C currency**
- **Cause**: These currencies start at 0
- **Solution**: Manually set appropriate buffer

### **Issue: Resident mode shows alert, cannot proceed**
- **Cause**: Trying to reduce more than 6 AED
- **Solution**: Maximum reduction is -6 AED for residents

---

## System Logic Summary

```
IF Customer Type = "R" (Resident):
    → Manual buffer entry
    → Max reduction: -6 AED
    → Hard limit (cannot exceed)
    
ELSE IF Customer Type = "T" (Tourist):
    → Select currency code
    → Auto-set buffer from map
    → Can adjust within limits
    → Warning dialog if exceeding
    → Can proceed with OK button
```

---

## Contact & Support

For questions or special approvals:
- **Supervisor**: Check with floor manager for limits exceeding warnings
- **Technical Issues**: Contact IT support
- **Policy Questions**: Refer to management

---

## Version Information
- **Document Version**: 1.0
- **Last Updated**: October 8, 2025
- **System**: Trichy Gold Calculator PWA
- **Feature**: Tourist Buffer Margin (BM)

---

**© 2025 Trichy Gold - Internal Use Only**

