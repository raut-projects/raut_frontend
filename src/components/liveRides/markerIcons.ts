const svgEscape = (svg: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export function carMarkerIcon(heading: number, color = "#2563eb"): string {
  const svg = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 14V10C21 7.79 19.21 6 17 6H15C14.45 6 14 6.45 14 7H10C10 6.45 9.55 6 9 6H7C4.79 6 3 7.79 3 10V14C3 16.21 4.79 18 7 18H17C19.21 18 21 16.21 21 14ZM7 8C8.1 8 9 7.1 9 6H15C15 7.1 15.9 8 17 8V10H7V8ZM7 16C8.1 16 9 15.1 9 14H15C15 15.1 15.9 16 17 16V18H7V16Z" fill="${color}"/>
  </svg>`;
  return svgEscape(svg);
}

export function pinMarkerIcon(color = "#16a34a"): string {
  const svg = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 18.5C7.8 18.5 5 15.7 5 12.5C5 9.5 7 6 9 6C9.5 5.17 10 4 11 4C12 4 12.5 5.17 13 6C15 6 17 9.5 17 12.5C17 15.7 14.2 18.5 11 18.5ZM11 4C10.5 4 10 4.5 10 5C10 7 8 9.5 8 12.5C8 15.3 10.5 18.5 11 18.5C11.5 18.5 14 15.3 14 12.5C14 9.5 12 7 12 5C12 4.5 11.5 4 11 4Z" fill="${color}"/>
  </svg>`;
  return svgEscape(svg);
}

export function clusterMarkerIcon(count: number, color = "#6b7280"): string {
  const svg = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="${color}" opacity="0.9"/>
    <text x="12" y="16" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="white" text-anchor="middle">${count}</text>
  </svg>`;
  return svgEscape(svg);
}
