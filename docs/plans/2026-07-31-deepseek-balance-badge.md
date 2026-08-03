# DeepSeek 余额徽章 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在设置页内置 DeepSeek 供应商（`builtin-deepseek`）标题旁显示余额徽章：`剩余 ¥110.00 · 5 分钟前 · ↻`，失败时显示"查询失败"可重试。

**Architecture:** 纯前端方案（已实测验证可行：DeepSeek API 支持 CORS 反射 + 项目 CSP 已放行 `https://api.deepseek.com`）。复用现成的 `resolveApiKey()`（`src/features/settings/components/vendorModelService.ts:113`）解析明文 API Key，新增自定义 hook `useDeepSeekBalance` 请求 `GET https://api.deepseek.com/user/balance`（不带 `/v1`，Bearer 认证），新增 `DeepSeekBalanceBadge` 组件挂到 `VendorDetailPanel` 供应商标题行。无 react-query，hook 用原生 useState/useEffect + ref 做 30s 结果缓存。

**Tech Stack:** React 18 + TypeScript + Vite, Tauri（仅前端改动）, i18next（`settings` 命名空间）, Vitest + Testing Library, @phosphor-icons/react（`ArrowClockwise` 图标）。

**已验证的事实（不要重复验证）：**
- 余额端点：`GET https://api.deepseek.com/user/balance`，`Authorization: Bearer <key>`；成功返回 `{ is_available: true, balance_infos: [{ currency: "CNY", total_balance: "110.00", granted_balance: "10.00", topped_up_balance: "100.00" }] }`
- 无 key / key 无效时返回 HTTP 401 + 纯文本 `Authentication Fails (governor)`（**不是 JSON**，错误分支禁止 `res.json()`）
- CORS 已实测通过（反射任意 Origin + `allow-credentials: true`）
- CSP `connect-src` 已含 `https://api.deepseek.com`（`src-tauri/tauri.conf.json:38`）
- 内置供应商定义：`src-tauri/src/llm_manager/builtin_vendors.rs:109-116`，`id: "builtin-deepseek"`，`base_url: "https://api.deepseek.com/v1"`
- `resolveApiKey(vendor)`（`vendorModelService.ts:113`）返回明文 key：内置供应商从 Tauri 安全存储读 `{vendor.id}.api_key`，回退到 `vendor.apiKey`；无 key 返回 `null`
- 项目**无** @tanstack/react-query（只有 react-virtual），无通用 timeAgo 工具

---

## Task 1: 余额查询 Hook

**Files:**
- Create: `src/features/settings/components/useDeepSeekBalance.ts`
- Test: `src/features/settings/components/__tests__/useDeepSeekBalance.test.ts`

**Step 1: Write the failing test**

Create `src/features/settings/components/__tests__/useDeepSeekBalance.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useDeepSeekBalance } from '../useDeepSeekBalance';
import { resolveApiKey } from '../vendorModelService';

vi.mock('../vendorModelService', () => ({
  resolveApiKey: vi.fn(),
}));

const mockResolveApiKey = vi.mocked(resolveApiKey);

const deepseekVendor = {
  id: 'builtin-deepseek',
  name: 'DeepSeek',
  providerType: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  isBuiltin: true,
};

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDeepSeekBalance', () => {
  it('成功时返回余额与更新时间', async () => {
    mockResolveApiKey.mockResolvedValue('sk-test-123');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        is_available: true,
        balance_infos: [
          { currency: 'CNY', total_balance: '110.00', granted_balance: '10.00', topped_up_balance: '100.00' },
        ],
      }),
    });

    const { result } = renderHook(() => useDeepSeekBalance(deepseekVendor as never, true));

    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.status).toBe('success'));

    expect(fetchMock).toHaveBeenCalledWith('https://api.deepseek.com/user/balance', {
      headers: { Authorization: 'Bearer sk-test-123' },
    });
    expect(result.current.data).toEqual({ totalBalance: '110.00', currency: 'CNY' });
    expect(typeof result.current.lastUpdatedAt).toBe('number');
  });

  it('未配置 key 时返回 idle 且不发请求', async () => {
    mockResolveApiKey.mockResolvedValue(null);

    const { result } = renderHook(() => useDeepSeekBalance(deepseekVendor as never, true));

    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('401 纯文本响应时返回 error', async () => {
    mockResolveApiKey.mockResolvedValue('sk-test-123');
    fetchMock.mockResolvedValue({ ok: false, status: 401, text: async () => 'Authentication Fails (governor)' });

    const { result } = renderHook(() => useDeepSeekBalance(deepseekVendor as never, true));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('30 秒缓存内重复触发不会重复请求', async () => {
    mockResolveApiKey.mockResolvedValue('sk-test-123');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ is_available: true, balance_infos: [{ currency: 'CNY', total_balance: '110.00' }] }),
    });

    const { result, rerender } = renderHook(
      ({ vendor, enabled }) => useDeepSeekBalance(vendor as never, enabled),
      { initialProps: { vendor: deepseekVendor, enabled: true } },
    );

    await waitFor(() => expect(result.current.status).toBe('success'));

    // 父级重新渲染触发重查，但 30s 内应命中缓存
    rerender({ vendor: { ...deepseekVendor }, enabled: true });

    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refetch 可绕过 30s 缓存强制刷新', async () => {
    mockResolveApiKey.mockResolvedValue('sk-test-123');
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ is_available: true, balance_infos: [{ currency: 'CNY', total_balance: '110.00' }] }),
    });

    const { result } = renderHook(() => useDeepSeekBalance(deepseekVendor as never, true));
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/settings/components/__tests__/useDeepSeekBalance.test.ts`
Expected: FAIL — `Cannot find module '../useDeepSeekBalance'`

