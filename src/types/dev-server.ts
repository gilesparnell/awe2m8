export interface DevServer {
  name: string;
  port: number;
  pid: number | null;
  url: string;
  status: 'running' | 'stopped' | 'starting';
  command: string;
  cwd: string;
  source: 'detected' | 'manual';
}

export interface DevServerConfig {
  name: string;
  cwd: string;
  script: string;
  port: number;
}

export const DEV_PORTS = [
  3000, 3001, 3002, 4000, 4200, 4321,
  5000, 5173, 5174, 8000, 8080, 8888, 9000, 9090,
] as const;
