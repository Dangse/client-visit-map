
export interface Client {
  id: string;
  name: string;        // 상호
  representative: string; // 대표자
  businessType: string;   // 업태
  category: string;       // 종목
  type: 'Corporation' | 'Individual'; // 법인/개인 구분
  address: string;        // 주소
  businessNumber: string; // 사업자번호
  phone: string;          // 전화번호
  lat?: number;
  lng?: number;
}