**Step 3: Write minimal implementation**

Create `src/features/settings/components/useDeepSeekBalance.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VendorConfig } from '@/types';
import { resolveApiKey } from './vendorModelService';

export interface DeepSeekBalanceData {
  /** 余额金额字符串（如 "110.00"） */
  totalBalance: string;
  /** 货币代码（如 "CNY"） */
  currency: string;
}

export interface DeepSeekBalanceState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: DeepSeekBalanceData | null;
  /** 最近一次成功查询的时间戳（ms），用于显示"X 分钟前" */
  lastUpdatedAt: number | null;
  /** 强制刷新（绕过 30s 缓存） */
  refetch: () => Promise<void>;
}

const BALANCE_URL = 'https://api.deepseek.com/user/balance';
const CACHE_TTL_MS = 30 * 1000;

/**
 * 查询 DeepSeek 官方余额。仅对官方地址（内置 builtin-deepseek 供应商）有意义。
 * 无 key 或非官方地址时返回 idle；请求失败返回 error（错误响应可能是纯文本，禁止解析 JSON）。
 */
export function useDeepSeekBalance(
  vendor: VendorConfig | null,
  enabled: boolean,
): DeepSeekBalanceState {
  const [status, setStatus] = useState<DeepSeekBalanceState['status']>('idle');
  const [data, setData] = useState<DeepSeekBalanceData | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const lastFetchAtRef = useRef(0);
  const dataRef = useRef<DeepSeekBalanceData | null>(null);
  const statusRef = useRef<DeepSeekBalanceState['status']>('idle');
  const lastUpdatedAtRef = useRef<number | null>(null);

  const runQuery = useCallback(
    async (bypassCache: boolean) => {
      if (!vendor) return;
      const now = Date.now();
      if (!bypassCache && lastFetchAtRef.current && now - lastFetchAtRef.current < CACHE_TTL_MS) {
        return;
      }
      lastFetchAtRef.current = now;

      let key: string | null = null;
      try {
        key = await resolveApiKey(vendor);
      } catch {
        key = null;
      }
      if (!key) {
        statusRef.current = 'idle';
        dataRef.current = null;
        lastUpdatedAtRef.current = null;
        setStatus('idle');
        setData(null);
        setLastUpdatedAt(null);
        return;
      }

      statusRef.current = 'loading';
      setStatus('loading');

      try {
        const response = await fetch(BALANCE_URL, {
          headers: { Authorization: `Bearer ${key}` },
        });
        if (!response.ok) {
          throw new Error(`balance request failed: ${response.status}`);
        }
        const payload = (await response.json()) as {
          is_available?: boolean;
          balance_infos?: Array<{
            currency?: string;
            total_balance?: string;
            granted_balance?: string;
            topped_up_balance?: string;
          }>;
        };
        const first = payload.balance_infos?.[0];
        if (!first || !first.total_balance) {
          throw new Error('missing balance_infos');
        }
        const nextData: DeepSeekBalanceData = {
          totalBalance: first.total_balance,
          currency: first.currency ?? 'CNY',
        };
        const nextTime = Date.now();
        dataRef.current = nextData;
        lastUpdatedAtRef.current = nextTime;
        setData(nextData);
        setLastUpdatedAt(nextTime);
        setStatus('success');
      } catch {
        statusRef.current = 'error';
        setStatus('error');
      }
    },
    [vendor],
  );

  const refetch = useCallback(async () => {
    await runQuery(true);
  }, [runQuery]);

  useEffect(() => {
    if (!enabled || !vendor) return;
    void runQuery(false);
  }, [enabled, vendor, runQuery]);

  return { status, data, lastUpdatedAt, refetch };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/settings/components/__tests__/useDeepSeekBalance.test.ts`
Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/features/settings/components/useDeepSeekBalance.ts src/features/settings/components/__tests__/useDeepSeekBalance.test.ts
git commit -m "feat(settings): add DeepSeek balance query hook"
```

---

## Task 2: 余额徽章组件

**Files:**
- Create: `src/features/settings/components/DeepSeekBalanceBadge.tsx`
- Test: `src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx`
- Modify: `src/locales/en-US/settings.json`（追加 `deepseek_balance` 键）
- Modify: `src/locales/zh-CN/settings.json`（追加 `deepseek_balance` 键）

**Step 1: Add i18n keys**

在 `src/locales/en-US/settings.json` 和 `src/locales/zh-CN/settings.json` 顶层追加：

```json
"deepseek_balance": {
  "remaining": "Remaining {{amount}}",
  "just_now": "just now",
  "minutes_ago_one": "{{count}} minute ago",
  "minutes_ago_other": "{{count}} minutes ago",
  "failed": "Query failed",
  "refresh": "Refresh balance"
}
```

zh-CN：

```json
"deepseek_balance": {
  "remaining": "剩余 {{amount}}",
  "just_now": "刚刚",
  "minutes_ago_one": "{{count}} 分钟前",
  "minutes_ago_other": "{{count}} 分钟前",
  "failed": "查询失败",
  "refresh": "刷新余额"
}
```

**Step 2: Write the failing test**

Create `src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx`:

```tsx
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DeepSeekBalanceBadge } from '../DeepSeekBalanceBadge';
import { resolveApiKey } from '../vendorModelService';

