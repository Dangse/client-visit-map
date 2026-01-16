
import { GoogleGenAI, Type } from "@google/genai";

const GEO_CACHE_PREFIX = 'geo_cache_';

const getCleanKey = (address: string) => address.trim().replace(/\s+/g, ' ');

export const getCachedCoords = (address: string) => {
  const cached = localStorage.getItem(GEO_CACHE_PREFIX + getCleanKey(address));
  return cached ? JSON.parse(cached) : null;
};

export const saveToCache = (address: string, coords: { lat: number; lng: number }) => {
  localStorage.setItem(GEO_CACHE_PREFIX + getCleanKey(address), JSON.stringify(coords));
};

export const batchGeocodeWithGemini = async (addresses: string[]): Promise<Record<string, { lat: number; lng: number }>> => {
  if (addresses.length === 0) return {};

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.warn("Gemini API_KEY is missing. Skipping AI geocoding.");
    return {};
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const targetAddresses = addresses.slice(0, 30);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `다음은 한국의 거래처 주소들입니다. 
      주소에 우편번호(5자리 숫자), 상세 호수(예: 102호), 또는 괄호 안의 참고 정보가 포함되어 있을 수 있습니다.
      이러한 불필요한 정보를 제외하고 '도로명 주소' 또는 '지번 주소'의 핵심 위치만 파악하여 위도(lat)와 경도(lng)를 응답해 주세요.
      
      결과는 반드시 JSON 형식을 따라야 합니다.
      
      주소 리스트:
      ${targetAddresses.join('\n')}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  address: { type: Type.STRING, description: "원본 주소" },
                  lat: { type: Type.NUMBER },
                  lng: { type: Type.NUMBER }
                },
                required: ["address", "lat", "lng"]
              }
            }
          },
          required: ["results"]
        }
      }
    });

    const text = response.text || '{"results":[]}';
    const parsed = JSON.parse(text);
    const finalResult: Record<string, { lat: number; lng: number }> = {};

    if (parsed.results && Array.isArray(parsed.results)) {
      parsed.results.forEach((item: any) => {
        if (item.address && item.lat && item.lng) {
          const coords = { lat: item.lat, lng: item.lng };
          finalResult[item.address] = coords;
          saveToCache(item.address, coords);
        }
      });
    }
    
    return finalResult;
  } catch (error) {
    console.error("Gemini Batch Geocoding Failed:", error);
    return {};
  }
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const cached = getCachedCoords(address);
  if (cached) return cached;

  try {
    const cleanAddress = address.trim()
      .replace(/^\d{5}\s+/, '')
      .replace(/\s*\(.*?\)/g, '')
      .replace(/\s+\d+호.*$/, '')
      .split(' ').slice(0, 4).join(' ');

    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanAddress)}&limit=1`, {
        headers: { 'User-Agent': 'SmartClientMap/2.0' }
    });
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      saveToCache(address, result);
      return result;
    }
    return null;
  } catch (e) {
    return null;
  }
};
