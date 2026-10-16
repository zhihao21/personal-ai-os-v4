import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { refineHearthDashboard } from '../lib/hearth-refinement.mjs';

const vault = process.argv[2];
if (!vault) throw new Error('Pass the existing Obsidian vault path. Back it up first.');
const configPath = join(vault, '.obsidian', 'plugins', 'hearth', 'data.json');
const enabledPath = join(vault, '.obsidian', 'community-plugins.json');
const lazyPath = join(vault, '.obsidian', 'plugins', 'lazy-plugins', 'data.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const enabled = JSON.parse(await readFile(enabledPath, 'utf8'));
const home = config.dashboards?.find(d => d.id === 'dash-mvawm6fb-2495');
if (!home || !Array.isArray(home.cards)) throw new Error('Expected installed Hearth home dashboard was not found.');

const root = 'Personal AI OS V4 Prototype';
const path = child => `${root}/${child}`;
const card = (id, kind, title, x, y, w, h, extra = {}) => ({
  id: `unseen-${id}`, kind, title, x, y, w, h, ...extra,
});
const link = (id, label, target, icon) => ({ id, label, target: path(target), icon, type: 'note' });
const query = (id, title, x, y, w, h, dql) => card(id, 'dataview', title, x, y, w, h, {
  dataview: { query: dql, language: 'dql' },
});
const embed = (id, title, x, y, w, h, target) => card(id, 'embed', title, x, y, w, h, { target: path(target) });

home.name = 'The Unseen';
home.header = { showTitle: true, title: 'The Unseen', titleIcon: 'sparkles', themeColorTarget: 'none' };
home.showSearch = true;
home.compact = true;
home.fitToPage = false;
home.background = { kind: 'image', value: path('Assets/the-unseen-evening.png'), opacity: 0.98, blur: 0 };
home.backgroundLayout = 'full';
home.cards = [
  card('domains', 'links', 'Understand Yourself. Design Your Future. · 工作／學習／生活', 0, 0, 12, 2, {
    links: [
      link('work', '工作', '任務與行程.md', 'briefcase-business'),
      link('study', '學習', '學習脈絡.md', 'graduation-cap'),
      link('life', '生活', '生活管理.md', 'heart'),
    ], tileSizing: 'scale',
  }),
  card('daily', 'daily', '今天 · 生活日誌', 0, 2, 4, 4),
  query('focus', '今日重點 · 待辦', 4, 2, 4, 4,
    `TABLE WITHOUT ID file.link AS "任務", due AS "期限", priority AS "優先"\nFROM "${path('Records/Tasks')}"\nWHERE status != "done"\nSORT due ASC\nLIMIT 6`),
  query('week', '本週行程', 8, 2, 4, 4,
    `TABLE WITHOUT ID file.link AS "安排", starts_at AS "日期", domain AS "領域"\nFROM "${path('Records/Schedule')}"\nWHERE date(starts_at) >= date(today) AND date(starts_at) < date(today) + dur(7 days)\nSORT starts_at ASC`),
  query('next', '後續行程', 0, 6, 4, 3,
    `TABLE WITHOUT ID file.link AS "安排", starts_at AS "日期"\nFROM "${path('Records/Schedule')}"\nWHERE date(starts_at) >= date(today)\nSORT starts_at ASC\nLIMIT 4`),
  query('journal', 'Life Journal · 最近記錄', 4, 6, 4, 3,
    `TABLE WITHOUT ID file.link AS "日期", mood AS "心情", state AS "狀態"\nFROM "${path('Records/Journal')}"\nSORT date DESC\nLIMIT 4`),
  card('operations', 'links', '任務／專案／資源', 8, 6, 4, 3, {
    links: [
      link('tasks', '任務與行程', '任務與行程.md', 'list-todo'),
      link('projects', '專案', '專案脈絡.md', 'folder-kanban'),
      link('resources', '資源', 'Views/Resources.base', 'library'),
    ], tileSizing: 'scale',
  }),
  query('risk', 'Life Risk Analysis · 目前追蹤', 0, 9, 6, 3,
    `TABLE WITHOUT ID file.link AS "事件", severity AS "分級", next_action AS "下一步"\nFROM "${path('Records/Risks')}"\nWHERE lifecycle = "current"\nSORT occurred_at DESC`),
  query('aftereffect', 'Emotional Aftereffect · 情緒後效應', 6, 9, 6, 3,
    `TABLE WITHOUT ID file.link AS "事件", direction AS "方向", lifecycle AS "狀態", severity AS "分級"\nFROM "${path('Records/Risks')}"\nSORT lifecycle DESC, occurred_at DESC`),
  embed('mood', '心情與每日狀態趨勢', 0, 12, 8, 4, 'Assets/mood-trend.svg'),
  card('modules', 'links', '九個模組 · 導覽', 8, 12, 4, 4, {
    links: [
      link('overview', '每日總覽', '每日總覽.md', 'layout-dashboard'),
      link('life-journal', '生活日誌', '生活日誌.md', 'book-heart'),
      link('life-risk', '生活風險', '生活風險.md', 'shield-alert'),
      link('academic', '學習中心', '學習脈絡.md', 'graduation-cap'),
      link('project', '專案管理', '專案脈絡.md', 'folder-kanban'),
      link('analytics', 'AI 分析', '視覺分析.md', 'chart-no-axes-combined'),
      link('finance', '財務', '財務中心.md', 'wallet'),
      link('health', '健康健身', '健康與健身.md', 'activity'),
      link('goals', '目標與規劃', '目標與規劃.md', 'target'),
    ], tileSizing: 'scale',
  }),
  embed('progress', '任務進度 · 真實紀錄', 0, 16, 6, 3, 'Assets/activity.svg'),
  embed('risk-trend', '風險概覽 · 目前／歷史', 6, 16, 6, 3, 'Assets/risk-summary.svg'),
];

config.title = 'The Unseen';
config.openOnStartup = true;
config.replaceNewTabs = true;
config.activeDashboardId = home.id;
config.stackOnNarrow = true;
config.narrowWidth = 700;
config.mobileSearchOnly = false;
config.compact = true;
config.cardDesign = 'classic';
config.cardOpacity = 0.56;
config.cardBlur = 5;
config.cardBorderWidth = 1;
config.cardRadius = 14;
config.backgroundKind = 'image';
config.backgroundValue = path('Assets/the-unseen-evening.png');
config.backgroundOpacity = 0.98;
config.backgroundBlur = 0;
config.backgroundSkyDesign = 'classic';
config.disableExternalCalls = true;
config.liveRefresh = true;
config.searchEngine = 'builtin';
config.mobileActionButtons = [
  { id: 'action-daily-note', label: 'Daily note', icon: 'calendar', type: 'command', target: 'hearth:open-daily-note' },
];
refineHearthDashboard(config);
await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
if (!enabled.includes('hearth')) {
  enabled.push('hearth');
  await writeFile(enabledPath, JSON.stringify(enabled, null, 2) + '\n', 'utf8');
}
const lazy = JSON.parse(await readFile(lazyPath, 'utf8'));
if (lazy.desktop?.plugins?.hearth) {
  lazy.desktop.plugins.hearth.startupType = 'instant';
  await writeFile(lazyPath, JSON.stringify(lazy, null, 2) + '\n', 'utf8');
}
const dataviewPath = join(vault, '.obsidian', 'plugins', 'dataview', 'data.json');
const dataview = JSON.parse(await readFile(dataviewPath, 'utf8').catch(error => error.code === 'ENOENT' ? '{}' : Promise.reject(error)));
dataview.enableDataviewJs = true;
dataview.enableInlineDataviewJs = false;
await writeFile(dataviewPath, JSON.stringify(dataview, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({ dashboard: home.name, cards: home.cards.length, enabled: enabled.includes('hearth') }));
