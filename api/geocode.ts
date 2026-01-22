import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { addresses } = req.body;
  // 새로운 SDK 인스턴스 생성 방식
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const prompt = `다음 주소들의 위경도를 JSON으로 응답해줘. 형식은 [{ "address": "주소", "lat": 위도, "lng": 경도 }] 로 해줘: \n${addresses.join('\n')}`;
    
    // getGenerativeModel 대신 models.generateContent를 바로 사용합니다.
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json" 
      }
    });

    res.status(200).json(JSON.parse(response.text()));
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: "Geocoding failed" });
  }
}