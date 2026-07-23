import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiError } from "../utils/ApiError.js";
import { MenuItem } from "../models/MenuItem.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en";

async function transcribeAudio(buffer, mimetype) {
  const response = await fetch(DEEPGRAM_URL, {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": mimetype || "audio/webm",
    },
    body: buffer,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new ApiError(502, `Deepgram transcription failed: ${errText}`);
  }

  const data = await response.json();
  const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  if (!transcript || transcript.trim().length === 0) {
    throw new ApiError(422, "Could not detect any speech in the recording");
  }

  return transcript.trim();
}

const CONTEXT_PROMPTS = {
  sale: (transcript, menuItems) => `You are extracting a restaurant sale order from spoken text.

Available menu items (name, category, price, halfPrice if applicable):
${JSON.stringify(menuItems.map((m) => ({ name: m.name, category: m.category, price: m.price, halfPrice: m.halfPrice })))}

Spoken text: "${transcript}"

Return a JSON object with this exact shape:
{
  "customerName": string or null,
  "customerPhone": string or null,
  "customerAddress": string or null,
  "items": [ { "itemName": string (must match a menu item name above as closely as possible), "quantity": number, "portion": "full" | "half" } ],
  "deliveryCharge": number or null,
  "paymentMode": "cash" | "upi" | "card" | "credit" | null,
  "paymentStatus": "Paid" | "Unpaid" | "Partial" | null,
  "amountPaid": number or null,
  "notes": string or null
}
If a field isn't mentioned, use null. Do not invent prices — leave item pricing out, it will be matched separately.`,

  expense: (transcript) => `You are extracting a kitchen expense record from spoken text.

Spoken text: "${transcript}"

Return a JSON object with this exact shape:
{
  "category": string or null,
  "items": string or null,
  "amount": number or null,
  "paymentMode": "cash" | "card" | "upi" | "bank" | null,
  "notes": string or null
}
If a field isn't mentioned, use null.`,

  menu: (transcript) => `You are extracting a menu item definition from spoken text.

Spoken text: "${transcript}"

Return a JSON object with this exact shape:
{
  "name": string or null,
  "category": string or null,
  "price": number or null,
  "halfPrice": number or null,
  "description": string or null
}
If a field isn't mentioned, use null.`,

  customer: (transcript) => `You are extracting a customer profile from spoken text.

Spoken text: "${transcript}"

Return a JSON object with this exact shape:
{
  "name": string or null,
  "phone": string or null,
  "address": string or null
}
If a field isn't mentioned, use null.`,
};

async function extractStructuredData(context, transcript, menuItems) {
  const promptBuilder = CONTEXT_PROMPTS[context];
  if (!promptBuilder) {
    throw new ApiError(400, `Unsupported voice context: ${context}`);
  }

  const prompt = context === "sale" ? promptBuilder(transcript, menuItems) : promptBuilder(transcript);

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite",
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  const result = await model.generateContent(prompt);
  const rawText = result.response.text().trim();

  if (!rawText) {
    throw new ApiError(502, "Voice extraction returned no data — please try again or enter manually");
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new ApiError(502, "Voice extraction returned malformed data — please try again or enter manually");
  }

  return parsed;
}

function matchItemsToMenu(items, menuItems) {
  return (items || []).map((item) => {
    const nameLower = (item.itemName || "").toLowerCase().trim();
    const match = menuItems.find((m) => m.name.toLowerCase() === nameLower)
      ?? menuItems.find((m) => m.name.toLowerCase().includes(nameLower) || nameLower.includes(m.name.toLowerCase()));

    if (!match) {
      return {
        itemName: item.itemName || "",
        quantity: item.quantity || 1,
        unitPrice: 0,
        isCustom: true,
        portion: "full",
      };
    }

    const portion = item.portion === "half" && match.halfPrice !== undefined ? "half" : "full";
    return {
      itemName: match.name,
      quantity: item.quantity || 1,
      unitPrice: portion === "half" ? match.halfPrice : match.price,
      halfPrice: match.halfPrice,
      portion,
      isCustom: false,
      menuItem: match._id.toString(),
    };
  });
}

export async function parseVoiceEntry({ context, buffer, mimetype }) {
  const transcript = await transcribeAudio(buffer, mimetype);

  let menuItems = [];
  if (context === "sale") {
    menuItems = await MenuItem.find({ isActive: true }).lean();
  }

  const extracted = await extractStructuredData(context, transcript, menuItems);

  if (context === "sale") {
    extracted.items = matchItemsToMenu(extracted.items, menuItems);
  }

  return { transcript, extracted };
}