vi.mock('../vendorModelService', () => ({
  resolveApiKey: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number; defaultValue?: string }) => {
      const map: Record<string, string> = {
        'settings:deepseek_balance.remaining': '剩余 {{amount}}',
        'settings:deepseek_balance.just_now': '刚刚',
        'settings:deepseek_balance.minutes_ago_one': '{{count}} 分钟前',
        'settings:deepseek_balance.minutes_ago_other': '{{count}} 分钟前',
        'settings:deepseek_balance.failed': '查询失败',
        'settings:deepseek_balance.refresh': '刷新余额',
      };
      const keyText = key.includes(':') ? key.split(':')[1] : key;
      let template = map[keyText] ?? options?.defaultValue ?? key;
      if (options?.count !== undefined && options.count === 1) {
        template = map[`${keyText}_one`] ?? template;
      }
      return template.replace('{{amount}}', String(options?.amount ?? '')).replace('{{count}}', String(options?.count ?? ''));
    },
  }),
}));

const fetchMock = vi.fn();
const mockResolveApiKey = vi.mocked(resolveApiKey);

const deepseekVendor = {
  id: 'builtin-deepseek',
  name: 'DeepSeek',
  providerType: 'deepseek',
  baseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  isBuiltin: true,
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const okResponse = () => ({
  ok: true,
  json: async () => ({
    is_available: true,
    balance_infos: [{ currency: 'CNY', total_balance: '110.00' }],
  }),
});

describe('DeepSeekBalanceBadge', () => {
  it('非内置 DeepSeek 供应商不渲染', () => {
    mockResolveApiKey.mockResolvedValue(null);
    render(
      <DeepSeekBalanceBadge vendor={{ ...deepseekVendor, id: 'custom-deepseek' } as never} />,
    );
    expect(document.body.textContent).not.toContain('剩余');
  });

  it('成功时显示剩余金额', async () => {
    mockResolveApiKey.mockResolvedValue('sk-test');
    fetchMock.mockResolvedValue(okResponse());

    render(<DeepSeekBalanceBadge vendor={deepseekVendor as never} />);

    await waitFor(() => expect(screen.getByText('剩余 ¥110.00')).toBeTruthy());
  });

  it('显示 1 分钟前并随时间跳动', async () => {
    vi.setSystemTime(new Date('2026-07-31T10:00:00Z'));
    mockResolveApiKey.mockResolvedValue('sk-test');
    fetchMock.mockResolvedValue(okResponse());

    render(<DeepSeekBalanceBadge vendor={deepseekVendor as never} />);
    await waitFor(() => expect(screen.getByText('刚刚')).toBeTruthy());

    await act(async () => {
      vi.setSystemTime(new Date('2026-07-31T10:01:30Z'));
      vi.advanceTimersByTime(61_000);
    });
    expect(screen.getByText('1 分钟前')).toBeTruthy();
  });

  it('失败时显示查询失败，点击刷新重试', async () => {
    mockResolveApiKey.mockResolvedValue('sk-test');
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401 });
    fetchMock.mockResolvedValueOnce(okResponse());

    render(<DeepSeekBalanceBadge vendor={deepseekVendor as never} />);
    await waitFor(() => expect(screen.getByText('查询失败')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: '刷新余额' }));
    await waitFor(() => expect(screen.getByText('剩余 ¥110.00')).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
```

注：需要 `import { act } from '@testing-library/react'` 于文件顶部。

**Step 3: Run test to verify it fails**

Run: `npx vitest run src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx`
Expected: FAIL — `Cannot find module '../DeepSeekBalanceBadge'`

**Step 4: Write minimal implementation**

Create `src/features/settings/components/DeepSeekBalanceBadge.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowClockwise } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import type { VendorConfig } from '@/types';
import { useDeepSeekBalance } from './useDeepSeekBalance';

const CURRENCY_SYMBOLS: Record<string, string> = {
  CNY: '¥',
  USD: '$',
  EUR: '€',
};

/** 会话内相对时间（秒），不依赖外部工具 */
function formatRelativeTime(timestamp: number, now: number, t: (key: string, options?: { count?: number; defaultValue?: string }) => string): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return t('settings:deepseek_balance.just_now');
  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) return t('settings:deepseek_balance.minutes_ago_one', { count: 1 });
  return t('settings:deepseek_balance.minutes_ago_other', { count: minutes });
}

