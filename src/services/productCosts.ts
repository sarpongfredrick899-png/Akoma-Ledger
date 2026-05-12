export interface ProductCost {
  id: string;
  name: string;
  costPrice: number; // Cost price per unit
}

// A built-in database of common Ghanaian entrepreneur products and their approximate costs
export const PRODUCT_COSTS: Record<string, number> = {
  "maize": 150, // per bag
  "yam": 5, // per tuber
  "rice": 250, // per 50kg bag
  "oil": 25, // per liter
  "charcoal": 80, // per bag
  "tilapia": 15, // per piece
  "plantain": 4, // per finger/bunch average
  "sachet water": 0.5, // per sachet
  "bottled water": 2.5, // per bottle
  "cement": 95, // per bag
};

export function lookupCost(productName: string, quantity: string | number = 1, customCosts?: Record<string, number>): number {
  const normalized = productName.toLowerCase().trim();
  const qty = typeof quantity === 'string' ? parseFloat(quantity) || 1 : quantity;
  const costs = customCosts || PRODUCT_COSTS;
  
  // Simple substring matching for common products
  const key = Object.keys(costs).find(k => normalized.includes(k.toLowerCase()));
  
  if (key) {
    return costs[key] * qty;
  }
  
  // Default: If product unknown, assume 60% cost margin for goods
  return 0.6; 
}
