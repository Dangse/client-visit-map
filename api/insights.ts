import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { client } = req.body;
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = `
    당신은 한국의 중소기업 전문 경영 컨설턴트입니다. 아래 정보를 바탕으로 방문 상담 가이드를 작성하세요.
    상호: ${client.name}, 업종: ${client.category}, 주소: ${client.address}
    3~4줄 내외의 친절한 구어체로 작성하세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    res.status(200).send(response.text);
  } catch (error) {
    res.status(500).send("현재 AI 비서가 응답할 수 없습니다.");
  }
}