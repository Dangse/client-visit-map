
export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    // 1. 주소 정제 로직
    let cleanAddress = address.trim();
    
    // 우편번호 제거 (5자리 숫자)
    cleanAddress = cleanAddress.replace(/^\d{5}\s+/, '');
    
    // 괄호 내용 제거 (예: (신길동))
    cleanAddress = cleanAddress.replace(/\(.*\)/g, '');
    
    // 상세주소 키워드 이후 내용 제거 (호, 층 등)
    // "신길로 220 102호" -> "신길로 220"
    const detailKeywords = ['호', '층', '동', '빌딩', '상가'];
    for (const kw of detailKeywords) {
        const index = cleanAddress.indexOf(kw);
        if (index > -1) {
            // 해당 키워드 앞의 공백까지 찾아서 자르기 시도
            const lastSpaceBefore = cleanAddress.lastIndexOf(' ', index);
            if (lastSpaceBefore > -1) {
                cleanAddress = cleanAddress.substring(0, lastSpaceBefore);
            }
        }
    }

    const encodedAddress = encodeURIComponent(cleanAddress.trim());
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`, {
        headers: {
            'Accept-Language': 'ko-KR,ko;q=0.9'
        }
    });
    
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    // 정제된 주소로도 실패 시, 마지막으로 공백 기준 앞의 3단어만 시도 (시 도 구/군)
    const parts = cleanAddress.split(' ');
    if (parts.length > 3) {
        const shortAddress = parts.slice(0, 3).join(' ');
        const shortRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shortAddress)}&limit=1`);
        const shortData = await shortRes.json();
        if (shortData && shortData.length > 0) {
            return {
                lat: parseFloat(shortData[0].lat),
                lng: parseFloat(shortData[0].lon)
            };
        }
    }

    return null;
  } catch (error) {
    console.error("Geocoding failed for:", address, error);
    return null;
  }
};
