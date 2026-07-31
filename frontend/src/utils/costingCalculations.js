/**
 * Calculates textile formulas for the Costing Sheet.
 */

export const calculateTotalEnds = (epi, width) => {
    return (parseFloat(epi) || 0) * (parseFloat(width) || 0);
};
  
export const calculateWarpGLM = (totalEnds, count1, count2, crimp) => {
    // Formula approximation for GLM (Grams per Linear Meter)
    // 0.5905 is a conversion factor for English Cotton Count (Ne) to Tex/GLM
    // GLM = (Total Ends / Count) * 0.5905 * (1 + Crimp%)
    const ends = parseFloat(totalEnds) || 0;
    const c1 = parseFloat(count1) || 1; // avoid division by zero
    const c_pct = (parseFloat(crimp) || 0) / 100;
    
    return (ends / c1) * 0.5905 * (1 + c_pct);
};

export const calculateWeftGLM = (ppi, width, count, crimp) => {
    // GLM = (PPI * Width / Count) * 0.5905 * (1 + Crimp%)
    const p = parseFloat(ppi) || 0;
    const w = parseFloat(width) || 0;
    const c = parseFloat(count) || 1;
    const c_pct = (parseFloat(crimp) || 0) / 100;
    
    return ((p * w) / c) * 0.5905 * (1 + c_pct);
};
  
export const calculateGSM = (warpGLM, weftGLM, width) => {
    const wGLM = parseFloat(warpGLM) || 0;
    const weGLM = parseFloat(weftGLM) || 0;
    const w = parseFloat(width) || 1; // avoid div by zero
    
    // Convert inches to meters (width * 0.0254) for GSM calculation
    return (wGLM + weGLM) / (w * 0.0254);
};

export const calculateOunce = (gsm) => {
    // 1 GSM = 0.0294935 oz/yd2
    return (parseFloat(gsm) || 0) * 0.0294935;
};
  
export const calculateYarnWeight = (glm, quantity) => {
    // Total KG = (GLM / 1000) * Quantity
    return ((parseFloat(glm) || 0) / 1000) * (parseFloat(quantity) || 0);
};
  
export const calculateYarnCost = (kg, rate) => {
    return (parseFloat(kg) || 0) * (parseFloat(rate) || 0);
};
  
export const calculateWarping = (rate, quantity) => {
    return (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
};
  
export const calculateWeaving = (pickRate, ppi, quantity) => {
    // Weaving Cost = Pick Rate * PPI * Quantity
    return (parseFloat(pickRate) || 0) * (parseFloat(ppi) || 0) * (parseFloat(quantity) || 0);
};
  
export const calculateWashing = (rate, quantity) => {
    return (parseFloat(rate) || 0) * (parseFloat(quantity) || 0);
};
  
export const calculateSellingPrice = (totalCost, marginPct) => {
    const cost = parseFloat(totalCost) || 0;
    const margin = parseFloat(marginPct) || 0;
    if (margin >= 100) return cost; // handle edge case
    return cost / (1 - (margin / 100));
};
  
export const calculateProfit = (sellingPrice, totalCost) => {
    return (parseFloat(sellingPrice) || 0) - (parseFloat(totalCost) || 0);
};
  
export const calculateBeamQuantity = (quantity, ends) => {
    return (parseFloat(quantity) || 0) * ((parseFloat(ends) || 0) / 1000); 
};
