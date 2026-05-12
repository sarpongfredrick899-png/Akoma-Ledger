import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRANSACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    product: {
      type: Type.STRING,
      description: "The name of the item or service",
    },
    quantity: {
      type: Type.STRING,
      description: "The number of items mentioned (e.g. '50', '4 bags')",
    },
    amount: {
      type: Type.NUMBER,
      description: "The total numeric value in GHS",
    },
    type: {
      type: Type.STRING,
      enum: ["income", "expense", "credit"],
      description: "Type of transaction: sale (income), purchase (expense), or record of debt/pending payment (credit)",
    },
    category: {
      type: Type.STRING,
      description: "Accounting category (Sales, Logistics, Inventory, Rent, Utilities, etc.)",
    },
  },
  required: ["product", "amount", "type", "category"],
};

export async function parseFinancialStatement(text: string): Promise<Partial<Transaction> | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a financial expert assisting a Ghanaian entrepreneur. 
      The input is a voice transcript or text in English or Twi.
      
      Task: Extract:
      1. Product/Service/Expense name.
      2. Quantity if mentioned.
      3. Total Price amount in GHS.
      4. Transaction Type: 'income' for sales, 'expense' for purchases/costs, or 'credit' if someone bought on credit.
      5. A logical accounting Category.

      Operational Context:
      - ALWAYS distinguish between Sales and Manual/Operational Expenses.
      - If the user uses keywords like "paid", "bought", "cost", "rent", "bill", "data", "electricity", "transport", "fuel", "wages", or mentions any utility, it MUST be categorized as an 'expense' (Operational).
      - If the user mentions "selling", "sold", "credit", or "record a sale", it is 'income' or 'credit'.
      - "Sold" or "Tɔn" (Twi) -> income
      - "Bought" or "Tɔ" (Twi) -> expense
      - "Paid for" or "Tua" (Twi) -> expense
      - "Credit" or "Ka" (Twi) -> credit

      Input: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRANSACTION_SCHEMA,
      },
    });

    const parsed = JSON.parse(response.text || "null");
    if (!parsed) return null;

    return {
      description: `${parsed.quantity ? parsed.quantity + ' ' : ''}${parsed.product}`,
      product: parsed.product,
      quantity: parsed.quantity,
      amount: Math.abs(parsed.amount),
      type: parsed.type as TransactionType,
      category: parsed.category,
      rawText: text,
    };
  } catch (error) {
    console.error("Error parsing financial statement:", error);
    return null;
  }
}
