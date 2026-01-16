# AI Coding Agent Instructions for Client Visit Map

## Project Overview
This is a React TypeScript SPA that displays Korean business clients on an interactive map. It loads client data from Google Sheets CSV, uses Gemini AI for geocoding addresses, and provides search/filter functionality with click-to-call integration.

## Architecture & Data Flow
- **Data Source**: Google Sheets published as CSV (Korean headers: 상호, 대표자, 주소, 전화번호, etc.)
- **Geocoding**: Gemini AI batch processing with localStorage caching + Nominatim fallback
- **Display**: Leaflet map with marker clustering, centered on Seoul (37.5665, 126.9780)
- **UI**: Korean language, Tailwind CSS, full-height responsive layout

## Key Components
- `App.tsx`: Main orchestrator - CSV parsing, geocoding, search logic, UI state
- `MapView.tsx`: Leaflet map wrapper with clustering and marker interactions
- `geminiService.ts`: AI geocoding service with caching and error handling
- `types.ts`: Client interface mapping Korean CSV fields to typed properties

## Critical Patterns & Conventions

### Korean Address Handling
When processing addresses for geocoding:
```typescript
// Clean addresses by removing postal codes, apartment numbers, and parenthetical notes
const cleanAddress = address.trim()
  .replace(/^\d{5}\s+/, '')  // Remove 5-digit postal codes
  .replace(/\s*\(.*?\)/g, '')  // Remove parentheses
  .replace(/\s+\d+호.*$/, '')  // Remove apartment numbers
  .split(' ').slice(0, 4).join(' ');  // Keep first 4 address parts
```

### CSV Parsing
Handle Korean headers and quoted CSV fields:
```typescript
const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
const entry: Record<string, string> = {};
headers.forEach((header, i) => { entry[header] = values[i] || ''; });
return {
  name: entry['상호'] || entry['상호명'] || '이름 없음',
  representative: entry['대표자'] || entry['대표'] || '-',
  // ... map other Korean fields
};
```

### Gemini AI Integration
Use structured JSON responses for batch geocoding:
```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `다음은 한국의 거래처 주소들입니다...`,  // Korean prompt
  config: {
    responseMimeType: "application/json",
    responseSchema: { /* structured schema */ }
  }
});
```

### Map Interactions
- Markers cluster with `maxClusterRadius: 40`
- Selected clients fly to zoom level 16
- Search results with <10 items auto-fit bounds
- My location shows as blue circle with fly-to animation

### UI Patterns
- Full-height layout: `html, body, #root { height: 100%; }`
- Absolute positioning for overlay elements (search bar, client cards)
- Backdrop blur effects: `bg-white/90 backdrop-blur-xl`
- Slide-up animations for dynamic content
- Korean text: "상호 검색", "전화하기", "길찾기"

## Development Workflow
- **Dev server**: `npm run dev` (Vite)
- **Build**: `npm run build` (requires `API_KEY` env var)
- **Deploy**: GitHub Actions to Pages (passes `API_KEY` secret)
- **External deps**: Leaflet & Tailwind loaded via CDN, React via ESM.sh import maps

## Integration Points
- **Google Sheets**: CSV export URL with cache-busting timestamp
- **Gemini AI**: Batch geocoding with Korean address cleaning
- **Kakao Map**: Navigation links (`https://map.kakao.com/link/search/{address}`)
- **Geolocation API**: User location with error handling
- **localStorage**: Coordinate caching with `geo_cache_` prefix

## Common Tasks
- **Add new client fields**: Update `types.ts`, CSV parser in `App.tsx`, and UI in client cards
- **Modify geocoding**: Edit prompts in `geminiService.ts`, handle new address formats
- **Change map behavior**: Update `MapView.tsx` clustering or interaction logic
- **Add search filters**: Extend `filteredClients` logic in `App.tsx`</content>
<parameter name="filePath">d:\DATA (절대 삭제금지)\Desktop\client-visit-map\.github\copilot-instructions.md