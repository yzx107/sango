/// <reference types="vite/client" />

interface ThreeGameDiagnostics {
  frame: number;
  turn?: number;
  playerFactionId?: string;
  selectedCityId?: string | null;
  outcome?: string;
  ordersRemaining?: number;
  ordersMax?: number;
  cityCount: number;
  marchCount: number;
  renderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  canvas: {
    clientWidth: number;
    clientHeight: number;
    width: number;
    height: number;
    dpr: number;
  };
}

interface Window {
  __THREE_GAME_DIAGNOSTICS__?: ThreeGameDiagnostics;
}
