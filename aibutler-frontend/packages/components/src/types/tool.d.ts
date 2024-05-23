import type { ToolConfig } from '@labelu/annotation';
export interface IShortcut {
  name: string;
  icon: any;
  shortCut: string[];
  noticeInfo?: string;
}

export interface BasicConfig {
  step: number;
  dataSourceStep: number;
  tool: string;
  config: ToolConfig;
}
