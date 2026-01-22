import React from 'react';
import ReactDOM from 'react-dom/client';

import "./index.css";
import "./styles.css";

// 2. 외부 라이브러리 CSS (수정 불필요)
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// 3. App 컴포넌트 불러오기 
// App.tsx가 index.tsx와 같은 폴더(루트)에 있다면 아래처럼 써야 합니다.
import App from './App'; 

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}