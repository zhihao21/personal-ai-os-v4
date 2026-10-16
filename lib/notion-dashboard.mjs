const API = 'https://api.notion.com/v1';

export function textOf(property) {
  if (!property) return '';
  if (property.type === 'title' || property.type === 'rich_text') return (property[property.type] || []).map(part => part.plain_text || part.text?.content || '').join('');
  if (property.type === 'select' || property.type === 'status') return property[property.type]?.name || '';
  if (property.type === 'multi_select') return (property.multi_select || []).map(item => item.name).join('、');
  if (property.type === 'number') return property.number;
  if (property.type === 'formula') return property.formula?.number ?? property.formula?.string ?? '';
  if (property.type === 'date') return property.date?.start || '';
  if (property.type === 'checkbox') return property.checkbox;
  return '';
}

export function normalizeRows(kind, rows) {
  return rows.map(page => {
    const p = page.properties || {};
    const field = (...names) => names.map(name => textOf(p[name])).find(value => value !== '' && value !== null && value !== undefined) ?? '';
    const common = {id:page.id, url:page.url, title:field('名稱','任務','事件','標題','Name','Title'), date:field('日期','高峰時間','Due Date')};
    if (kind === 'tasks') return {...common, status:field('狀態','Status'), priority:field('優先級','優先順序','Priority'), category:field('類別','Category')};
    if (kind === 'schedule') return {...common, status:field('狀態','Status'), category:field('類別','Category')};
    if (kind === 'journal') return {...common, mood:field('心情分數'), state:field('今日狀態分數'), composite:field('每日綜合分數')};
    if (kind === 'risks') return {...common, direction:field('方向'), lifecycle:field('生命週期'), severity:field('風險分級'), domains:field('風險領域'), next:field('下一步')};
    if (kind === 'observations') return {...common, date:field('觀察時間'), mood:field('情緒觀察值')};
    return common;
  });
}

export async function querySource(token, id, fetcher=fetch) {
  if (!id) return [];
  const results=[]; let cursor;
  do {
    const response=await fetcher(`${API}/data_sources/${encodeURIComponent(id)}/query`,{
      method:'POST',headers:{Authorization:`Bearer ${token}`,'Notion-Version':'2026-03-11','Content-Type':'application/json'},
      body:JSON.stringify({page_size:100,...(cursor?{start_cursor:cursor}:{})})
    });
    if(!response.ok) throw Error(`Notion query failed (${response.status})`);
    const body=await response.json();results.push(...body.results);cursor=body.has_more?body.next_cursor:null;
  } while(cursor && results.length<500);
  return results;
}

export async function loadNotionDashboard(env=process.env,fetcher=fetch) {
  const token=env.NOTION_API_TOKEN;
  const links={hub:env.NOTION_HUB_URL||'',journal:env.NOTION_JOURNAL_URL||'',risks:env.NOTION_RISK_URL||''};
  if(!token) return {connected:false,reason:'尚未設定學校 Notion API 連線。',updatedAt:null,sources:{},links};
  const names={tasks:env.NOTION_TASK_SOURCE_ID,schedule:env.NOTION_SCHEDULE_SOURCE_ID,journal:env.NOTION_JOURNAL_SOURCE_ID,risks:env.NOTION_RISK_SOURCE_ID,observations:env.NOTION_OBSERVATION_SOURCE_ID,projects:env.NOTION_PROJECT_SOURCE_ID,resources:env.NOTION_RESOURCE_SOURCE_ID};
  const entries=await Promise.all(Object.entries(names).map(async([kind,id])=>[kind,id?normalizeRows(kind,await querySource(token,id,fetcher)):null]));
  return {connected:true,updatedAt:new Date().toISOString(),sources:Object.fromEntries(entries),links};
}
