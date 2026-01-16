
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("App starting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React render sequence initiated");
} catch (error) {
  console.error("Critical rendering error:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>앱 실행 오류</h2>
      <p>애플리케이션을 초기화하는 중에 오류가 발생했습니다.</p>
      <pre style="background: #eee; padding: 10px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
    </div>
  `;
}
