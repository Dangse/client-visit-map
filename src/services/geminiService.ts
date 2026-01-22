/**
 * geminiService.ts (수정본)
 */

const GEO_CACHE_PREFIX = 'geo_cache_';

// 1. 캐시 관련 유틸리티 (기존과 동일 - 로컬 환경 최적화용)
const getCleanKey = (address: string) => address.trim().replace(/\s+/g, ' ');

export const getCachedCoords = (address: string) => {
  const cached = localStorage.getItem(GEO_CACHE_PREFIX + getCleanKey(address));
  return cached ? JSON.parse(cached) : null;
};

export const saveToCache = (address: string, coords: { lat: number; lng: number }) => {
  localStorage.setItem(GEO_CACHE_PREFIX + getCleanKey(address), JSON.stringify(coords));
};

/**
 * 1. 주소를 좌표로 변환 (백엔드 /api/geocode 호출)
 */
export const batchGeocodeWithGemini = async (addresses: string[]): Promise<Record<string, { lat: number; lng: number }>> => {
  if (addresses.length === 0) return {};

  try {
    // 직접 구글을 호출하는 대신, 우리가 만든 Vercel 서버리스 함수로 요청을 보냅니다.
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses: addresses.slice(0, 30) }),
    });

    if (!response.ok) throw new Error('네트워크 응답이 올바르지 않습니다.');

    const results = await response.json();
    const finalResult: Record<string, { lat: number; lng: number }> = {};

    results.forEach((item: any) => {
      if (item.address && item.lat && item.lng) {
        const coords = { lat: Number(item.lat), lng: Number(item.lng) };
        finalResult[item.address] = coords;
        saveToCache(item.address, coords); // 로컬 캐시에 저장
      }
    });
    
    return finalResult;
  } catch (error) {
    console.error("Geocoding 실패:", error);
    return {};
  }
};

/**
 * 2. 거래처 방문 상담 인사이트 생성 (백엔드 /api/insights 호출)
 */
export const getClientInsights = async (client: any) => {
  try {
    const response = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client }),
    });

    if (!response.ok) throw new Error('인사이트 생성 실패');
    
    return await response.text();
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "현재 AI 비서가 응답할 수 없습니다.";
  }
};