function formatAmount(totalBalance: string, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? '';
  return symbol ? `${symbol}${totalBalance}` : `${totalBalance} ${currency}`;
}

interface DeepSeekBalanceBadgeProps {
  vendor: VendorConfig | null;
}

/**
 * 内置 DeepSeek 供应商标题旁的余额徽章。
 * 仅对 vendor.id === 'builtin-deepseek' 渲染；失败时显示"查询失败"并允许重试。
 */
export const DeepSeekBalanceBadge: React.FC<DeepSeekBalanceBadgeProps> = ({ vendor }) => {
  const { t } = useTranslation('settings');
  const isBuiltinDeepSeek = vendor?.id === 'builtin-deepseek';
  const { status, data, lastUpdatedAt, refetch } = useDeepSeekBalance(
    isBuiltinDeepSeek ? vendor : null,
    isBuiltinDeepSeek,
  );

  // "X 分钟前"每分钟跳动一次
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!isBuiltinDeepSeek || status === 'idle') {
    return null;
  }

  if (status === 'error') {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-2xs text-muted-foreground"
        data-testid="deepseek-balance-error"
      >
        <span>{t('settings:deepseek_balance.failed')}</span>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center justify-center rounded-full p-0.5 hocus:text-foreground"
          title={t('settings:deepseek_balance.refresh')}
          aria-label={t('settings:deepseek_balance.refresh')}
        >
          <ArrowClockwise className="h-3 w-3" />
        </button>
      </span>
    );
  }

  if (status === 'success' && data && lastUpdatedAt) {
    return (
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/40 bg-muted/50 px-2 py-0.5 text-2xs text-muted-foreground',
        )}
        data-testid="deepseek-balance"
      >
        <span className="font-medium text-foreground">
          {t('settings:deepseek_balance.remaining', { amount: formatAmount(data.totalBalance, data.currency) })}
        </span>
        <span className="text-muted-foreground/70">·</span>
        <span>{formatRelativeTime(lastUpdatedAt, now, t as never)}</span>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground transition-colors hocus:text-foreground"
          title={t('settings:deepseek_balance.refresh')}
          aria-label={t('settings:deepseek_balance.refresh')}
        >
          <ArrowClockwise className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return null;
};
```

注意：`formatRelativeTime` 调用 `t` 时传 key 含命名空间前缀；测试 mock 的 `t` 签名需容忍。若 tsconfig 对 `t as never` 有意见，可改为 `const { t } = useTranslation(['settings', 'common'])` 的标准写法（参考 `VendorDetailPanel.tsx:265`）并在 `formatRelativeTime` 传入 `t` 原样（项目 i18n 的 `t` 本身支持带命名空间前缀的 key）。

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx`
Expected: PASS (4 tests)

