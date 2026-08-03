/**
 * Dev-only 预览入口：在纯浏览器（无 Tauri 后端）里渲染 DataChartsPanel。
 * 通过 @tauri-apps/api/mocks 的 mockIPC 提供假数据，用于视觉审查。
 * 访问：http://127.0.0.1:1422/preview-charts.html（vite dev）
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { mockIPC } from '@tauri-apps/api/mocks';

import '../styles/tailwind.css';
import '../styles/shadcn-variables.css';
import '../styles/theme-colors.css';
import '../shared/styles/index.css';
import '../styles/typography.css';

import '../i18n';
import i18n from '../i18n';

// ----------------------------------------------------------------------------
// 假数据
// ----------------------------------------------------------------------------

const DAYS = 90;

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const seeded = (i: number) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;

const trendPoints = Array.from({ length: DAYS }, (_, idx) => {
  const i = DAYS - 1 - idx;
  const base = seeded(idx) * 42000;
  const weekly = Math.sin((idx / 7) * Math.PI) * 12000;
  return {
    timeLabel: isoDaysAgo(i),
    timestamp: Date.now() - i * 86400000,
    totalTokens: Math.max(0, Math.round(base + weekly + 6000)),
    promptTokens: 0,
    completionTokens: 0,
    requestCount: Math.round(seeded(idx) * 60),
  };
});

const sessionsByStatus: Record<string, unknown[]> = {
  active: Array.from({ length: 132 }, (_, i) => ({
    id: `s${i}`,
    mode: ['default', 'anki', 'analysis'][i % 3],
    persistStatus: 'active',
    createdAt: new Date(Date.now() - seeded(i) * 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  archived: Array.from({ length: 41 }, (_, i) => ({
    id: `a${i}`,
    mode: 'default',
    persistStatus: 'archived',
    createdAt: new Date(Date.now() - seeded(i + 500) * 200 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  })),
};

const heatmapDays = Array.from({ length: 365 }, (_, i) => {
  const r = seeded(i + 77);
  const count = r < 0.42 ? 0 : Math.round(r * 24);
  return {
    date: isoDaysAgo(364 - i),
    count,
    details: {
      chatSessions: Math.round(count * 0.3),
      chatMessages: Math.round(count * 0.5),
      notesEdited: Math.round(count * 0.2),
      textbooksOpened: 0,
      examsCreated: 0,
      translationsCreated: 0,
      essaysCreated: 0,
      ankiCardsCreated: 0,
      questionsAnswered: 0,
    },
  };
});

mockIPC((cmd, payload: any) => {
  switch (cmd) {
    case 'chat_v2_list_sessions':
      return sessionsByStatus[payload?.status as string] ?? [];
    case 'chat_v2_get_message_summary':
      return {
        total_messages: 4213,
        user_messages: 2101,
        assistant_messages: 2112,
        sessions_with_messages: 160,
      };
    case 'llm_usage_summary':
      return {
        startDate: payload?.startDate,
        endDate: payload?.endDate,
        totalRequests: 1824,
        successRequests: 1793,
        errorRequests: 31,
        totalPromptTokens: 1834000,
        totalCompletionTokens: 612000,
        totalTokens: 2446000,
        avgDurationMs: 3412,
      };
    case 'llm_usage_get_trends':
      return trendPoints.slice(-Number(payload?.days ?? 30));
    case 'llm_usage_by_model':
      return [
        { modelId: 'anthropic/claude-sonnet-4.5', requestCount: 704, totalTokens: 1210000, promptTokens: 0, completionTokens: 0 },
        { modelId: 'openai/gpt-5.2', requestCount: 411, totalTokens: 640000, promptTokens: 0, completionTokens: 0 },
        { modelId: 'deepseek/deepseek-v3.2', requestCount: 305, totalTokens: 310000, promptTokens: 0, completionTokens: 0 },
        { modelId: 'google/gemini-3-flash', requestCount: 214, totalTokens: 180000, promptTokens: 0, completionTokens: 0 },
        { modelId: 'Qwen/Qwen3-Embedding', requestCount: 130, totalTokens: 76000, promptTokens: 0, completionTokens: 0 },
        { modelId: 'f_custom123', requestCount: 60, totalTokens: 30000, promptTokens: 0, completionTokens: 0 },
      ];
    case 'llm_usage_by_caller':
      return [
        { callerType: 'chat_v2', displayName: '', requestCount: 1020, totalTokens: 1600000 },
        { callerType: 'anki', displayName: '', requestCount: 330, totalTokens: 420000 },
        { callerType: 'embedding', displayName: '', requestCount: 244, totalTokens: 200000 },
        { callerType: 'translation', displayName: '', requestCount: 130, totalTokens: 130000 },
        { callerType: 'memory', displayName: '', requestCount: 100, totalTokens: 96000 },
      ];
    case 'get_learning_heatmap':
      return heatmapDays;
    default:
      console.warn('[previewCharts] unmocked cmd:', cmd, payload);
      return null;
  }
});

// ----------------------------------------------------------------------------
// 渲染
// ----------------------------------------------------------------------------

async function main() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
  await i18n.changeLanguage(params.get('lang') === 'en' ? 'en-US' : 'zh-CN');

  const { DataChartsPanel } = await import('../components/stats/DataChartsPanel');

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <div className="min-h-screen bg-background px-8 py-8 text-foreground">
        <div className="mx-auto max-w-3xl">
          <DataChartsPanel />
        </div>
      </div>
    </React.StrictMode>
  );
}

void main();
