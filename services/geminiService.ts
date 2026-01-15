export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    if (!address) return null;

    // 1. 주소 정제 (Cleaning)
    // 예: "07313 서울 영등포구 신길로 220 102호(신길동)"
    let cleanAddress = address.trim();
    
    // [규칙 1] 맨 앞의 5자리 우편번호 제거 (예: 07313 )
    cleanAddress = cleanAddress.replace(/^\d{5}\s+/, '');
    
    // [규칙 2] 괄호와 그 안의 내용 제거 (예: (신길동))
    cleanAddress = cleanAddress.replace(/\s*\(.*?\)/g, '');
    
    // [규칙 3] 상세 주소 키워드 이후 내용 제거 (숫자+호, 숫자+층, 숫자+동 등)
    // 도로명 주소는 보통 "도로명 숫자"에서 끝납니다. 그 뒤의 "102호" 등은 검색에 방해가 됩니다.
    cleanAddress = cleanAddress.replace(/\s+\d+\s*(호|층|동|빌딩|상가).*$/, '');
    // 단순 숫자형 상세주소도 제거 (예: 신길로 220 102 -> 신길로 220)
    const parts = cleanAddress.split(' ');
    if (parts.length > 2) {
        const lastPart = parts[parts.length - 1];
        const secondLastPart = parts[parts.length - 2];
        // 마지막 부분이 숫자고, 그 앞부분도 숫자(지번/도로명번호)가 있다면 마지막 숫자는 상세주소일 확률이 높음
        if (/^\d+$/.test(lastPart) && /\d+/.test(secondLastPart)) {
            parts.pop();
            cleanAddress = parts.join(' ');
        }
    }

    const finalAddress = cleanAddress.trim();
    console.debug(`Geocoding attempt: [${address}] -> [${finalAddress}]`);

    // 2. Nominatim API 호출
    const encodedAddress = encodeURIComponent(finalAddress);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`, {
        headers: {
            'Accept-Language': 'ko-KR,ko;q=0.9',
            'User-Agent': 'SmartClientVisitMap/1.0'
        }
    });
    
    if (!response.ok) throw new Error("Network error");

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    // 3. 실패 시 대체 전략: 주소를 뒤에서부터 한 단어씩 깎으면서 재시도
    const retryParts = finalAddress.split(' ');
    if (retryParts.length > 2) {
        retryParts.pop(); // 마지막 단어 제거
        const shorterAddress = retryParts.join(' ');
        const shortRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shorterAddress)}&limit=1`);
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