**Step 6: Typecheck**

Run: `npm run typecheck`
Expected: no errors

**Step 7: Lint**

Run: `npx eslint src/features/settings/components/DeepSeekBalanceBadge.tsx src/features/settings/components/useDeepSeekBalance.ts src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx src/features/settings/components/__tests__/useDeepSeekBalance.test.ts`
Expected: no errors

**Step 8: Commit**

```bash
git add src/features/settings/components/DeepSeekBalanceBadge.tsx src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx src/locales/en-US/settings.json src/locales/zh-CN/settings.json
git commit -m "feat(settings): add DeepSeek balance badge with refresh"
```

---

## Task 3: 挂载到供应商详情面板

**Files:**
- Modify: `src/features/settings/components/VendorDetailPanel.tsx`（标题行，约 748-764 行）
- Test: `src/features/settings/components/__tests__/VendorDetailPanel.responsiveEditor.test.tsx`（若该文件已覆盖标题行渲染，补充断言；否则不强制新增）

**Step 1: 阅读现状**

读 `VendorDetailPanel.tsx` 第 740-790 行，确认标题行结构：

```tsx
<div className="flex items-center gap-2 min-w-0">
  {selectedVendorIsSiliconflow && <SiliconFlowLogo className="h-5" />}
  ...
  <h3 className="text-lg font-medium text-foreground truncate">
    {vendorDisplayName}
  </h3>
  ...
```

**Step 2: 修改文件**

1. 在 import 区（`VendorDetailPanel.tsx` 顶部，约第 28 行 `import { SiliconFlowSection }` 附近）加入：

```tsx
import { DeepSeekBalanceBadge } from './DeepSeekBalanceBadge';
```

2. 在 `<h3>` 之后、SiliconFlow 推荐 Badge（约 765 行）之前插入：

```tsx
<DeepSeekBalanceBadge vendor={selectedVendor} />
```

**Step 3: 验证**

Run: `npx vitest run src/features/settings/components/__tests__/VendorDetailPanel.responsiveEditor.test.tsx`
Expected: PASS（若文件内已有 mock 覆盖 VendorDetailPanel 渲染；若该测试不渲染标题行则不受影响）

Run: `npm run typecheck`
Expected: no errors

**Step 4: Commit**

```bash
git add src/features/settings/components/VendorDetailPanel.tsx
git commit -m "feat(settings): mount DeepSeek balance badge in vendor detail panel"
```

---

## Task 4: 全量验证

**Step 1: 运行相关测试全集**

Run: `npx vitest run src/features/settings/components/__tests__/useDeepSeekBalance.test.ts src/features/settings/components/__tests__/DeepSeekBalanceBadge.test.tsx src/features/settings/components/__tests__/VendorDetailPanel.responsiveEditor.test.tsx`
Expected: ALL PASS

**Step 2: Typecheck + Lint**

Run: `npm run typecheck`
Run: `npx eslint src/features/settings/components/DeepSeekBalanceBadge.tsx src/features/settings/components/useDeepSeekBalance.ts`
Expected: no errors

**Step 3: 手动冒烟（可选）**

Run: `npm run dev`
打开设置 → API → DeepSeek 供应商：
- 已配 key：标题旁显示 `剩余 ¥xx.xx · 刚刚 · ↻`，点击 ↻ 重新请求并重置"刚刚"
- 清空 key：徽章消失
- 断网/错误 key：显示"查询失败"，点击重试
