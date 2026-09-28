'use strict';
/* 취업 준비 노트 — 모든 데이터는 이 브라우저 localStorage에만 저장된다. 서버는 URL 가져오기·AI 중계만 한다. */

// ───────── 상수 ─────────
const KEY = 'jobprep.v1';
const HEAD = [['org', '회사·활동명'], ['period', '기간'], ['position', '직책']];
const FIELDS = [['situation', '상황'], ['problem', '문제·목표'], ['myRole', '내 역할'], ['reason', '판단 이유'], ['action', '실행 내용'], ['collab', '협업'], ['result', '결과'], ['evidence', '근거 자료'], ['learned', '배운 점']];
const ALL = [...HEAD, ...FIELDS];
const LABEL = Object.fromEntries(ALL);
const QUESTIONS = {
  org: '어느 회사·활동에서 한 경험인가요?',
  period: '기간은 언제부터 언제까지였나요? (예: 2021.03 – 2023.08)',
  position: '그때 직책이나 역할명은 무엇이었나요?',
  situation: '그때 어떤 상황이었나요? (매장·팀 규모, 시기, 배경)',
  problem: '해결해야 했던 문제나 목표는 무엇이었나요?',
  myRole: '그 일에서 본인이 맡은 부분과 팀이 한 부분을 나눠 적어주세요.',
  reason: '왜 그 방법을 선택했나요? 다른 방법 대신 고른 이유가 있나요?',
  action: '구체적으로 무엇을 했나요? 대상·방법·순서를 적어보세요.',
  collab: '누구와 어떻게 협업했나요?',
  result: '어떤 결과가 있었나요? 수치가 없어도 괜찮습니다 — 만든 결과물, 맡은 범위, 받은 피드백, 바뀐 점을 적어도 됩니다.',
  evidence: '결과를 확인할 수 있는 자료가 있나요? (보고서, 평가, 사진, 메시지, 결과물 링크 등)',
  learned: '이 경험으로 배운 점은 무엇인가요?'
};
const PH = { action: '예: 신규 파트너 4주 온보딩 체크리스트를 만들고 매주 1:1로 점검', result: '수치가 없으면 결과물·범위·피드백으로', evidence: '예: 본사 평가표, 매출 보고서 캡처, 고객 후기' };
const LEVELS = { must: '제출 전 확인 필요', improve: '보완하면 설득력 향상', optional: '선택 사항' };
const JOB_STATUS = ['관심', '공고 분석 중', '서류 작성 중', '제출 완료', '결과 대기', '종료'];
const CATS = { duties: '주요 업무', required: '필수 자격요건', preferred: '우대사항', tools: '요구 도구·업무 지식', competencies: '반복해서 강조하는 역량', submission: '제출 서류·별도 작성 조건' };
const MAP_STATUS = { direct: '직접 경험이 확인됨', similar: '유사 경험을 통해 연결 가능함', unknown: '현재 입력된 정보로는 확인되지 않음' };
const STRATEGY = [['core', '문서에서 가장 먼저 보여줄 핵심 역량'], ['order', '우선 배치할 경험과 배치 이유'], ['summary', '이력서 요약문에 담을 메시지'], ['detail', '경력기술서에서 자세히 설명할 사례'], ['cut', '줄이거나 제외할 내용'], ['verify', '추가 확인이 필요한 사실과 자료']];
const FACT_CATS = { biz: '주요 사업·제품·서비스', customer: '주요 고객·판매·서비스 채널', brand: '브랜드 방향과 특징', role: '지원 직무와 사업의 연결', me: '내 경험 중 강조할 부분' };
const DOC_TYPES = { resume: '이력서', career: '경력기술서' };
const DOC_FIELDS = { resume: [['action', '주요 업무'], ['result', '성과']], career: [['situation', '배경'], ['problem', '목표'], ['myRole', '역할'], ['action', '실행'], ['result', '결과']] };
const LABELS = { resume: ['', '주요 업무', '성과'], career: ['배경', '목표', '역할', '실행', '결과'] };
const HINT = { '주요 업무': '예: 실제로 맡은 일 한 줄 (매장 운영, 재고 관리, 직원 스케줄 등)', '성과': '수치가 없으면 결과물·맡은 범위·받은 피드백으로', '배경': '어떤 상황이었나요?', '목표': '해결할 문제나 목표', '역할': '내가 맡은 부분 (팀이 한 부분과 구분)', '실행': '구체적으로 한 일', '결과': '결과 — 수치가 없으면 결과물·받은 피드백' };
const PRESETS = ['이 공고의 작성 전략에 맞춰서', '더 간결하게', '내 역할을 명확하게', '브랜드 운영 중심으로', '이 공고의 고객 경험 업무에 맞춰서', '과장된 표현 줄이기'];
const HYPE_RE = /(주도|총괄|달성|극대화|획기적|혁신|압도적|대폭|탁월|최고|최초|완벽|성공적|크게|많이|다양한|적극적)/g;
const NUM_RE = /\d[\d,.]*\s*(%|퍼센트|명|원|만원|억|건|개|배|위|회|시간|점|호점)/g;
const PERIOD_RE = /(대비|전년|전월|이전|개월|주간|분기|기간|\d+\s*년|\d+\s*월|동안)/;

// ───────── 유틸 ─────────
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const nowIso = () => new Date().toISOString();
const fmt = iso => iso ? new Date(iso).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';
const clone = o => JSON.parse(JSON.stringify(o));
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const uniq = a => [...new Set(a)];
const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
// 입력(source)에 없는 숫자·과장 표현을 찾는다. AI가 사실을 지어냈는지 걸러내는 최소 장치.
// 숫자는 통째로 비교한다 ('20'이 '2000' 안에 있다고 통과시키지 않도록). 2000.01 같은 값은 2000·01로도 인정.
const numTokens = t => (String(t || '').match(/\d[\d,.]*/g) || []).map(n => n.replace(/[,.]+$/, ''));
function unsupported(text, source) {
  const src = norm(source); const have = new Set(numTokens(source).flatMap(n => [n, n.replace(/,/g, ''), ...n.split(/[.,]/)]));
  return uniq([...numTokens(text).filter(n => !have.has(n) && !have.has(n.replace(/,/g, ''))), ...(String(text || '').match(HYPE_RE) || []).filter(w => !src.includes(w))]);
}
function hashId(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'r' + (h >>> 0).toString(36); }
function setPath(o, path, v) { const ks = path.split('.'); let t = o; for (const k of ks.slice(0, -1)) t = t[k] ??= {}; t[ks.at(-1)] = v; }
function sentenceWith(text, token) { return (String(text || '').split(/(?<=[.!?。])\s+|\n/).find(s => s.includes(token)) || text || '').trim(); }
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2600); }
// claude.ai에 배포된 페이지에서는 서버가 없고, 파일 저장·AI는 플랫폼 기능(downloads·sample)으로 한다.
// CLAUDE: claude.ai 아티팩트 안(플랫폼 AI·저장 사용) / HOSTED: 로컬 서버 없이 열린 모든 배포판(웹사이트 포함)
const CLAUDE = typeof window.claude?.use === 'function';
const HOSTED = CLAUDE || !/^(127\.0\.0\.1|localhost)$/.test(location.hostname);
const cap = name => CLAUDE ? window.claude.use(name).catch(() => null) : Promise.resolve(null);
async function download(name, text, type = 'text/plain') {
  if (CLAUDE) {
    const dl = await cap('downloads');
    if (!dl) { UI.saveFallback = { name, text }; render(); return; }
    try { await dl.save({ filename: name, data: text }); toast('저장했습니다.'); }
    catch (e) { if (e?.code === 'declined') toast('저장을 취소했습니다.'); else { UI.saveFallback = { name, text }; render(); } }
    return;
  }
  downloadLocal(name, text, type);
}
function downloadLocal(name, text, type = 'text/plain') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' })); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
async function copyText(t) { try { await Promise.race([navigator.clipboard.writeText(t), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 1500))]); return true; } catch { const x = document.createElement('textarea'); x.value = t; document.body.append(x); x.select(); const ok = document.execCommand('copy'); x.remove(); return ok; } }
function dday(d) { if (!d) return ''; const n = Math.ceil((new Date(d + 'T23:59:59') - new Date()) / 864e5); return n < 0 ? '마감 지남' : n === 0 ? '오늘 마감' : `D-${n}`; }

// ───────── 저장 ─────────
const blank = () => ({ version: 1, experiences: [], jobs: [], docs: [] });
const valid = s => s && s.version === 1 && Array.isArray(s.experiences) && Array.isArray(s.jobs) && Array.isArray(s.docs);
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); const s = JSON.parse(raw || 'null'); if (valid(s)) return s; } catch { }
  if (raw) try { localStorage.setItem(KEY + '.broken.' + Date.now(), raw); } catch { } // 깨진 데이터는 덮어쓰기 전에 보관
  return blank();
}
let S = load();
let saveTimer = null;
function setSave(t, cls = '') { const el = $('#save'); el.textContent = t; el.className = 'save ' + cls; }
function save() { setSave('저장 중…'); clearTimeout(saveTimer); saveTimer = setTimeout(flush, 350); }
function flush() {
  clearTimeout(saveTimer); saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(S)); setSave('저장됨 ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), 'ok'); }
  catch (e) { setSave('저장 실패 — JSON 백업을 받아두세요 (' + e.name + ')', 'err'); }
}
addEventListener('pagehide', () => { if (saveTimer) flush(); });
// ponytail: 탭 간 동기화는 '마지막 저장 우선'. 두 탭에서 0.35초 안에 동시에 입력하면 한쪽 입력이 빠질 수 있다. 필요해지면 항목 단위 병합으로.
addEventListener('storage', e => {
  if (e.key !== KEY || e.storageArea !== localStorage) return;
  let s; try { s = JSON.parse(e.newValue || 'null'); } catch { return; }
  if (!valid(s)) return;
  const lost = !!saveTimer; clearTimeout(saveTimer); saveTimer = null; S = s;
  setSave(lost ? '다른 탭의 저장을 불러옴 — 이 탭의 마지막 입력을 확인하세요' : '다른 탭에서 저장한 내용을 불러옴', lost ? 'err' : 'ok');
  render();
});
addEventListener('beforeunload', () => { if (saveTimer) flush(); });

const exp = id => S.experiences.find(x => x.id === id);
const job = id => S.jobs.find(x => x.id === id);
const doc = id => S.docs.find(x => x.id === id);
const val = (e, k) => (HEAD.some(h => h[0] === k) ? e[k] : e.f?.[k]) || '';
const bpath = (e, k) => HEAD.some(h => h[0] === k) ? `exp:${e.id}:${k}` : `exp:${e.id}:f.${k}`;
const snap = e => clone({ org: e.org, period: e.period, position: e.position, f: e.f, unknown: e.unknown });
const expName = e => e ? (e.org || '제목 없는 경험') + (e.position ? ` · ${e.position}` : '') : '(삭제된 경험)';

// ───────── 서버·AI ─────────
let AI = { ok: false, server: false, model: '' };
const FETCH_API = 'https://job-prep-fetch.vercel.app/api/fetch'; // 공고·자료 URL 가져오기 (fetch-api/)
async function api(path, body) {
  const url = path === '/api/fetch' ? FETCH_API : path;
  if (HOSTED && url === path) return { ok: false, reason: '배포된 사이트에는 서버 기능이 없습니다.' };
  try {
    const r = await fetch(url, { method: body ? 'POST' : 'GET', headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return await r.json().catch(() => ({ ok: false, reason: `서버 응답을 읽지 못했습니다 (HTTP ${r.status})` }));
  } catch { if (url === FETCH_API) return { ok: false, reason: '공고 가져오기 서버에 연결하지 못했습니다. 인터넷 연결을 확인하고 다시 눌러주세요.' }; return { ok: false, reason: '로컬 서버에 연결되지 않았습니다. 터미널에서 python3 server.py 로 실행한 주소(http://127.0.0.1:8790)로 열었는지 확인하세요.' }; }
}
async function checkAI() {
  if (HOSTED) {
    const sample = await cap('sample');
    AI = { ok: !!sample, server: false, model: '내 Claude 계정', sample };
  } else { const r = await api('/api/status'); AI = { ok: !!r.ai, server: !!r.ok, model: r.model || '' }; }
  checkAILabel();
}
function checkAILabel() {
  const el = $('#aist');
  el.textContent = AI.ok ? `AI 연결됨 (${AI.model})` : HOSTED ? 'AI 미연결 · 수동 흐름 사용' : !AI.server ? '서버 없음 · AI·URL 가져오기 불가' : 'AI 미연결 · 수동 흐름 사용';
  el.className = 'aist' + (AI.ok ? ' on' : '');
}

const SYS = `너는 지원자의 이력서·경력기술서 작성을 돕는 코치다. 반드시 지킬 규칙:
1. 입력에 없는 사실(근무 기간·직책·자격·수치·성과·교육 인원·상승률)을 만들지 않는다.
2. 확인되지 않은 내용은 "확인 필요"로 표시하고 확정 문장처럼 쓰지 않는다.
3. 목표와 달성 결과, 팀 성과와 개인 기여를 구분한다.
4. "주도·총괄·달성"은 입력에 실제 역할·결과 근거가 있을 때만 쓴다.
5. 유사 경험을 직접 경력으로 바꾸지 않는다. 회사의 가치 문구를 지원자 특성처럼 복사하지 않는다. 키워드를 기계적으로 반복하지 않는다.
6. 수치가 없다는 이유로 경험을 낮게 평가하지 않는다. 결과물·업무 범위·확인된 피드백도 근거다.
7. 종합 점수나 합격 가능성을 말하지 않는다.
8. 출력은 요청한 JSON 객체 하나만. 코드블록 표시나 설명 문장 없이.`;

const expBrief = e => ({ id: e.id, org: e.org, period: e.period, position: e.position, ...Object.fromEntries(FIELDS.map(([k]) => [k, e.f?.[k] || ''])), unknown: Object.keys(e.unknown || {}).filter(k => e.unknown[k]) });
const realExps = j => S.experiences.filter(e => j?.sample || !e.sample);
const reqs = j => j?.analysis ? ['duties', 'required', 'preferred'].flatMap(c => (j.analysis.cats[c] || []).map(x => ({ ...x, cat: c }))) : [];

const TASKS = {
  organize: {
    build(id) {
      const e = exp(id); if (!e.raw?.trim()) throw new Error('자유 입력 원문이 비어 있습니다. 먼저 원문을 적어주세요.');
      return `아래는 지원자가 두서없이 적은 경험 원문이다. 원문에 있는 내용만으로 항목을 나눠 정리하라. 원문에 없는 항목은 빈 문자열로 두고 그 항목 키를 unknown 배열에 넣어라. 표현을 부풀리지 말라.
항목 키: org(회사·활동명), period(기간), position(직책), situation(상황), problem(문제·목표), myRole(내 역할), reason(판단 이유), action(실행 내용), collab(협업), result(결과), evidence(근거 자료), learned(배운 점)
출력 형식: {"org":"","period":"","position":"","situation":"","problem":"","myRole":"","reason":"","action":"","collab":"","result":"","evidence":"","learned":"","unknown":[],"notes":"정리하면서 애매했던 점"}

원문:
"""
${e.raw}
"""`;
    },
    apply(id, o) {
      const e = exp(id); const fields = {};
      for (const [k] of ALL) if (typeof o[k] === 'string' && o[k].trim()) fields[k] = o[k].trim();
      if (!Object.keys(fields).length) throw new Error('응답에 정리된 항목이 없습니다.');
      const source = [e.raw, ...ALL.map(([k]) => val(e, k))].join('\n'); const warn = {};
      for (const [k, v] of Object.entries(fields)) {
        const bad = HEAD.some(h => h[0] === k) ? (norm(source).includes(norm(v)) ? [] : [v]) : unsupported(v, source);
        if (bad.length) warn[k] = bad;
      }
      e.aiDraft = { fields, warn, unknown: Array.isArray(o.unknown) ? o.unknown : [], notes: String(o.notes || ''), at: nowIso() };
      const nw = Object.keys(warn).length;
      return 'AI 정리본을 받았습니다. 아래에서 항목별로 사실관계를 확인하고 반영하세요. 반영하기 전까지 경험 원본은 바뀌지 않습니다.' + (nw ? `\n원문·입력에 없는 표현이 들어간 항목 ${nw}개를 표시했습니다. 반영하면 '확인 필요'로 표시됩니다.` : '');
    }
  },
  feedback: {
    build(id) {
      const e = exp(id);
      const answered = e.feedback.filter(x => x.answer?.trim()).map(x => ({ question: x.question, answer: x.answer }));
      return `아래 경험을 점검해 부족한 부분을 짚고 추가 질문을 만들어라.
점검 기준: 상황과 문제를 이해할 수 있는가 / 본인 역할과 팀 역할이 구분되는가 / 직접 한 행동이 구체적인가 / 왜 그 방법을 선택했는지 드러나는가 / 결과가 목표·행동과 연결되는가 / 수치와 주장에 확인 가능한 근거가 있는가(기간·단위·비교 기준 포함) / 과장되거나 모호한 표현이 있는가.
수치가 없으면 결과물·업무 범위·확인된 피드백으로 설명할 수 있는지도 질문하라. 예: "직원 교육으로 매출을 높였다"면 교육 대상과 내용, 본인 역할, 변화 측정 기간, 다른 영향 요인을 묻는다. 존재하지 않는 수치를 예시로 넣지 말라.
level: must(제출 전 확인 필요) / improve(보완하면 설득력 향상) / optional(선택 사항). 점수는 매기지 않는다.
quote는 입력에 있는 문장을 그대로 옮긴다(비어 있는 항목이면 빈 문자열).
이미 답한 질문(answered)과 같은 내용은 다시 묻지 말라.
출력 형식: {"items":[{"field":"항목키","quote":"","issue":"부족한 부분","why":"보완이 필요한 이유","question":"추가 질문","level":"must|improve|optional"}]}

경험: ${JSON.stringify(expBrief(e))}
answered: ${JSON.stringify(answered)}`;
    },
    apply(id, o) {
      const e = exp(id); if (!Array.isArray(o.items)) throw new Error('items 배열이 없습니다.');
      const asked = new Set(e.feedback.map(x => norm(x.question)));
      let n = 0;
      for (const x of o.items) {
        if (!x || !x.question || asked.has(norm(x.question))) continue;
        const field = LABEL[x.field] ? x.field : 'result';
        e.feedback.unshift({ id: uid(), key: 'ai-' + hashId(x.question), field, quote: String(x.quote || val(e, field)), issue: String(x.issue || ''), why: String(x.why || ''), question: String(x.question), level: LEVELS[x.level] ? x.level : 'improve', status: 'open', answer: '', source: 'AI' });
        n++;
      }
      if (!e.fbBase) e.fbBase = snap(e);
      e.fbAt = nowIso();
      return `AI 피드백 ${n}개를 추가했습니다${o.items.length > n ? ` (이미 물은 질문 ${o.items.length - n}개 제외)` : ''}.`;
    }
  },
  proposal: {
    build(id) {
      const e = exp(id);
      const items = e.feedback.filter(x => x.status === 'open' && x.answer?.trim()).map(x => ({ itemId: x.id, field: x.field, fieldLabel: LABEL[x.field], current: val(e, x.field), question: x.question, answer: x.answer }));
      if (!items.length) throw new Error('답변을 적은 피드백이 없습니다. 추가 질문에 먼저 답해주세요.');
      return `지원자가 추가 질문에 답했다. 각 항목(field)의 현재 내용(current)과 답변(answer)만 사용해 그 항목 전체의 수정안(after)을 써라. 답변에 없는 수치·성과·기간을 추가하지 말라. 답변이 "모름/확인 필요"면 그 부분은 "확인 필요"로 남겨라.
출력 형식: {"proposals":[{"itemId":"","after":"항목 전체 수정안","reason":"무엇을 어떻게 바꿨는지 한 줄"}]}

${JSON.stringify(items)}`;
    },
    apply(id, o) {
      const e = exp(id); if (!Array.isArray(o.proposals)) throw new Error('proposals 배열이 없습니다.');
      let n = 0;
      for (const p of o.proposals) { const it = e.feedback.find(x => x.id === p.itemId); if (!it || typeof p.after !== 'string') continue; const bad = unsupported(p.after, val(e, it.field) + '\n' + it.answer); it.proposal = { before: val(e, it.field), after: p.after, reason: String(p.reason || ''), source: 'AI', warn: bad.length ? `현재 내용·답변에 없는 표현(${bad.join(', ')}) 포함 — 적용하면 '확인 필요'로 표시됩니다` : '' }; n++; }
      if (!n) throw new Error('응답의 itemId가 현재 피드백과 맞지 않습니다.');
      return `수정안 ${n}개를 받았습니다. 각각 확인하고 적용하세요.`;
    }
  },
  posting: {
    build(id) {
      const j = job(id); if (!j.postingText?.trim()) throw new Error('공고 본문이 비어 있습니다. [공고] 탭에서 본문을 붙여넣어 주세요.');
      return `아래 채용공고 본문을 분석하라. 공고에 명시된 내용은 카테고리별로 나누고, 각 항목에 근거가 되는 원문 문장을 quote에 그대로 옮겨라(요약·변형 금지). 명시되지 않았지만 읽어낼 수 있는 해석은 interpreted에만 넣고 그 근거 원문도 quote에 둔다.
카테고리: duties(주요 업무), required(필수 자격요건), preferred(우대사항), tools(요구 도구와 업무 지식), competencies(반복해서 강조하는 역량), submission(제출 서류와 별도 작성 조건)
출력 형식: {"duties":[{"text":"","quote":""}],"required":[],"preferred":[],"tools":[],"competencies":[],"submission":[],"interpreted":[{"text":"","quote":""}]}

회사: ${j.company} / 직무: ${j.position}
공고 본문:
"""
${j.postingText}
"""`;
    },
    apply(id, o) {
      const j = job(id); const posting = norm(j.postingText); const cats = {};
      const mk = x => ({ id: hashId(String(x.text)), text: String(x.text), quote: String(x.quote || ''), quoteOk: !!x.quote && posting.includes(norm(x.quote)) });
      for (const c of Object.keys(CATS)) cats[c] = Array.isArray(o[c]) ? o[c].filter(x => x?.text).map(mk) : [];
      if (!Object.values(cats).some(a => a.length)) throw new Error('카테고리별 항목이 하나도 없습니다.');
      j.analysis = { at: nowIso(), source: 'AI 분석', posting: j.postingText, postingSource: j.postingSource, url: j.url, cats, interpreted: Array.isArray(o.interpreted) ? o.interpreted.filter(x => x?.text).map(mk) : [], unclassified: [] };
      const bad = [...Object.values(cats).flat(), ...j.analysis.interpreted].filter(x => !x.quoteOk).length;
      return 'AI 분석을 반영했습니다.' + (bad ? ` 원문에서 찾지 못한 인용 ${bad}개는 '원문 확인 안 됨'으로 표시했습니다.` : '');
    }
  },
  company: {
    build(id) {
      const j = job(id); const src = j.sources.filter(s => s.text?.trim());
      if (!src.length) throw new Error('분석할 자료가 없습니다. 공식 홈페이지·채용 페이지·서비스 소개 내용을 자료로 추가해주세요.');
      return `아래는 지원자가 직접 가져온 회사 공식 자료다. 이 자료만 근거로 회사를 분석하라. 자료 밖의 지식(검색·기억)은 쓰지 말라.
cat: biz(주요 사업·제품·서비스), customer(주요 고객과 판매·서비스 채널), brand(공식 자료에서 확인되는 브랜드 방향과 특징), role(지원 직무가 담당할 업무와 사업의 연결), me(지원자 경험 중 강조할 부분과 이유)
kind: "사실"(자료에 적혀 있음 — srcId와 quote 필수) 또는 "해석"(자료를 바탕으로 한 추론).
implication: 이 정보가 지원 문서의 어떤 작성 방향으로 이어지는지. 실제로 하지 않은 업무를 회사에 맞춘다는 이유로 추가하지 말라. me 항목의 expIds는 아래 경험 목록의 id만 쓴다.
출력 형식: {"facts":[{"cat":"biz","kind":"사실","text":"","srcId":"","quote":"","implication":"","expIds":[]}]}

지원 직무: ${j.company} / ${j.position}
공고 주요 업무: ${JSON.stringify((j.analysis?.cats.duties || []).map(x => x.text))}
자료: ${JSON.stringify(src.map(s => ({ srcId: s.id, title: s.title, url: s.url, checkedAt: s.at, text: s.text.slice(0, 8000) })))}
지원자 경험 요약: ${JSON.stringify(realExps(j).map(e => ({ id: e.id, org: e.org, position: e.position, problem: e.f?.problem || '', action: (e.f?.action || '').slice(0, 300), result: (e.f?.result || '').slice(0, 300) })))}`;
    },
    apply(id, o) {
      const j = job(id); if (!Array.isArray(o.facts)) throw new Error('facts 배열이 없습니다.');
      let n = 0;
      for (const f of o.facts) {
        if (!f?.text) continue;
        const s = j.sources.find(x => x.id === f.srcId);
        const quoteOk = !!(s && f.quote && norm(s.text).includes(norm(f.quote)));
        j.facts.push({ id: uid(), cat: FACT_CATS[f.cat] ? f.cat : 'biz', kind: f.kind === '사실' && s ? '사실' : '해석', text: String(f.text), srcId: s ? s.id : '', quote: String(f.quote || ''), quoteOk, implication: String(f.implication || ''), expIds: (f.expIds || []).filter(exp), source: 'AI' });
        n++;
      }
      return `AI 분석 항목 ${n}개를 추가했습니다. 출처 없는 '사실'은 '해석'으로 바꿔 표시했습니다.`;
    }
  },
  match: {
    build(id) {
      const j = job(id); const R = reqs(j);
      if (!R.length) throw new Error('요구사항이 없습니다. [요구사항] 탭에서 먼저 공고를 분석하세요.');
      const E = realExps(j); if (!E.length) throw new Error('연결할 경험이 없습니다. 경험 보관함에 경험을 먼저 추가하세요.');
      return `공고의 각 요구사항과 지원자 경험을 비교하라.
status: direct(직접 경험이 확인됨) / similar(유사 경험을 통해 연결 가능함) / unknown(현재 입력된 정보로는 확인되지 않음).
unknown은 "경험이 없다"는 뜻이 아니다. unknown이면 question에 지원자에게 물어볼 질문을 쓴다. 유사 경험을 직접 경험으로 올려 판정하지 말라.
basis(연결 근거)는 경험에 실제로 적힌 내용만 인용해 쓴다. gap(부족한 근거), direction(작성 방향)을 쓴다.
strategy: core(가장 먼저 보여줄 핵심 역량), order(우선 배치할 경험과 이유), summary(이력서 요약문 메시지), detail(경력기술서에서 자세히 설명할 사례), cut(줄이거나 제외할 내용), verify(추가 확인이 필요한 사실과 자료). 회사 가치 문구를 지원자 특성처럼 복사하지 말라.
출력 형식: {"mapping":[{"reqId":"","status":"direct|similar|unknown","expIds":[],"basis":"","gap":"","direction":"","question":""}],"strategy":{"core":"","order":"","summary":"","detail":"","cut":"","verify":""}}

지원: ${j.company} / ${j.position}
요구사항: ${JSON.stringify(R.map(r => ({ reqId: r.id, cat: CATS[r.cat], text: r.text })))}
회사 분석(지원자가 확인한 것): ${JSON.stringify(j.facts.map(f => ({ kind: f.kind, text: f.text, implication: f.implication })))}
경험: ${JSON.stringify(E.map(expBrief))}`;
    },
    apply(id, o) {
      const j = job(id); if (!Array.isArray(o.mapping)) throw new Error('mapping 배열이 없습니다.');
      const ids = new Set(reqs(j).map(r => r.id)); let n = 0;
      for (const m of o.mapping) {
        if (!ids.has(m.reqId)) continue;
        const row = j.mapping[m.reqId] ??= { status: 'unknown', expIds: [], basis: '', gap: '', direction: '', answer: '' };
        const sug = { status: MAP_STATUS[m.status] ? m.status : 'unknown', expIds: (m.expIds || []).filter(exp), basis: String(m.basis || ''), gap: String(m.gap || ''), direction: String(m.direction || ''), question: String(m.question || '') };
        row.ai = sug;
        if (!row.touched) Object.assign(row, { status: sug.status, expIds: sug.expIds, basis: sug.basis, gap: sug.gap, direction: sug.direction });
        n++;
      }
      if (o.strategy && typeof o.strategy === 'object') { j.strategyAI = {}; for (const [k] of STRATEGY) if (o.strategy[k]) { j.strategyAI[k] = String(o.strategy[k]); if (!j.strategy[k]?.trim()) j.strategy[k] = j.strategyAI[k]; } }
      return `요구사항 ${n}개 연결 제안을 받았습니다. 직접 수정한 행은 덮어쓰지 않고 'AI 제안'으로만 표시합니다.`;
    }
  },
  sent: {
    build(ctx) {
      const [id, sid] = ctx.split('|'), d = doc(id), s = d?.sentences.find(x => x.id === sid); if (!s) throw new Error('문장을 찾지 못했습니다.');
      const qa = sentChecks(d, s).filter(c => s.qa?.[c.key]?.trim()).map(c => ({ issue: c.issue, question: c.question, answer: s.qa[c.key].trim() }));
      if (!qa.length) throw new Error('오른쪽 추가 질문에 먼저 답해주세요. 답변이 수정의 근거가 됩니다.');
      const j = job(d.jobId);
      return `지원 문서의 문장 하나를 지원자의 답변을 반영해 다시 써라. 규칙:
- 근거는 '지금 문장', '답변', '경험 원본'에만 있다. 거기에 없는 수치·성과·기간·직책을 넣지 않는다.
- 답변이 "모름/확인 필요/확인 불가"면 그 부분은 빼거나 "확인 필요"로 남긴다.
- 이력서 문장처럼 짧게(한 문장, 길어도 두 문장). 과장 표현(주도·총괄·극대화 등)은 답변에 근거가 있을 때만.
출력 형식: {"after":"수정 문장","reason":"무엇을 어떻게 바꿨는지 한 줄"}

문서: ${DOC_TYPES[d.type]}${j ? ` / 지원: ${j.company} ${j.position}` : ' / 공통 문서'}
섹션: ${gTitle(d.groups.find(g => g.key === s.grp) || {}) || ''} / 소제목: ${s.label || '없음'}
지금 문장: ${JSON.stringify(s.text)}
답변: ${JSON.stringify(qa)}
경험 원본: ${JSON.stringify(s.expIds.map(exp).filter(Boolean).map(expBrief))}`;
    },
    apply(ctx, o) {
      const [id, sid] = ctx.split('|'), d = doc(id), s = d.sentences.find(x => x.id === sid);
      if (typeof o.after !== 'string' || !o.after.trim()) throw new Error('after(수정 문장)가 없습니다.');
      const keys = sentChecks(d, s).filter(c => s.qa?.[c.key]?.trim()).map(c => c.key);
      const bad = unsupported(o.after, s.text + '\n' + keys.map(k => s.qa[k]).join('\n') + '\n' + s.expIds.map(exp).filter(Boolean).map(e => JSON.stringify(expBrief(e))).join('\n'));
      s.prop = { keys, before: s.text, after: o.after.trim(), reason: String(o.reason || ''), source: 'AI', warn: bad.length ? `지금 문장·답변에 없는 표현(${bad.join(', ')}) 포함 — 적용하면 '확인 필요'로 표시됩니다` : '', bad: bad.join(', ') };
      return '수정안을 받았습니다. 위에서 지금 문장과 비교한 뒤 적용하세요.';
    }
  },
  revise: {
    build(id) {
      const d = doc(id); const j = job(d.jobId);
      if (!d.revInstr?.trim()) throw new Error('수정 요청을 먼저 고르거나 적어주세요.');
      const rq = d.revReq && reqs(j).find(x => x.id === d.revReq);
      const expIds = uniq([...d.sentences.flatMap(s => s.expIds), ...(rq ? j.mapping[rq.id]?.expIds || [] : [])]);
      return `지원 문서의 문장을 수정 요청에 맞게 고쳐라. 규칙:
- 근거는 아래 '기본 문서 원문'과 '경험 원본'에만 있다. 거기에 없는 사실·수치·직책·성과를 넣지 않는다. 순서·강조·표현만 바꾼다.
- 바꿀 필요가 없는 문장은 changes에 넣지 않는다.
- edited:true 문장은 지원자가 직접 고친 문장이다. 요청 방향 외에 사실을 바꾸지 않는다.
- unverified:true 문장은 미확인 사실이다. 확정 표현으로 바꾸지 않는다.
- 새 문장이 꼭 필요하면 add에 넣되 expIds로 근거 경험을 밝힌다. changes에도 근거로 쓴 경험 id를 expIds로 적는다.
출력 형식: {"changes":[{"id":"문장 id","after":"수정 문장","reason":"수정 이유","expIds":[]}],"add":[{"grp":"그룹 key","label":"","text":"","expIds":[],"reason":""}]}

수정 요청: ${d.revInstr}
문서 종류: ${DOC_TYPES[d.type]} / 지원: ${j ? j.company + ' ' + j.position : ''}
공고 요구사항: ${JSON.stringify(reqs(j).map(r => r.text))}
이 공고의 작성 전략(지원자가 정한 것): ${JSON.stringify(j?.strategy || {})}
요구사항별 연결·작성 방향: ${JSON.stringify(reqs(j).map(r => ({ req: r.text, ...(j.mapping[r.id] ? { status: j.mapping[r.id].status, expIds: j.mapping[r.id].expIds, direction: j.mapping[r.id].direction } : {}) })).filter(x => x.expIds?.length || x.direction))}
문장: ${JSON.stringify(d.sentences.map(s => ({ id: s.id, grp: s.grp, group: d.groups.find(g => g.key === s.grp)?.title, label: s.label, text: s.text, edited: !!s.edited, unverified: !!s.unverified })))}
기본 문서 원문: ${JSON.stringify(isMaster(d) ? allText(d) : baseSrc(d))}
경험 원본: ${JSON.stringify(expIds.map(exp).filter(Boolean).map(expBrief))}`;
    },
    apply(id, o) {
      const d = doc(id); const changes = [];
      const rq = d.revReq && reqs(job(d.jobId)).find(x => x.id === d.revReq);
      const srcText = d.sentences.filter(s => !s.unverified).map(s => s.text).join(' ') + ' ' + baseSrc(d) + ' ' + // 미확인 문장은 근거로 치지 않는다
        uniq([...d.sentences.flatMap(s => s.expIds), ...(rq ? job(d.jobId).mapping[rq.id]?.expIds || [] : [])]).map(exp).filter(Boolean).map(e => JSON.stringify(expBrief(e))).join(' ');
      const newNums = t => unsupported(t, srcText);
      for (const c of o.changes || []) {
        const s = d.sentences.find(x => x.id === c.id); if (!s || typeof c.after !== 'string' || c.after.trim() === s.text.trim()) continue;
        const bad = newNums(c.after);
        changes.push({ id: uid(), ids: [s.id], grp: s.grp, label: s.label, field: s.field, expIds: uniq([...s.expIds, ...(c.expIds || []).filter(exp)]), before: s.text, after: c.after.trim(), reason: String(c.reason || ''), warn: bad.length ? `원본에 없는 수치·표현(${bad.join(', ')}) 포함 — 적용하면 미확인 문장으로 표시됩니다` : '', unverified: s.unverified || bad.length > 0, edited: s.edited, status: 'pending' });
      }
      for (const a of o.add || []) {
        if (!a?.text) continue;
        const g = d.groups.find(x => x.key === a.grp) || d.groups[0]; const bad = newNums(a.text);
        changes.push({ id: uid(), ids: [], grp: g.key, label: String(a.label || ''), field: '', expIds: (a.expIds || []).filter(exp), before: '', after: String(a.text), reason: '(새 문장) ' + String(a.reason || ''), warn: bad.length ? `원본에 없는 수치·표현(${bad.join(', ')}) 포함 — 적용하면 미확인 문장으로 표시됩니다` : '', unverified: bad.length > 0, status: 'pending' });
      }
      if (!changes.length) throw new Error('바뀐 문장이 없습니다. 응답의 문장 id가 현재 문서와 맞는지 확인하세요.');
      d.revision = { instr: d.revInstr, at: nowIso(), source: 'AI', changes };
      return `수정안 ${changes.length}개를 받았습니다. 문장별로 적용하거나 전체 적용하세요.`;
    }
  }
};

function parseJson(text) {
  const t = String(text || '').replace(/```(?:json)?/g, '');
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('응답에서 JSON 객체를 찾지 못했습니다. 응답 전체를 빠짐없이 붙여넣었는지 확인하세요.');
  try { return JSON.parse(t.slice(a, b + 1)); } catch (e) { throw new Error('JSON 형식이 깨져 있습니다: ' + e.message); }
}
function aiApply(task, ctx, text) {
  const key = task + ':' + ctx;
  try { const msg = TASKS[task].apply(ctx, parseJson(text)); UI.aiMsg[key] = { type: 'ok', text: msg }; save(); }
  catch (e) { UI.aiMsg[key] = { type: 'err', text: '분석 결과를 반영하지 못했습니다: ' + e.message + '\n기존 데이터는 바뀌지 않았습니다.' }; }
}
function aiPanel(task, ctx, title, note = '') {
  const key = task + ':' + ctx; const m = UI.aiMsg[key]; const busy = UI.busy[key];
  return `<div class="ai-panel no-print">
  <div class="ai-head"><strong>${title}</strong> ${AI.ok ? `<span class="badge ok">AI 연결됨</span>` : `<span class="badge off">AI 미연결</span>`}</div>
  ${note ? `<p class="hint">${note}</p>` : ''}
  <div class="row">
    ${AI.ok ? btn('aiRun', busy ? '분석 중…' : 'AI로 실행', { t: task, c: ctx }, 'primary', busy) : ''}
    ${btn('aiCopy', 'Claude에 보낼 요청문 복사', { t: task, c: ctx })}
    ${btn('aiDownload', '요청문 .txt 저장', { t: task, c: ctx }, 'quiet')}
  </div>
  ${AI.ok && AI.sample ? `<p class="hint">[AI로 실행]은 내 Claude 계정 사용량으로 실행됩니다. 처음 한 번 허용할지 묻습니다. 답이 나오기까지 30초~1분쯤 걸릴 수 있습니다.</p>` : ''}
  ${AI.ok ? '' : `<p class="hint">이 사이트 안의 AI는 연결되지 않았습니다. 요청문을 복사해 Claude(claude.ai 등)에 붙여넣고, 받은 답을 아래에 붙여넣으면 같은 방식으로 반영됩니다.</p>`}
  ${UI.prompts[key] ? `<details><summary>복사한 요청문 보기</summary><pre>${esc(UI.prompts[key])}</pre></details>` : ''}
  <details ${UI.pasteOpen[key] ? 'open' : ''}><summary>Claude 응답 붙여넣기</summary>
    <textarea id="paste-${esc(key)}" rows="5" placeholder="Claude가 준 답(JSON)을 그대로 붙여넣으세요."></textarea>
    <div class="row">${btn('aiPaste', '응답 반영', { t: task, c: ctx })}</div>
  </details>
  ${m ? `<p class="msg ${m.type}">${esc(m.text)}</p>` : ''}
</div>`;
}

// ───────── 규칙 기반 점검 (AI 없이 작동) ─────────
function rules(e) {
  const f = e.f || {}, u = e.unknown || {}, out = [];
  const add = (key, field, level, issue, why, question, quote) => out.push({ key, field, level, issue, why, question, quote: quote ?? val(e, field) });
  for (const [k, l] of HEAD) if (!e[k]?.trim()) add('empty-' + k, k, 'must', `'${l}' 칸이 비어 있음`, '경력 사실은 문서에서 정확해야 합니다. 비어 있으면 제출 문서에 넣을 수 없습니다.', QUESTIONS[k]);
  for (const [k, l] of ALL) if (u[k]) add('unknown-' + k, k, 'must', `'확인 필요'로 표시됨`, '확인되지 않은 사실은 제출용 문장에 넣지 않습니다.', `${l}을(를) 확인할 수 있나요? 확인한 내용을 적어주세요.`);
  if (!f.situation?.trim() && !f.problem?.trim()) add('ctx', 'situation', 'must', '상황과 문제·목표가 모두 비어 있음', '왜 이 일을 했는지 모르면 행동과 결과의 의미가 전달되지 않습니다.', '그때 어떤 상황이었고, 무엇이 문제였거나 목표였나요?');
  const act = f.action || '', res = f.result || '';
  if (!f.myRole?.trim()) add('role', 'myRole', 'must', '본인 역할이 비어 있음', '팀 성과와 개인 기여가 구분되지 않으면 면접에서 검증될 때 설명하기 어렵습니다.', QUESTIONS.myRole);
  else if (/(우리|팀|함께|다 같이|전원)/.test(act + res) && !/(내가|제가|직접|담당|맡)/.test(f.myRole + act)) add('role-split', 'myRole', 'improve', '팀의 행동과 내 행동이 섞여 있음', '"우리·팀" 표현만 있으면 어디까지가 본인 몫인지 알 수 없습니다.', '이 중 본인이 직접 한 부분과 팀이 한 부분을 나눠 적어주세요.', act || res);
  if (!act.trim()) add('action', 'action', 'must', '실행 내용이 비어 있음', '무엇을 했는지가 경험의 중심입니다.', QUESTIONS.action);
  else if (act.replace(/\s/g, '').length < 25) add('action-thin', 'action', 'improve', '실행 내용이 짧아 구체적인 행동이 보이지 않음', '무엇을·누구에게·어떤 방식으로 했는지가 보여야 역량이 전달됩니다.', '구체적으로 무엇을 했나요? 대상·방법·빈도(또는 기간)를 적어주세요.', act);
  if (/(교육|트레이닝|코칭|온보딩)/.test(act + res) && !/(대상|\d+\s*명)/.test(act)) add('training', 'action', 'improve', '교육의 대상·내용·본인 역할이 드러나지 않음', '"교육했다"만으로는 누구에게 무엇을 어떻게 했는지, 본인이 설계했는지 진행만 했는지 알 수 없습니다.', '교육 대상은 누구였고(직급·인원), 어떤 내용을, 본인이 어디까지(설계·진행·점검) 맡았나요?', sentenceWith(act + '\n' + res, act.match(/교육|트레이닝|코칭|온보딩/)?.[0] || res.match(/교육|트레이닝|코칭|온보딩/)?.[0] || ''));
  if (!f.reason?.trim()) add('reason', 'reason', 'improve', '판단 이유가 없음', '같은 결과라도 왜 그 방법을 골랐는지가 보이면 판단력이 드러납니다.', QUESTIONS.reason);
  if (!res.trim()) add('result', 'result', 'improve', '결과가 비어 있음', '결과가 없으면 행동의 의미가 끝까지 전달되지 않습니다. 수치가 없어도 괜찮습니다.', QUESTIONS.result);
  const all = [f.situation, f.problem, act, res].join('\n');
  const nums = all.match(NUM_RE);
  if (nums) {
    if (!f.evidence?.trim()) add('num-evidence', 'evidence', 'must', `수치(${uniq(nums).slice(0, 3).join(', ')})의 근거 자료가 없음`, '수치는 면접·평판 조회에서 확인될 수 있습니다. 근거가 없으면 제출 문서에서 뺍니다.', '이 수치는 어디서 확인했나요? (매출 보고서, 본사 평가, 시스템 화면 등)', sentenceWith(all, nums[0]));
    if (!PERIOD_RE.test(res + act)) add('num-base', 'result', 'improve', '수치의 기간·비교 기준이 드러나지 않음', '"20% 상승" 같은 수치는 언제와 비교해 얼마 동안인지가 있어야 의미가 생깁니다.', '이 수치는 어느 기간에, 무엇과 비교한 값인가요? 단위도 맞는지 확인해주세요.', sentenceWith(all, nums[0]));
  }
  if (/(매출|판매|전환|객단가|재구매|방문|매출액)/.test(res) && /(상승|증가|향상|높|늘|개선)/.test(res)) add('cause', 'result', 'improve', '결과가 내 행동 때문인지 연결 근거가 없음', '매출 변화는 시즌·프로모션·인력 변화 등 다른 요인의 영향도 받습니다. 연결 근거를 적으면 설득력이 올라갑니다.', '변화는 어느 기간에 측정했나요? 같은 기간에 시즌·프로모션·인력 변화 같은 다른 영향 요인이 있었나요?', res);
  for (const k of ['situation', 'problem', 'myRole', 'action', 'result']) {
    const m = (f[k] || '').match(HYPE_RE); if (!m) continue;
    const strong = m.some(w => /주도|총괄|달성/.test(w));
    add('hype-' + k, k, strong && !f.evidence?.trim() ? 'must' : 'improve', `모호하거나 과장될 수 있는 표현: ${uniq(m).join(', ')}`, strong ? '"주도·총괄·달성"은 실제 역할과 결과가 뒷받침될 때만 씁니다.' : '"크게·많이·다양한" 같은 표현은 읽는 사람이 규모를 알 수 없습니다.', '이 표현을 구체적인 사실(무엇을, 몇 번, 누구와, 어느 범위까지)로 바꿔 적을 수 있나요?', sentenceWith(f[k], m[0]));
  }
  if (res.trim() && !nums) add('no-num', 'result', 'optional', '수치 없는 결과 — 결과물·업무 범위·받은 피드백으로 설명할 수 있는지', '수치가 없어도 약한 경험이 아닙니다. 만든 결과물, 맡은 범위, 확인된 피드백이 있으면 충분히 설득력이 있습니다.', '이 일로 남은 결과물(자료·페이지·매뉴얼)이나 받은 피드백(상사·고객·본사)이 있나요?', res);
  if (!f.evidence?.trim() && !nums) add('evidence', 'evidence', 'optional', '근거 자료가 없음', '결과물 링크·평가·사진이 있으면 면접에서 바로 보여줄 수 있습니다.', QUESTIONS.evidence);
  if (!f.collab?.trim()) add('collab', 'collab', 'optional', '협업 내용이 없음', '누구와 어떻게 일했는지는 운영·MD 직무에서 자주 묻는 부분입니다.', QUESTIONS.collab);
  if (!f.learned?.trim()) add('learned', 'learned', 'optional', '배운 점이 없음', '면접 답변 재료가 됩니다. 문서에는 필요할 때만 씁니다.', QUESTIONS.learned);
  return out;
}

function refreshRules(e) {
  const fresh = rules(e);
  const kept = e.feedback.filter(x => x.status !== 'open' || x.source === 'AI'); const keys = new Set(kept.map(x => x.key));
  const oldOpen = Object.fromEntries(e.feedback.filter(x => x.status === 'open').map(x => [x.key, x]));
  const opens = fresh.filter(x => !keys.has(x.key)).map(x => ({ ...x, id: oldOpen[x.key]?.id || uid(), status: 'open', answer: oldOpen[x.key]?.answer || '', proposal: oldOpen[x.key]?.proposal || null, source: '규칙 점검' }));
  e.feedback = [...opens, ...kept]; if (!e.fbBase) e.fbBase = snap(e); e.fbAt = nowIso();
}

// ───────── 공고 규칙 기반 추출 ─────────
const SEC = [['preferred', /우대/], ['submission', /(제출\s*서류|전형\s*절차|지원\s*방법|접수\s*방법|제출\s*방법|서류\s*전형|전형\s*안내)/], ['required', /(자격\s*요건|필수|지원\s*자격|자격\s*조건|이런\s*분|요구\s*사항|경력\s*요건)/], ['duties', /(주요\s*업무|담당\s*업무|업무\s*내용|하는\s*일|이런\s*일|직무\s*내용|합류하면|포지션\s*소개)/], ['other', /(복지|혜택|근무\s*조건|근무\s*환경|회사\s*소개|기업\s*소개|근무\s*지|근무지|급여|연봉|기타|유의\s*사항|채용\s*절차)/]];
const TOOLS = ['Excel', '엑셀', 'PPT', '파워포인트', 'Google Analytics', 'GA4', 'Photoshop', '포토샵', 'Illustrator', '일러스트', 'Figma', '피그마', 'SQL', 'Tableau', '노션', 'Notion', '카페24', '스마트스토어', '쿠팡', '자사몰', 'ERP', 'SAP', 'POS', '캔바', 'Canva', '프리미어', '메타 광고', '네이버 광고', 'CRM', 'VMD', '구글 스프레드시트', '스프레드시트'];
const COMPS = ['고객', '데이터', '브랜드', '커뮤니케이션', '협업', '기획', '운영', '분석', '콘텐츠', '트렌드', '매출', '재고', '상품', '프로모션', '캠페인', 'CS', 'VMD', '리더십', '문제 해결', '실행력', '주도적', '오프라인', '온라인', '고객 경험'];
function extractPosting(text) {
  const cats = Object.fromEntries(Object.keys(CATS).map(c => [c, []])); const unclassified = [];
  const push = (c, t, q) => { t = t.trim(); if (t && !cats[c].some(x => x.text === t)) cats[c].push({ id: hashId(t), text: t, quote: q.trim(), quoteOk: true }); };
  let cur = null;
  for (const line of lines(text)) {
    const clean = line.replace(/^[\s\-–•·*▶▪◦○●■□✔✓☑#>]+|^\(?\d{1,2}[.)]\s*/g, '').trim();
    if (!clean) continue;
    const hit = clean.length <= 30 && SEC.find(([, re]) => re.test(clean));
    if (hit) {
      const [head, ...rest] = clean.split(/[:：]/); const after = rest.join(':').trim();
      const leftover = head.replace(hit[1], '').replace(/[\s사항요건및\[\]【】<>()]/g, '');
      if (leftover.length <= 4 || after) { cur = hit[0]; if (after && cur !== 'other') push(cur, after, line); continue; }
    }
    if (cur && cur !== 'other') push(cur, clean, line);
    else if (!cur) unclassified.push({ id: hashId(clean), text: clean, quote: line });
    if (/(자기소개서|포트폴리오|경력기술서|이력서|자\s*이내|분량|PDF|양식|파일명|제출)/i.test(clean) && cur !== 'submission') push('submission', clean, line);
  }
  for (const t of TOOLS) {
    const re = /^[A-Za-z0-9 ]+$/.test(t) ? new RegExp(`(^|[^A-Za-z])${t}([^A-Za-z]|$)`, 'i') : new RegExp(t);
    const ln = lines(text).find(l => re.test(l)); if (ln && !cats.tools.some(x => x.quote === ln.trim() && x.text.includes(t))) cats.tools.push({ id: hashId('tool' + t), text: t, quote: ln.trim(), quoteOk: true });
  }
  for (const w of COMPS) {
    const n = text.split(w).length - 1; if (n < 2) continue;
    cats.competencies.push({ id: hashId('comp' + w), text: `${w} (${n}회 언급)`, quote: lines(text).filter(l => l.includes(w)).slice(0, 3).join('\n'), quoteOk: true });
  }
  return { cats, unclassified };
}

const STOP = new Set(['경험', '이상', '관련', '업무', '능력', '가능', '있는', '및', '등', '위한', '통한', '대한', '우대', '필수', '보유', '이해', '역량', '있으신', '분', '갖춘', '가진', '대해']);
function toks(s) { return new Set(String(s || '').replace(/[^가-힣A-Za-z0-9 ]/g, ' ').split(/\s+/).map(w => w.replace(/(에서|으로|하는|하고|과의|을|를|이|가|은|는|의|에|와|과|로|도|한|할|적)$/, '')).filter(w => w.length >= 2 && !STOP.has(w))); }
function candidates(req, E) {
  const rt = toks(req.text);
  return E.map(e => { const et = toks([e.org, e.position, ...Object.values(e.f || {})].join(' ')); const hit = [...rt].filter(w => et.has(w)); return { e, hit }; }).filter(x => x.hit.length).sort((a, b) => b.hit.length - a.hit.length).slice(0, 3);
}

// ───────── 문서 생성·수정 ─────────
const groupTitle = e => [e.org || '(회사·활동명 미입력)', e.position, e.period].filter(Boolean).join(' · ');
const headUnverified = e => !e.org?.trim() || !e.period?.trim() || !e.position?.trim() || !!(e.unknown?.org || e.unknown?.period || e.unknown?.position);
function sentencesFor(type, e, grp) {
  const out = [];
  for (const [k, l] of DOC_FIELDS[type]) for (const t of lines(e.f?.[k])) out.push({ id: uid(), grp, label: l, field: k, text: t, expIds: [e.id], unverified: !!e.unknown?.[k] || /확인\s*필요/.test(t), edited: false });
  return out;
}
// 이 공고의 요구사항과 연결된 정도 (직접 2점, 유사 1점)
function linkScore(j, eid) { return Object.values(j?.mapping || {}).reduce((n, m) => n + (m.expIds?.includes(eid) ? (m.status === 'direct' ? 2 : m.status === 'similar' ? 1 : 0) : 0), 0); }
function makeDoc(jobId, type, expIds) {
  const j = job(jobId); const groups = []; let sentences = []; const src = {};
  const fromStrategy = (grp, text) => lines(text).map(t => ({ id: uid(), grp, label: '작성 전략에서 가져옴', field: '', text: t, expIds: [], unverified: true, fromStrategy: true, edited: false }));
  if (type === 'resume') {
    groups.push({ key: 'summary', title: '경력 요약' }, { key: 'skills', title: '핵심 역량' });
    sentences = [...fromStrategy('summary', j?.strategy?.summary), ...fromStrategy('skills', j?.strategy?.core)];
  }
  expIds = [...expIds].sort((a, b) => linkScore(j, b) - linkScore(j, a));
  for (const id of expIds) {
    const e = exp(id); if (!e) continue; const key = 'exp-' + e.id;
    groups.push({ key, title: groupTitle(e), expId: e.id, unverified: headUnverified(e) });
    sentences = sentences.concat(sentencesFor(type, e, key)); src[e.id] = snap(e);
  }
  const d = { id: uid(), jobId, type, title: `${j?.company || ''} ${DOC_TYPES[type]}`.trim(), groups, sentences, src, versions: [], checks: {}, revision: null, revInstr: '', createdAt: nowIso(), updatedAt: nowIso() };
  S.docs.push(d); return d;
}
// ───────── 기본 문서(마스터) → 공고별 복사본 ─────────
const isMaster = d => !d.jobId;
const newSent = (grp, label, text = '') => ({ id: uid(), grp, label, field: '', text, expIds: [], unverified: false, edited: false });
// 경력 칸: 입사·퇴사는 "2022.07"처럼 적고, 근속기간 = 퇴사월 − 입사월(재직중이면 이번 달까지)
const CAREER_F = ['company', 'role', 'start', 'end', 'current'];
const ym = s => { const m = String(s || '').match(/(\d{4})\D{0,3}(\d{1,2})/); return m && +m[2] >= 1 && +m[2] <= 12 ? [+m[1], +m[2]] : null; };
const fmtYm = s => { const p = ym(s); return p ? `${p[0]}.${String(p[1]).padStart(2, '0')}` : String(s || '').trim(); };
function tenure(g) {
  const a = ym(g.start), now = new Date(), b = g.current ? [now.getFullYear(), now.getMonth() + 1] : ym(g.end);
  if (!a || !b) return ''; const n = (b[0] - a[0]) * 12 + b[1] - a[1]; if (n < 0) return '';
  return [n >= 12 ? `${Math.floor(n / 12)}년` : '', n % 12 ? `${n % 12}개월` : ''].filter(Boolean).join(' ') || '1개월 미만';
}
function careerTitle(g) {
  const per = g.start || g.end || g.current ? `${fmtYm(g.start)} – ${g.current ? '재직중' : fmtYm(g.end)}` : '', t = tenure(g);
  return [g.company, g.role, per && per + (t ? ` (${t})` : '')].map(x => (x || '').trim()).filter(Boolean).join(' · ');
}
const hasCF = g => CAREER_F.some(k => g[k]);
const gTitle = g => hasCF(g) ? careerTitle(g) : g.title; // 재직중 근속기간이 매달 늘어나도록 출력 때 다시 계산
// "회사 | 직책 | 2022.07 - 2025.11" 같은 줄에서 경력 칸을 채운다. 기간이 없으면 false
const PERIOD = /(\d{4}\s*[.\-/년]\s*\d{1,2})\s*월?\s*[-–~]\s*(\d{4}\s*[.\-/년]\s*\d{1,2}\s*월?|재직\s*중|현재|진행\s*중)(\s*\([^)]*\))?/;
function careerFields(g, line) {
  const m = line.match(PERIOD); if (!m) return false; const cur = !/\d/.test(m[2]);
  const [company = '', ...role] = line.replace(m[0], '').split(/\s*\|\s*|\s+·\s+/).map(s => s.trim()).filter(Boolean);
  Object.assign(g, { career: true, company, role: role.join(' · '), start: fmtYm(m[1]), end: cur ? '' : fmtYm(m[2]), current: cur }); g.title = careerTitle(g); return true;
}
function careerGroup(type) {
  const key = 'g-' + uid();
  return { g: { key, title: '', career: true }, ss: (type === 'resume' ? ['주요 업무', '성과'] : LABELS.career).map(l => newSent(key, l)) };
}
function makeMaster(type, parsed, from) {
  let groups, sentences;
  if (parsed) ({ groups, sentences } = parsed);
  else if (type === 'resume') { const c = careerGroup('resume'); groups = [{ key: 'summary', title: '경력 요약' }, { key: 'skills', title: '핵심 역량' }, c.g, { key: 'edu', title: '학력 · 자격 · 기타' }]; sentences = [newSent('summary', ''), newSent('skills', ''), ...c.ss, newSent('edu', '')]; }
  else { const c = careerGroup('career'); groups = [c.g]; sentences = c.ss; }
  const d = { id: uid(), jobId: null, type, title: `기본 ${DOC_TYPES[type]}${from ? ` (${from.name})` : ''}`, groups, sentences, src: {}, versions: [], checks: {}, revision: null, revInstr: '', importedFrom: from || null, createdAt: nowIso(), updatedAt: nowIso() };
  S.docs.push(d); return d;
}
const allText = d => [...d.groups.map(g => g.title), ...d.sentences.map(s => s.text)].join('\n');
// 공고별 문서가 기댈 수 있는 사실의 범위: 복사할 때의 기본 문서 + 지금의 기본 문서
const baseSrc = d => [d.baseText || '', d.basedOn && doc(d.basedOn) ? allText(doc(d.basedOn)) : ''].join('\n');
function tailorFrom(masterId, jobId) {
  const m = doc(masterId), j = job(jobId);
  const d = { ...clone(m), id: uid(), jobId, basedOn: m.id, baseAt: m.updatedAt, baseText: allText(m), importedFrom: null, title: `${j?.company || ''} ${DOC_TYPES[m.type]}`.trim(), versions: [], revision: null, revInstr: '', checks: {}, createdAt: nowIso(), updatedAt: nowIso() };
  S.docs.push(d); return d;
}
// 붙여넣은·첨부한 이력서 글을 섹션(짧은 줄)과 문장(글머리표·긴 줄)으로 나눈다. 틀리면 사용자가 고친다.
function parseResume(text) {
  const groups = [], sentences = []; let cur = null;
  const bullet = /^([-–•·*▪◦○●■□▶✔✓]|\d{1,2}[.)])\s*/;
  const known = /^(경력|학력|자격|기타|수상|활동|프로젝트|보유\s*기술|핵심\s*역량|경력\s*요약|자기\s*소개|교육|어학|대외\s*활동|스킬|프로필)/;
  const L = lines(text);
  L.forEach((line, i) => {
    const clean = line.replace(bullet, '').trim(); if (!clean) return;
    const next = L[i + 1];
    if (!bullet.test(line) && clean.length <= 80 && PERIOD.test(clean)) {
      // 회사명 줄 바로 다음의 기간 줄 → 그 경력의 칸으로 / 기간이 든 제목 줄 → 새 경력
      if (cur && !known.test(cur.title) && !hasCF(cur) && !sentences.some(s => s.grp === cur.key)) { careerFields(cur, cur.title + ' | ' + clean); return; }
      // 바로 앞 줄이 글머리표 없는 짧은 줄이면 그게 회사명
      const prev = L[i - 1], last = sentences.at(-1), co = prev && !bullet.test(prev) && prev.length <= 40 && !PERIOD.test(prev) && last?.text === prev ? sentences.pop().text : '';
      cur = { key: 'g-' + uid(), title: clean, career: true }; careerFields(cur, co ? co + ' | ' + clean : clean); groups.push(cur); return;
    }
    // 짧은 줄은 다음 줄이 글머리표·긴 문장이거나 흔한 섹션 이름일 때만 섹션 제목으로 본다
    if (!bullet.test(line) && clean.length <= 40 && (known.test(clean) || (next && (bullet.test(next) || next.length > 40)))) { cur = { key: 'g-' + uid(), title: clean, career: !known.test(clean) }; groups.push(cur); return; }
    if (!cur) { cur = { key: 'g-' + uid(), title: '불러온 내용', career: true }; groups.push(cur); }
    sentences.push({ ...newSent(cur.key, '', clean), edited: false, imported: true });
  });
  return { groups, sentences };
}
function coverage(d, j) {
  return reqs(j).map(r => {
    const rt = toks(r.text);
    const hits = d.sentences.filter(s => s.text.trim() && !s.unverified).map(s => ({ s, hit: [...rt].filter(w => toks(s.text).has(w)) })).filter(x => x.hit.length).sort((a, b) => b.hit.length - a.hit.length).slice(0, 2);
    return { r, hits };
  });
}
function staleExps(d) { return Object.keys(d.src || {}).filter(id => { const e = exp(id); return !e || JSON.stringify(snap(e)) !== JSON.stringify(d.src[id]); }); }
function saveVersion(d, label) { d.versions.unshift({ id: uid(), label, at: nowIso(), title: d.title, groups: clone(d.groups), sentences: clone(d.sentences) }); }
function applyChange(d, c) {
  if (c.status === 'applied') return;
  if (c.kind === 'title') { const g = d.groups.find(x => x.key === c.grp); if (g) { c.prev = g.title; g.title = c.after; g.unverified = !!c.unverified; } c.status = 'applied'; return; }
  let idx = c.ids.length ? d.sentences.findIndex(s => s.id === c.ids[0]) : -1;
  if (idx < 0) { const last = d.sentences.map(s => s.grp).lastIndexOf(c.grp); idx = last < 0 ? d.sentences.length : last + 1; }
  const prev = d.sentences.filter(s => c.ids.includes(s.id));
  const base = prev[0] || { grp: c.grp, label: c.label, field: c.field, expIds: c.expIds || [] };
  const neu = lines(c.after).map(t => ({ ...clone(base), id: uid(), text: t, edited: false, unverified: !!c.unverified }));
  d.sentences = d.sentences.filter(s => !c.ids.includes(s.id));
  d.sentences.splice(idx, 0, ...neu);
  Object.assign(c, { prev, newIds: neu.map(s => s.id), at: idx, status: 'applied' });
}
function undoChange(d, c) {
  if (c.kind === 'title') { const g = d.groups.find(x => x.key === c.grp); if (g) g.title = c.prev; c.status = 'pending'; return; }
  d.sentences = d.sentences.filter(s => !c.newIds.includes(s.id));
  d.sentences.splice(Math.min(c.at, d.sentences.length), 0, ...c.prev);
  c.status = 'pending';
}
function docText(d, md) {
  const out = [md ? `# ${d.title}` : d.title, ''];
  for (const g of d.groups) {
    const ss = d.sentences.filter(s => s.grp === g.key && !s.unverified && s.text.trim()); if (!ss.length) continue;
    out.push(md ? `## ${gTitle(g) || '(제목 없음)'}` : `■ ${gTitle(g) || '(제목 없음)'}`); let lab = null;
    for (const s of ss) { if (s.label && s.label !== lab) { lab = s.label; out.push(md ? `**${lab}**` : `[${lab}]`); } out.push(`- ${s.text}`); }
    out.push('');
  }
  return out.join('\n').trim() + '\n';
}
function preCheck(d) {
  const j = job(d.jobId); const out = [];
  d.sentences.filter(s => s.unverified).forEach(s => out.push(['must', `미확인 문장 — 제출본(복사·다운로드·인쇄)에서 빠집니다: "${s.text}"`]));
  d.groups.filter(g => g.unverified).forEach(g => out.push(['must', `회사명·직책·기간이 미입력 또는 확인 필요: ${g.title}`]));
  d.groups.filter(g => g.career && !g.title.trim() && d.sentences.some(s => s.grp === g.key && s.text.trim())).forEach(() => out.push(['must', '경력 제목(회사 · 직책 · 기간)이 비어 있는 경력이 있습니다.']));
  if (d.basedOn) for (const s of d.sentences.filter(s => !s.unverified && s.text.trim())) { const bad = unsupported(s.text, baseSrc(d) + '\n' + s.expIds.map(exp).filter(Boolean).map(e => JSON.stringify(expBrief(e))).join('\n')); if (bad.length) out.push(['must', `기본 문서에 없는 수치·표현(${bad.join(', ')}) — 사실이라면 기본 문서에도 적어두고, 아니라면 지우세요: "${s.text}"`]); }
  for (const g of d.groups) {
    if (!g.expId) continue; const e = exp(g.expId);
    if (!e) out.push(['must', `원본 경험이 삭제됨: ${g.title}`]);
    else if (e.period && !g.title.includes(e.period)) out.push(['must', `기간 불일치 — 문서: "${g.title}" / 원본: "${e.period}"`]);
  }
  for (const s of d.sentences.filter(s => !s.unverified && s.text.trim())) {
    const nums = s.text.match(NUM_RE);
    if (nums) {
      if (s.expIds.length) { if (!s.expIds.map(exp).filter(Boolean).some(e => e.f?.evidence?.trim())) out.push(['must', `근거 자료가 확인되지 않은 수치(${uniq(nums).join(', ')}): "${s.text}"`]); }
      else out.push(['improve', `수치(${uniq(nums).join(', ')})를 뒷받침할 자료(보고서·평가 등)가 있는지 확인 — 면접에서 물을 수 있습니다: "${s.text}"`]);
      if (!PERIOD_RE.test(s.text)) out.push(['improve', `수치의 기간·비교 기준이 문장에 없음: "${s.text}"`]);
    }
    const h = s.text.match(HYPE_RE); if (h) out.push(['improve', `과장·모호 표현(${uniq(h).join(', ')}) — 실제 역할·결과가 뒷받침되는지 확인: "${s.text}"`]);
    if (!s.expIds.length && !isMaster(d) && !d.basedOn) out.push(['improve', `근거 경험이 연결되지 않은 문장: "${s.text}"`]);
  }
  if (staleExps(d).length) out.push(['must', `원본 경험이 바뀐 뒤 검토하지 않은 항목 ${staleExps(d).length}개 (위 알림 참고)`]);
  if (!isMaster(d) && !j?.analysis) out.push(['must', '공고의 제출 서류·작성 조건을 아직 분석하지 않았습니다. 지원 회사 → 요구사항 탭에서 확인하세요.']);
  if (j && !STRATEGY.some(([k]) => j.strategy?.[k]?.trim())) out.push(['improve', '이 공고의 작성 전략이 비어 있습니다.']);
  if (j?.strategy?.cut?.trim()) out.push(['improve', `작성 전략의 '줄이거나 제외할 내용'이 반영됐는지 확인: ${j.strategy.cut}`]);
  return { out, sub: j?.analysis?.cats.submission || [] };
}

// ───────── 예시 데이터 (실제 데이터와 구분) ─────────
function loadSamples() {
  if (S.experiences.some(e => e.sample)) return toast('예시 데이터가 이미 있습니다.');
  const e = newExpObj(); Object.assign(e, { sample: true, org: '[예시] 가상 베이커리 카페', period: '[예시] 2000.01 – 2000.12', position: '[예시] 매장 매니저', raw: '[예시] 주말마다 계산 줄이 길어서 불만이 많았음. 직원 교육으로 매출을 높였다. 매출 20% 상승.' });
  e.f = { situation: '[예시] 주말 오후 계산 대기 줄이 길다는 고객 의견이 반복됨', problem: '[예시] 주말 대기 시간 줄이기', action: '[예시] 직원 교육으로 매출을 높였다', result: '[예시] 매출 20% 상승' };
  const j = newJobObj(); Object.assign(j, { sample: true, company: '[예시] 가상 리빙 브랜드', position: '[예시] 브랜드 운영 매니저', status: '관심', postingSource: '예시', postingAt: nowIso(),
    postingText: '[예시 공고 — 실제 회사가 아닙니다]\n주요 업무\n- 오프라인 매장 고객 경험 개선 과제 기획 및 운영\n- 브랜드 캠페인 매장 실행 관리\n- 매장 데이터 분석을 통한 운영 개선\n자격요건\n- 리테일 매장 운영 경력 3년 이상\n- 고객 응대 및 팀 운영 경험\n우대사항\n- 엑셀 활용 가능자\n- 브랜드 콘텐츠 제작 경험\n제출서류\n- 이력서, 경력기술서(PDF, 자유양식)' });
  S.experiences.unshift(e); S.jobs.unshift(j); save(); toast('예시 데이터를 불러왔습니다. 모두 [예시] 표시가 붙어 있습니다.');
}
function clearSamples() {
  const ids = new Set(S.jobs.filter(j => j.sample).map(j => j.id));
  S.experiences = S.experiences.filter(e => !e.sample); S.jobs = S.jobs.filter(j => !j.sample); S.docs = S.docs.filter(d => !ids.has(d.jobId));
  save(); toast('예시 데이터를 모두 지웠습니다.');
}
const newExpObj = () => ({ id: uid(), sample: false, kind: '회사', org: '', period: '', position: '', f: {}, unknown: {}, raw: '', aiDraft: null, feedback: [], fbBase: null, fbAt: null, history: [], qSkip: {}, createdAt: nowIso(), updatedAt: nowIso() });
const newJobObj = () => ({ id: uid(), sample: false, company: '', position: '', url: '', deadline: '', status: '관심', postingText: '', postingSource: '', postingAt: '', fetch: null, analysis: null, sources: [], facts: [], mapping: {}, strategy: {}, strategyAI: null, createdAt: nowIso(), updatedAt: nowIso() });
function pushHistory(e, why) { e.history = [{ at: nowIso(), why, data: snap(e) }, ...(e.history || [])].slice(0, 30); }

// ───────── UI 상태 (저장 안 함) ─────────
const UI = { aiMsg: {}, busy: {}, prompts: {}, pasteOpen: {}, tabs: {}, tabY: {}, confirm: null, pick: null, dpick: null, sel: {}, importData: null, fetchMsg: {}, show: {} };

// ───────── 뷰 헬퍼 ─────────
const attrs = data => Object.entries(data).map(([k, v]) => `data-${k}="${esc(v)}"`).join(' ');
const btn = (a, label, data = {}, cls = '', disabled = false) => `<button type="button" class="btn ${cls}" data-a="${a}" ${attrs(data)} ${disabled ? 'disabled' : ''}>${label}</button>`;
const ta = (b, v, rows = 3, ph = '') => `<textarea data-b="${esc(b)}" rows="${rows}" placeholder="${esc(ph)}">${esc(v)}</textarea>`;
const inp = (b, v, ph = '', type = 'text', rr = false) => `<input type="${type}" data-b="${esc(b)}" value="${esc(v)}" placeholder="${esc(ph)}" ${rr ? 'data-rr' : ''}>`;
const sel = (b, v, opts, rr = true) => `<select data-b="${esc(b)}" ${rr ? 'data-rr' : ''}>${opts.map(([k, l]) => `<option value="${esc(k)}" ${k === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
const chk = (b, v, label, rr = false) => `<label class="chk"><input type="checkbox" data-b="${esc(b)}" ${v ? 'checked' : ''} ${rr ? 'data-rr' : ''}> ${label}</label>`;
const badge = (t, cls = '') => `<span class="badge ${cls}">${esc(t)}</span>`;
const sampleB = o => o?.sample ? badge('예시', 'sample') : '';
function split(key, a, b) {
  const cur = UI.tabs[key] || 0;
  return `<div class="tabs-m no-print">${[a, b].map((p, i) => `<button type="button" data-a="tab" data-k="${key}" data-i="${i}" class="${cur === i ? 'on' : ''}">${p.label}</button>`).join('')}</div>
<div class="split" data-split="${key}">${[a, b].map((p, i) => `<section class="pane ${cur === i ? 'on' : ''}">${p.html}</section>`).join('')}</div>`;
}
function confirmBtn(key, label, action, data) {
  if (UI.confirm !== key) return btn('ask', label, { k: key }, 'danger');
  return `<span class="row" style="margin:0"><span class="muted">정말 ${label}할까요? 되돌릴 수 없습니다.</span>${btn(action, label, data, 'danger')}${btn('ask', '취소', { k: '' }, 'quiet')}</span>`;
}
const storageNote = () => HOSTED ? `<div class="note">이 사이트의 데이터는 <b>지금 이 브라우저(또는 앱)에만</b> 저장됩니다. 휴대폰·다른 브라우저에서 열면 비어 있고, 브라우저 데이터를 지우면 사라집니다. 다른 주소(Claude 아티팩트·내 컴퓨터 127.0.0.1)에서 쓰던 내용은 그쪽 <a href="#/backup">백업</a>에서 파일로 받은 뒤 여기 백업 화면에서 복원하세요.</div>` : `<div class="note">이 사이트의 데이터는 <b>지금 이 기기·이 브라우저에만</b> 저장됩니다. 다른 기기·다른 브라우저에서는 보이지 않고, 브라우저 데이터(방문 기록·사이트 데이터)를 지우면 사라집니다. <a href="#/backup">JSON 백업</a>을 주기적으로 받아두세요. 주소도 항상 같게 여세요(지금 주소: <b>${esc(location.host)}</b>) — localhost와 127.0.0.1, 포트 번호가 다르면 다른 저장공간입니다.</div>`;
const notFound = () => `<div class="card"><p>찾을 수 없습니다. 삭제되었거나 다른 브라우저의 데이터일 수 있습니다.</p><a href="#/">대시보드로</a></div>`;
const openCount = (e, lv) => e.feedback.filter(x => x.status === 'open' && (!lv || x.level === lv)).length;

// ───────── 화면 ─────────
const V = {};

V.home = () => {
  const E = S.experiences, J = S.jobs, M = S.docs.filter(isMaster);
  const mr = M.find(d => d.type === 'resume');
  const actions = `<div class="hero-actions">${mr ? `<a class="btn primary lg" href="#/doc/${mr.id}">기본 이력서 이어 쓰기</a>` : btn('newMaster', '기본 이력서 쓰기', { t: 'resume' }, 'primary lg')}${btn('newJob', '＋ 지원 공고 추가', {}, 'primary lg')}</div>`;
  if (!E.length && !J.length && !S.docs.length) return `<div class="onboard"><h1>취업 준비 노트</h1>
<p class="lead">기본 이력서·경력기술서를 한 벌 써두고, 지원하는 공고마다 복사해서 맞춰 고칩니다.</p>${actions}
<ol class="steps"><li><b>기본 이력서·경력기술서 쓰기</b> — 빈 양식에 바로 쓰거나, 가지고 있는 파일을 불러옵니다. 모든 경험을 다 넣은 '전체 버전'입니다.</li>
<li><b>지원 공고 추가</b> — 공고를 붙여넣으면 주요 업무·자격요건·우대사항으로 나눕니다.</li>
<li><b>공고용으로 복사해서 고치기</b> — 공고 요구사항과 내 문장을 나란히 보고, 순서·강조·표현을 바꿉니다. 기본 문서는 그대로 남습니다.</li>
<li><b>제출 전 점검 · PDF</b> — 기본 문서에 없는 수치나 과장 표현을 걸러내고, 버전을 저장하고, 인쇄·PDF로 저장합니다.</li></ol>
<p class="hint">문장이 약하다 싶으면 <a href="#/exp">경험 보관함</a>에서 경험을 정리하고 피드백을 받을 수 있습니다(선택). ${btn('loadSamples', '예시 데이터 보기', {}, 'link')}</p>${storageNote()}</div>`;
  const recent = [...E].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const todo = E.flatMap(e => e.feedback.filter(x => x.status === 'open').map(x => ({ e, x }))).sort((a, b) => ['must', 'improve', 'optional'].indexOf(a.x.level) - ['must', 'improve', 'optional'].indexOf(b.x.level));
  const unchecked = E.filter(e => !e.fbAt);
  return `<h1>대시보드</h1>${actions}${storageNote()}
<h2>기본 문서 <span class="meta">${M.length}개</span></h2>
${M.length ? `<div class="cards">${M.map(d => `<div class="card"><a href="#/doc/${d.id}"><b>${esc(d.title)}</b></a> ${badge(DOC_TYPES[d.type])}<p class="meta">채운 문장 ${d.sentences.filter(x => x.text.trim()).length}개 · 공고용 복사본 ${S.docs.filter(x => x.basedOn === d.id).length}개 · 수정 ${fmt(d.updatedAt)}</p></div>`).join('')}</div>` : `<p class="hint">아직 기본 문서가 없습니다. <a href="#/docs">이력서·경력기술서</a>에서 시작하세요.</p>`}
<h2>작성 중인 경험 <span class="meta">${E.length}개</span></h2>
${recent.length ? `<div class="cards">${recent.map(e => { const empty = ALL.filter(([k]) => !val(e, k).trim()).length; const unk = Object.values(e.unknown || {}).filter(Boolean).length; return `<div class="card"><a href="#/exp/${e.id}"><b>${esc(expName(e))}</b></a> ${sampleB(e)}<p class="meta">${esc(e.period || '기간 미입력')} · 빈 항목 ${empty}개${unk ? ` · 확인 필요 ${unk}개` : ''}</p><p class="meta">수정 ${fmt(e.updatedAt)}</p></div>`; }).join('')}</div>` : `<p class="hint">아직 경험이 없습니다.</p>`}
<h2>보완할 항목</h2>
${todo.length || unchecked.length ? `<div class="card">
${['must', 'improve', 'optional'].map(lv => `${badge(LEVELS[lv] + ' ' + todo.filter(t => t.x.level === lv).length, lv)}`).join(' ')}
${unchecked.length ? `<p class="hint">아직 피드백을 돌리지 않은 경험 ${unchecked.length}개: ${unchecked.map(e => `<a href="#/fb/${e.id}">${esc(expName(e))}</a>`).join(', ')}</p>` : ''}
<ul>${todo.filter(t => t.x.level !== 'optional').slice(0, 8).map(({ e, x }) => `<li>${badge(LEVELS[x.level], x.level)} <a href="#/fb/${e.id}">${esc(expName(e))}</a> — ${esc(x.issue)}</li>`).join('')}</ul></div>` : `<p class="hint">남은 보완 항목이 없습니다.</p>`}
<h2>지원 회사별 진행 상태 <span class="meta">${J.length}곳</span></h2>
${J.length ? `<div class="card" style="overflow-x:auto"><table class="t"><thead><tr><th>회사 · 직무</th><th>상태</th><th>마감</th><th>공고 분석</th><th>필수요건 미확인</th><th>문서</th><th>원본 변경 알림</th></tr></thead><tbody>
${J.map(j => { const R = reqs(j); const reqUnk = R.filter(r => r.cat === 'required' && (j.mapping[r.id]?.status || 'unknown') === 'unknown').length; const D = S.docs.filter(d => d.jobId === j.id); const st = D.reduce((n, d) => n + staleExps(d).length, 0);
  return `<tr><td><a href="#/job/${j.id}">${esc(j.company || '회사명 미입력')}</a> ${sampleB(j)}<br><span class="meta">${esc(j.position)}</span></td><td>${esc(j.status)}</td><td>${esc(j.deadline || '-')} <span class="meta">${dday(j.deadline)}</span></td><td>${!j.analysis ? '<span class="muted">안 함</span>' : reqs(j).length ? `${esc(j.analysis.source)}` : badge('추출 0개 — 확인 필요', 'must')}</td><td>${j.analysis ? reqUnk : '-'}</td><td>${D.length}</td><td>${st ? badge(st + '건', 'improve') : '-'}</td></tr>`; }).join('')}
</tbody></table></div>` : `<p class="hint">아직 지원 공고가 없습니다.</p>`}`;
};

V.exp = r => {
  if (!r.id) {
    const E = S.experiences;
    return `<h1>경험 보관함</h1><div class="row">${btn('newExp', '＋ 자유 입력으로 추가', { m: 'free' }, 'primary')}${btn('newExp', '＋ 질문에 답하며 추가', { m: 'q' }, 'primary')}</div>
<div class="row"><input type="search" id="exp-q" placeholder="회사·활동명, 내용 검색" style="max-width:360px">
<select id="exp-kind"><option value="">전체 종류</option><option>회사</option><option>프로젝트·활동</option></select>
<select id="exp-state"><option value="">전체 상태</option><option value="must">제출 전 확인 필요 있음</option><option value="unchecked">피드백 안 돌림</option><option value="sample">예시만</option><option value="real">내 데이터만</option></select></div>
${E.length ? `<div class="cards" id="exp-cards">${E.map(e => `<div class="card" data-text="${esc([e.org, e.position, e.period, e.raw, ...Object.values(e.f || {})].join(' ').toLowerCase())}" data-kind="${esc(e.kind)}" data-must="${openCount(e, 'must') ? 1 : 0}" data-unchecked="${e.fbAt ? 0 : 1}" data-sample="${e.sample ? 1 : 0}">
<a href="#/exp/${e.id}"><b>${esc(expName(e))}</b></a> ${sampleB(e)} ${badge(e.kind)}
<p class="meta">${esc(e.period || '기간 미입력')}</p>
<p class="meta">${['must', 'improve'].map(lv => openCount(e, lv) ? badge(LEVELS[lv] + ' ' + openCount(e, lv), lv) : '').filter(Boolean).join(' ') || (e.fbAt ? '열린 피드백 없음' : '피드백 안 돌림')}</p>
<div class="row"><a class="btn" href="#/exp/${e.id}">편집</a><a class="btn quiet" href="#/fb/${e.id}">피드백</a></div></div>`).join('')}</div><p class="hint" id="exp-none" hidden>조건에 맞는 경험이 없습니다.</p>` : `<div class="card"><p>아직 경험이 없습니다. 위 버튼으로 시작하세요.</p><p class="hint">자유 입력: 생각나는 대로 적거나 붙여넣기 · 질문형: 한 번에 최대 3개 질문에 답하기</p></div>`}`;
  }
  const e = exp(r.id); if (!e) return notFound();
  const mode = r.sub === 'q' ? 'q' : 'free';
  const head = `<div class="page-head"><a class="back" href="#/exp">← 경험 보관함</a>
<h1>${esc(e.org || '제목 없는 경험')} ${sampleB(e)}</h1>
<div class="row"><span class="seg"><a href="#/exp/${e.id}" class="${mode === 'free' ? 'on' : ''}">자유 입력</a><a href="#/exp/${e.id}/q" class="${mode === 'q' ? 'on' : ''}">질문형 입력</a></span>
<a class="btn primary" href="#/fb/${e.id}">피드백 보기 →</a>${confirmBtn('del-exp-' + e.id, '삭제', 'delExp', { id: e.id })}</div></div>`;
  const left = mode === 'free' ? `<h2>자유 입력 원문</h2><p class="hint">두서없이 적거나 붙여넣어도 됩니다. 원문은 AI 정리와 별개로 그대로 보존됩니다.</p>
${ta(`exp:${e.id}:raw`, e.raw, 12, '예: 매장에서 신규 직원 온보딩을 맡았는데 …')}
${aiPanel('organize', e.id, 'AI로 항목 정리', '원문만 보냅니다. 결과는 아래에 따로 보관되고, 항목별로 [반영]을 눌러야 오른쪽 항목에 들어갑니다.')}
${draftView(e)}` : qPane(e);
  return head + split('exp', { label: mode === 'free' ? '원문' : '질문', html: left }, { label: '정리된 항목', html: fieldsForm(e) });
};
function draftView(e) {
  const d = e.aiDraft; if (!d) return '';
  return `<h3>AI 정리본 <span class="meta">${fmt(d.at)}</span></h3><p class="hint">참고용 정리입니다. 사실과 다르면 반영하지 말고 오른쪽 항목에서 직접 고치세요.</p>
${d.notes ? `<p class="note">AI 메모: ${esc(d.notes)}</p>` : ''}
${ALL.filter(([k]) => d.fields[k]).map(([k, l]) => { const same = val(e, k) === d.fields[k]; const w = d.warn?.[k]; return `<div class="item-line"><div><span class="lbl">${l}</span><div class="pre">${esc(d.fields[k])}</div>${w ? `<p class="msg err">원문·입력에 없는 표현: ${esc(w.join(', '))} — 반영하면 '확인 필요'로 표시됩니다</p>` : ''}${val(e, k) && !same ? `<p class="meta">현재 입력: ${esc(val(e, k))}</p>` : ''}</div>${same ? badge('반영됨', 'ok') : btn('applyDraft', val(e, k) ? '교체 반영' : '반영', { id: e.id, k })}</div>`; }).join('')}
${d.unknown.length ? `<p class="meta">원문에서 확인 안 된 항목: ${d.unknown.map(k => LABEL[k] || k).join(', ')}</p>` : ''}
<div class="row">${btn('applyDraftEmpty', '빈 항목에만 모두 반영', { id: e.id })}</div>`;
}
function qPane(e) {
  const pend = ALL.map(([k]) => k).filter(k => !val(e, k).trim() && !e.unknown?.[k] && !e.qSkip?.[k]);
  const now = pend.slice(0, 3); const skipped = Object.keys(e.qSkip || {}).filter(k => e.qSkip[k] && !val(e, k).trim());
  return `<h2>질문에 답하며 정리</h2><p class="hint">한 번에 최대 3개만 묻습니다. 답은 오른쪽 항목에 바로 저장됩니다. 남은 질문 ${pend.length}개</p>
${now.length ? now.map(k => `<div class="fb optional"><p><b>${esc(QUESTIONS[k])}</b></p>${k === 'org' || k === 'period' || k === 'position' ? inp(bpath(e, k), val(e, k)) : ta(bpath(e, k), val(e, k), 3)}
<div class="row">${btn('qUnknown', '모름 · 확인 필요로 표시', { id: e.id, k }, 'quiet')}${btn('qSkip', '나중에', { id: e.id, k }, 'quiet')}</div></div>`).join('') + `<div class="row">${btn('rerender', '답했어요 · 다음 질문 보기', {}, 'primary')}</div>`
    : `<div class="card"><p>지금 물어볼 질문이 없습니다.</p><a class="btn primary" href="#/fb/${e.id}">피드백 받기 →</a></div>`}
${skipped.length ? `<p class="hint">나중으로 미룬 질문 ${skipped.length}개 ${btn('qUnskip', '다시 보기', { id: e.id }, 'link')}</p>` : ''}`;
}
function fieldsForm(e) {
  return `<h2>정리된 항목</h2><p class="hint">모든 칸을 채우지 않아도 자동 저장됩니다. 모르면 비워두거나 '확인 필요'에 체크하세요.</p>
<div class="fld"><span>종류</span>${sel(`exp:${e.id}:kind`, e.kind, [['회사', '회사'], ['프로젝트·활동', '프로젝트·활동']], false)}</div>
<div class="grid3">${HEAD.map(([k, l]) => `<div class="fld"><span>${l}</span>${inp(`exp:${e.id}:${k}`, e[k], k === 'period' ? '예: 2021.03 – 2023.08' : '')}${chk(`exp:${e.id}:unknown.${k}`, e.unknown?.[k], '확인 필요')}</div>`).join('')}</div>
${FIELDS.map(([k, l]) => `<div class="fld"><span>${l}</span>${ta(`exp:${e.id}:f.${k}`, e.f?.[k], 3, PH[k] || '')}${chk(`exp:${e.id}:unknown.${k}`, e.unknown?.[k], '확인 필요')}</div>`).join('')}
<p class="meta">처음 만든 시각 ${fmt(e.createdAt)} · 마지막 수정 ${fmt(e.updatedAt)}</p>`;
}

V.fb = r => {
  if (!r.id) { const DI = S.docs.map(d => ({ d, I: docIssues(d).filter(x => x.c.level !== 'optional') })).filter(x => x.I.length);
    return `<h1>보완 항목</h1><p class="hint">문서 문장과 경험에서 보완할 곳을 모아 봅니다. 고치는 건 각 문서·경험 화면에서 바로 합니다. 점수·합격 확률은 표시하지 않습니다.</p>
<h2>문서 문장 <span class="meta">${DI.reduce((n, x) => n + x.I.length, 0)}개</span></h2>
${DI.length ? DI.map(({ d, I }) => `<div class="card"><a href="#/doc/${d.id}"><b>${esc(d.title)}</b></a> ${isMaster(d) ? badge('공통 문서') : badge(job(d.jobId)?.company || '지원 문서')} ${badge(DOC_TYPES[d.type])}
<ul class="issues">${I.map(({ s, c }) => `<li><a href="#/doc/${d.id}/${s.id}">${badge(LEVELS[c.level], c.level)} ${esc(c.issue)}</a><span class="meta"> — “${esc(s.text.slice(0, 50))}${s.text.length > 50 ? '…' : ''}”</span></li>`).join('')}</ul></div>`).join('') : '<p class="hint">문서 문장에서 걸린 항목이 없습니다.</p>'}
<h2>경험 <span class="meta">${S.experiences.length}개</span></h2>
${S.experiences.length ? `<div class="cards">${S.experiences.map(e => `<div class="card"><a href="#/fb/${e.id}"><b>${esc(expName(e))}</b></a> ${sampleB(e)}<p class="meta">${Object.keys(LEVELS).map(lv => openCount(e, lv) ? badge(LEVELS[lv] + ' ' + openCount(e, lv), lv) : '').filter(Boolean).join(' ') || (e.fbAt ? '열린 피드백 없음' : '아직 점검 안 함')}</p></div>`).join('')}</div>` : `<div class="card"><p>아직 경험이 없습니다.</p>${btn('newExp', '＋ 질문에 답하며 경험 추가', { m: 'q' }, 'primary')}</div>`}`; }
  const e = exp(r.id); if (!e) return notFound();
  if (e.fbAt) { const n = JSON.stringify(e.feedback.map(x => x.key)); refreshRules(e); if (JSON.stringify(e.feedback.map(x => x.key)) !== n) save(); }
  const open = e.feedback.filter(x => x.status === 'open'); const done = e.feedback.filter(x => x.status !== 'open');
  const answered = open.filter(x => x.answer?.trim()).length;
  const left = `<h2>입력한 내용</h2><p class="hint"><a href="#/exp/${e.id}">항목 직접 편집 →</a></p>
<dl class="readonly">${ALL.map(([k, l]) => `<dt>${l} ${e.unknown?.[k] ? badge('확인 필요', 'must') : ''}</dt><dd>${val(e, k) ? esc(val(e, k)) : '<span class="muted">(비어 있음)</span>'}</dd>`).join('')}</dl>
${e.raw ? `<details><summary>자유 입력 원문 보기</summary><div class="pre quote">${esc(e.raw)}</div></details>` : ''}`;
  const right = `<h2>피드백</h2>
<p class="hint">${Object.entries(LEVELS).map(([k, l]) => badge(l, k)).join(' ')}<br>점수나 합격 확률은 매기지 않습니다. 답한 질문은 다시 묻지 않습니다.</p>
<div class="row">${btn('runRules', e.fbAt ? '규칙 기반 점검 다시 실행' : '규칙 기반 점검 실행', { id: e.id }, 'primary')}<span class="meta">${e.fbAt ? '마지막 점검 ' + fmt(e.fbAt) : 'AI 없이 작동하는 점검입니다'}</span></div>
${aiPanel('feedback', e.id, 'AI 피드백 추가', '이 경험의 항목과 이미 답한 질문만 보냅니다(원문·다른 경험은 보내지 않음).')}
${open.length ? ['must', 'improve', 'optional'].map(lv => { const xs = open.filter(x => x.level === lv); return xs.length ? `<h3>${badge(LEVELS[lv], lv)} ${xs.length}개</h3>` + xs.map(x => fbCard(e, x)).join('') : ''; }).join('') : `<p class="hint">${e.fbAt ? '열린 피드백이 없습니다.' : '점검을 실행하면 여기에 피드백이 나옵니다.'}</p>`}
${answered ? aiPanel('proposal', e.id, `답변한 ${answered}개 항목의 AI 수정안 받기`, '해당 항목의 현재 내용과 내 답변만 보냅니다. AI 없이도 각 카드의 [수정안 만들기]로 진행할 수 있습니다.') : ''}
${done.length ? `<details><summary>처리한 피드백 ${done.length}개</summary>${done.map(x => fbCard(e, x)).join('')}</details>` : ''}`;
  return `<div class="page-head"><a class="back" href="#/fb">← 보완 항목</a><h1>${esc(expName(e))} ${sampleB(e)}</h1></div>
${split('fb', { label: '입력한 내용', html: left }, { label: `피드백 ${open.length}`, html: right })}${compareView(e)}`;
};
function fbCard(e, x) {
  const ref = `item:${e.id}|${x.id}`; const isOpen = x.status === 'open';
  return `<article class="fb ${x.level}">
<div>${badge(LEVELS[x.level], x.level)} <span class="meta">${esc(LABEL[x.field] || x.field)} · ${esc(x.source)}${x.status === 'applied' ? ' · 적용함' : x.status === 'dismissed' ? ' · 넘김' : ''}</span></div>
<dl><dt>입력한 문장</dt><dd class="quote">${x.quote ? esc(x.quote) : '<span class="muted">(비어 있음)</span>'}</dd>
<dt>부족한 부분</dt><dd>${esc(x.issue)}</dd><dt>보완 이유</dt><dd>${esc(x.why)}</dd><dt>추가 질문</dt><dd><b>${esc(x.question)}</b></dd></dl>
${isOpen ? `${ta(`${ref}:answer`, x.answer, 3, '여기에 바로 답하세요. 모르면 "확인 필요"라고 적어도 됩니다.')}
<div class="row">${btn('propose', '답변으로 수정안 만들기', { id: e.id, i: x.id })}${btn('dismissFb', '해당 없음 · 넘기기', { id: e.id, i: x.id }, 'quiet')}</div>` : `${x.answer ? `<p class="meta">내 답변: ${esc(x.answer)}</p>` : ''}${btn('reopenFb', '다시 열기', { id: e.id, i: x.id }, 'link')}`}
${isOpen && x.proposal ? `<div class="proposal"><h4>답변 후 수정안 <span class="meta">${esc(x.proposal.source)}</span></h4>
<div class="cmp"><div><span>현재 「${esc(LABEL[x.field])}」</span><div class="before">${x.proposal.before ? esc(x.proposal.before) : '(비어 있음)'}</div></div>
<div><span>수정안 — 직접 고쳐도 됩니다</span>${ta(`${ref}:proposal.after`, x.proposal.after, 4)}</div></div>
<p class="hint">${esc(x.proposal.reason)}</p>${x.proposal.warn ? `<p class="msg err">${esc(x.proposal.warn)}</p>` : ''}<div class="row">${btn('applyFb', '이 수정안 적용', { id: e.id, i: x.id }, 'primary')}${btn('cancelProposal', '수정안 취소', { id: e.id, i: x.id }, 'quiet')}</div></div>` : ''}
</article>`;
}
function compareView(e) {
  if (!e.fbBase) return '';
  const cur = snap(e); const diff = ALL.filter(([k]) => val(e.fbBase, k) !== val(cur, k));
  return `<div class="card"><h2 style="margin-top:0">보완 전후 비교</h2><p class="hint">기준: 처음 점검한 시점의 내용. ${btn('resetBase', '비교 기준을 지금으로 바꾸기', { id: e.id }, 'link')}</p>
${diff.length ? diff.map(([k, l]) => `<h4>${l}</h4><div class="cmp"><div><span>보완 전</span><div class="before">${esc(val(e.fbBase, k)) || '(비어 있음)'}</div></div><div><span>보완 후</span><div class="after">${esc(val(cur, k)) || '(비어 있음)'}</div></div></div>`).join('') : '<p class="muted">아직 바뀐 항목이 없습니다.</p>'}</div>`;
}

V.jobs = () => `<h1>지원 회사</h1><div class="row">${btn('newJob', '＋ 지원 공고 추가', {}, 'primary')}</div>
${S.jobs.length ? `<div class="cards">${S.jobs.map(j => `<div class="card"><a href="#/job/${j.id}"><b>${esc(j.company || '회사명 미입력')}</b></a> ${sampleB(j)}<p>${esc(j.position || '직무 미입력')}</p>
<p class="meta">${esc(j.status)} · 마감 ${esc(j.deadline || '-')} ${dday(j.deadline)} · ${!j.analysis ? '공고 분석 전' : reqs(j).length ? '공고 분석함' : '공고 분석: 추출 0개'} · 문서 ${S.docs.filter(d => d.jobId === j.id).length}개</p></div>`).join('')}</div>` : `<div class="card"><p>아직 지원 공고가 없습니다.</p><p class="hint">회사명·직무·공고 URL·본문·마감일을 등록하면 요구사항을 나누고 내 경험과 연결합니다.</p></div>`}`;

const JOB_TABS = [['info', '공고'], ['req', '요구사항'], ['company', '회사 분석'], ['match', '경험 연결'], ['strategy', '작성 전략'], ['docs', '지원 문서']];
V.job = r => {
  const j = job(r.id); if (!j) return notFound();
  const tab = JOB_TABS.some(t => t[0] === r.sub) ? r.sub : 'info';
  return `<div class="page-head"><a class="back" href="#/jobs">← 지원 회사</a><h1>${esc(j.company || '회사명 미입력')} ${sampleB(j)} <span class="meta">${esc(j.position)}</span></h1>
<div class="row">${sel(`job:${j.id}:status`, j.status, JOB_STATUS.map(s => [s, s]), false)}<span class="meta">마감 ${esc(j.deadline || '-')} ${dday(j.deadline)} · 지원·제출은 이 사이트가 하지 않습니다</span>${confirmBtn('del-job-' + j.id, '삭제', 'delJob', { id: j.id })}</div></div>
<nav class="subtabs">${JOB_TABS.map(([k, l]) => `<a href="#/job/${j.id}/${k}" class="${k === tab ? 'on' : ''}">${l}</a>`).join('')}</nav>` + JT[tab](j);
};
const JT = {};
JT.info = j => {
  const fm = UI.fetchMsg[j.id];
  const busy = !!UI.busy['fetch:' + j.id];
  return `<div class="card"><div class="fld"><span>채용공고 URL — 붙여넣으면 회사명·직무·마감일·공고 본문을 채웁니다</span>
<div class="url-row">${inp(`job:${j.id}:url`, j.url, '원티드·사람인·잡코리아 등 공고 주소', 'url')}${btn('fetchPosting', busy ? '불러오는 중…' : '불러오기', { id: j.id }, 'primary', busy)}</div></div>
<div class="grid3"><div class="fld"><span>회사명</span>${inp(`job:${j.id}:company`, j.company)}</div><div class="fld"><span>직무명</span>${inp(`job:${j.id}:position`, j.position)}</div><div class="fld"><span>마감일</span>${inp(`job:${j.id}:deadline`, j.deadline, '', 'date')}</div></div>
${fm ? `<p class="msg ${fm.type}">${esc(fm.text)}</p>` : j.fetch ? `<p class="msg ${j.fetch.ok ? 'info' : 'err'}">마지막 URL 가져오기(${fmt(j.fetch.at)}): ${j.fetch.ok ? `성공, ${j.fetch.chars}자` : `실패 — ${esc(j.fetch.reason)}`}${j.fetch.ok ? '' : '\n아래 공고 본문은 URL에서 읽은 것이 아닙니다.'}</p>` : ''}
${j.fetchPreview ? `<div class="note warn">가져온 본문(${j.fetchPreview.length}자)이 기존 본문과 다릅니다. ${btn('usePreview', '가져온 본문으로 교체', { id: j.id })} ${btn('dropPreview', '기존 본문 유지', { id: j.id }, 'quiet')}<details><summary>가져온 본문 미리보기</summary><div class="pre quote">${esc(j.fetchPreview.slice(0, 3000))}</div></details></div>` : ''}
<div class="fld"><span>공고 본문</span>${ta(`job:${j.id}:postingText`, j.postingText, 14, 'URL을 가져오지 못하면 공고 페이지의 본문을 복사해 여기에 붙여넣으세요.')}</div>
<p class="meta">본문 출처: ${esc(j.postingSource || '없음')} · 확인 시각: ${fmt(j.postingAt)}</p>
<div class="row"><a class="btn primary" href="#/job/${j.id}/req">요구사항 분석으로 →</a></div></div>`;
};
JT.req = j => {
  const a = j.analysis; const changed = a && norm(a.posting) !== norm(j.postingText);
  const itemLine = (c, x, kind) => `<div class="item-line"><div>${esc(x.text)} ${kind === 'interp' ? badge('AI 해석', 'similar') : x.quoteOk ? badge('공고 명시', 'ok') : ''} ${x.quoteOk ? '' : badge('원문 확인 안 됨 — 공고에서 직접 확인하세요', 'must')}
<details><summary>관련 원문</summary><div class="quote pre">${esc(x.quote || '(인용 없음)')}</div></details></div>${btn('delReqItem', '삭제', { id: j.id, c, x: x.id }, 'quiet')}</div>`;
  return `<div class="card"><h2 style="margin-top:0">채용공고 요구사항</h2>
<p class="hint">규칙 기반 추출은 공고의 섹션 제목(주요업무·자격요건·우대사항 등)으로 원문 줄을 나눕니다. AI 없이 작동하며, 각 항목 옆에서 원문을 확인할 수 있습니다.</p>
<div class="row">${btn('extract', a ? '규칙 기반으로 다시 추출' : '규칙 기반 추출', { id: j.id }, 'primary')}</div>
${aiPanel('posting', j.id, 'AI로 공고 분석', '공고 본문과 회사명·직무명만 보냅니다. 인용 문장이 실제 공고에 있는지 자동 확인합니다.')}
${!j.postingText?.trim() ? `<p class="note warn">공고 본문이 비어 있습니다. <a href="#/job/${j.id}/info">[공고] 탭</a>에서 붙여넣어 주세요.</p>` : ''}
${a ? `<p class="meta">분석 방식: ${esc(a.source)} · 분석 시각: ${fmt(a.at)} · 공고 본문 출처: ${esc(a.postingSource || '기록 없음')}${a.url ? ` · 공고 URL: <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.url)}</a>` : ''}</p>
${Object.values(a.cats).every(x => !x.length) ? `<p class="note danger">추출된 요구사항이 0개입니다. 공고에 섹션 제목(주요업무·자격요건 등)이 없어서일 수 있습니다. 아래 '분류하지 못한 줄'을 옮기거나 AI 분석을 쓰세요. 이 상태는 분석 완료가 아닙니다.</p>` : ''}
${changed ? `<p class="note warn">분석한 뒤 공고 본문이 바뀌었습니다. 다시 추출하세요.</p>` : ''}
<details><summary>분석에 사용한 공고 본문 보기</summary><div class="pre quote">${esc(a.posting)}</div></details></div>
${Object.entries(CATS).map(([c, l]) => `<div class="card"><h3 style="margin-top:0">${l} <span class="meta">${a.cats[c].length}개</span></h3>${a.cats[c].length ? a.cats[c].map(x => itemLine(c, x)).join('') : '<p class="muted">공고에서 찾지 못했습니다. 공고에 없을 수도, 섹션 제목이 달라 못 나눴을 수도 있습니다.</p>'}</div>`).join('')}
${a.unclassified?.length ? `<div class="card"><h3 style="margin-top:0">분류하지 못한 줄 <span class="meta">${a.unclassified.length}개</span></h3><p class="hint">섹션 제목 앞에 있어 나누지 못한 줄입니다. 필요한 줄만 옮기세요.</p>${a.unclassified.map(x => `<div class="item-line"><div class="pre">${esc(x.text)}</div><select data-a2="moveUnc" data-id="${j.id}" data-x="${x.id}"><option value="">옮기기…</option>${['duties', 'required', 'preferred', 'submission'].map(c => `<option value="${c}">${CATS[c]}</option>`).join('')}</select></div>`).join('')}</div>` : ''}
<div class="card"><h3 style="margin-top:0">AI 해석 <span class="meta">공고에 직접 적히진 않은 내용</span></h3>${a.interpreted?.length ? a.interpreted.map(x => itemLine('interpreted', x, 'interp')).join('') : '<p class="muted">없음 — AI 분석을 실행하면 공고에서 읽어낸 해석을 명시 내용과 분리해 보여줍니다.</p>'}</div>
<div class="row"><a class="btn primary" href="#/job/${j.id}/match">경험 연결로 →</a></div>` : '</div>'}`;
};
JT.company = j => `<div class="note">${AI.ok ? 'AI는 연결돼 있지만 <b>웹 검색은 연결되지 않았습니다</b>.' : '<b>웹 검색·AI 모두 연결되지 않았습니다</b>.'} 최신 기업 정보를 자동으로 찾지 않습니다. 공식 홈페이지·공식 채용 페이지·공식 서비스 소개를 URL로 가져오거나 붙여넣은 <b>자료만</b> 근거로 분석합니다.</div>
<div class="card"><h2 style="margin-top:0">1. 공식 자료</h2>
${j.sources.map(s => { const m = UI.fetchMsg[s.id]; return `<div class="fb optional"><div class="grid2"><div class="fld"><span>자료 이름</span>${inp(`src:${j.id}|${s.id}:title`, s.title, '예: 공식 홈페이지 브랜드 소개')}</div><div class="fld"><span>출처 URL</span>${inp(`src:${j.id}|${s.id}:url`, s.url, 'https://', 'url')}</div></div>
<div class="row">${btn('fetchSource', UI.busy['fetch:' + s.id] ? '가져오는 중…' : 'URL에서 가져오기', { id: j.id, s: s.id }, 'quiet', !!UI.busy['fetch:' + s.id])}<span class="meta">확인 날짜: ${fmt(s.at)} · ${esc(s.origin || '')}</span>${btn('delSource', '자료 삭제', { id: j.id, s: s.id }, 'quiet')}</div>
${m ? `<p class="msg ${m.type}">${esc(m.text)}</p>` : ''}
${ta(`src:${j.id}|${s.id}:text`, s.text, 5, '가져오지 못하면 공식 페이지 내용을 복사해 붙여넣으세요.')}</div>`; }).join('') || '<p class="muted">아직 자료가 없습니다.</p>'}
<div class="row">${btn('addSource', '＋ 자료 추가', { id: j.id })}</div></div>
<div class="card"><h2 style="margin-top:0">2. 분석 — 사실과 해석, 그리고 작성 방향</h2>
<p class="hint">'사실'은 자료에 적힌 내용(출처 필수), '해석'은 자료를 바탕으로 한 판단입니다. 각 항목이 지원 문서에서 어떤 방향으로 쓰일지 적어두세요.</p>
${aiPanel('company', j.id, 'AI로 회사 분석', '추가한 자료 본문, 공고 주요 업무, 경험 요약(회사·직책·문제·실행·결과)만 보냅니다.')}
${Object.entries(FACT_CATS).map(([c, l]) => { const fs = j.facts.filter(f => f.cat === c); return `<h3>${l} <span class="meta">${fs.length}</span></h3>` + fs.map(f => factRow(j, f)).join(''); }).join('')}
<div class="row">${btn('addFact', '＋ 직접 추가', { id: j.id })}</div></div>`;
function factRow(j, f) {
  const s = j.sources.find(x => x.id === f.srcId); const ref = `fact:${j.id}|${f.id}`;
  return `<div class="fb ${f.kind === '사실' ? 'optional' : 'improve'}"><div class="row">${sel(`${ref}:cat`, f.cat, Object.entries(FACT_CATS))}${sel(`${ref}:kind`, f.kind, [['사실', '사실(자료에서 확인)'], ['해석', '해석']])}${sel(`${ref}:srcId`, f.srcId, [['', '출처 선택'], ...j.sources.map(x => [x.id, x.title || x.url || '(이름 없는 자료)'])])}<span class="meta">${f.source === 'AI' ? 'AI' : '직접'}</span>${btn('delFact', '삭제', { id: j.id, f: f.id }, 'quiet')}</div>
${ta(`${ref}:text`, f.text, 2, '내용')}
${f.kind === '사실' && !s ? `<p class="msg err">출처가 없는 '사실'입니다. 출처를 연결하거나 '해석'으로 바꾸세요.</p>` : ''}
${f.source === 'AI' && !f.quoteOk ? `<p class="msg err">AI가 든 근거를 추가한 자료에서 찾지 못했습니다. 확인 전에는 사실로 쓰지 마세요.</p>` : ''}
${s ? `<p class="meta">출처: ${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title || s.url)}</a>` : esc(s.title)} · 자료 본문: ${esc(s.origin || '기록 없음')} · 확인 날짜 ${fmt(s.at)}</p>` : ''}
${f.quote ? `<details><summary>자료 원문 ${f.quoteOk ? '' : '(자료에서 찾지 못함)'}</summary><div class="quote pre">${esc(f.quote)}</div></details>` : ''}
<div class="fld"><span>→ 지원 문서 작성 방향</span>${ta(`${ref}:implication`, f.implication, 2, '이 정보가 문서의 어떤 방향으로 이어지는지')}</div>
${f.expIds?.length ? `<p class="meta">관련 경험: ${f.expIds.map(id => `<a href="#/exp/${id}">${esc(expName(exp(id)))}</a>`).join(', ')}</p>` : ''}</div>`;
}
JT.match = j => {
  const R = reqs(j); if (!R.length) return `<div class="card"><p>요구사항이 없습니다. 먼저 공고를 분석하세요.</p><a class="btn primary" href="#/job/${j.id}/req">요구사항 탭으로</a></div>`;
  const E = realExps(j);
  for (const r of R) j.mapping[r.id] ??= { status: 'unknown', expIds: [], basis: '', gap: '', direction: '', answer: '' };
  const reqUnk = R.filter(r => r.cat === 'required' && j.mapping[r.id].status === 'unknown');
  return `${reqUnk.length ? `<div class="note danger"><b>필수 자격요건 중 확인되지 않은 항목 ${reqUnk.length}개</b> — 경험이 없다는 뜻이 아니라, 지금 입력된 정보로 확인되지 않았다는 뜻입니다. 아래 질문에 답하거나 경험을 추가하세요.<ul>${reqUnk.map(r => `<li>${esc(r.text)}</li>`).join('')}</ul></div>` : ''}
${aiPanel('match', j.id, 'AI로 요구사항–경험 연결 + 작성 전략', `요구사항, 확인한 회사 분석, ${j.sample ? '' : '예시를 뺀 '}경험 항목(원문·피드백 제외)만 보냅니다. 직접 고친 행은 덮어쓰지 않습니다.`)}
${R.map(r => { const m = j.mapping[r.id]; const ref = `map:${j.id}|${r.id}`; const cand = candidates(r, E);
  return `<div class="req"><div>${r.cat === 'required' ? badge('필수', 'req') : badge(CATS[r.cat])} <b>${esc(r.text)}</b></div>
<div class="row">${sel(`${ref}:status`, m.status, Object.entries(MAP_STATUS))} ${badge(MAP_STATUS[m.status], m.status)}</div>
<div class="lbl">연결되는 내 경험</div><div class="explist">${E.map(e => `<label class="chk"><input type="checkbox" data-a2="toggleMapExp" data-id="${j.id}" data-r="${r.id}" data-e="${e.id}" ${m.expIds.includes(e.id) ? 'checked' : ''}> ${esc(expName(e))}</label>`).join('') || '<span class="muted">경험 없음</span>'}</div>
${cand.length ? `<p class="meta">단어가 겹치는 경험(자동 후보·판정 아님): ${cand.map(c => `${esc(expName(c.e))} [${c.hit.join(', ')}]`).join(' / ')}</p>` : ''}
<div class="cols"><div><div class="lbl">연결 근거</div>${ta(`${ref}:basis`, m.basis, 2)}</div><div><div class="lbl">부족한 근거</div>${ta(`${ref}:gap`, m.gap, 2)}</div><div><div class="lbl">작성 방향</div>${ta(`${ref}:direction`, m.direction, 2)}</div></div>
${m.status === 'unknown' ? `<div class="fb improve"><b>${esc(m.ai?.question || '이 요건과 관련해 해본 일이 있나요? 비슷한 일이라도 적어주세요.')}</b>${ta(`${ref}:answer`, m.answer, 2, '답변 — 경험 보관함에 새 경험으로 옮길 수 있습니다')}<div class="row">${btn('answerToExp', '이 답변을 경험 보관함에 추가', { id: j.id, r: r.id }, 'quiet')}</div></div>` : ''}
${m.ai && m.touched ? `<details><summary>AI 제안 보기 (직접 수정해서 적용 안 됨)</summary><p class="meta">${esc(MAP_STATUS[m.ai.status])} · 근거: ${esc(m.ai.basis)} · 부족: ${esc(m.ai.gap)} · 방향: ${esc(m.ai.direction)}</p></details>` : ''}</div>`; }).join('')}
<div class="row"><a class="btn primary" href="#/job/${j.id}/strategy">작성 전략으로 →</a></div>`;
};
JT.strategy = j => `<div class="card"><h2 style="margin-top:0">회사별 작성 전략</h2>
<p class="hint">키워드를 반복하지 말고 실제 경험에 근거해 쓰세요. 회사의 가치 문구를 내 특성처럼 옮겨 쓰지 않습니다. AI 제안은 [경험 연결] 탭의 AI 연결 실행 시 함께 나오며, 비어 있는 칸만 채웁니다.</p>
${STRATEGY.map(([k, l]) => `<div class="fld"><span>${l}</span>${ta(`job:${j.id}:strategy.${k}`, j.strategy[k], 3)}${j.strategyAI?.[k] && j.strategyAI[k] !== j.strategy[k] ? `<details><summary>AI 제안 보기</summary><div class="pre quote">${esc(j.strategyAI[k])}</div>${btn('useStrategyAI', '이 제안으로 교체', { id: j.id, k }, 'quiet')}</details>` : ''}</div>`).join('')}</div>
<div class="row"><a class="btn primary" href="#/job/${j.id}/docs">지원 문서로 →</a></div>`;
JT.docs = j => {
  const D = S.docs.filter(d => d.jobId === j.id); const p = UI.pick?.jobId === j.id ? UI.pick : null;
  const M = S.docs.filter(isMaster);
  return `<div class="card"><h2 style="margin-top:0">이 공고의 지원 문서</h2><p class="hint">기본 문서를 복사해 이 공고용으로 고칩니다. 기본 문서는 바뀌지 않습니다.</p>
${M.length ? M.map(m => `<div class="row">${btn('tailor', `＋ "${esc(m.title)}"로 이 공고용 만들기`, { m: m.id, j: j.id }, 'primary')}</div>`).join('') : `<p class="note">아직 기본 문서가 없습니다. <a href="#/docs">이력서·경력기술서</a>에서 기본 이력서를 먼저 쓰세요.</p>`}
<details ${p ? 'open' : ''}><summary>경험 보관함에서 새로 만들기 (선택)</summary>
<div class="row">${btn('pickDoc', '＋ 경험으로 이력서 만들기', { id: j.id, t: 'resume' })}${btn('pickDoc', '＋ 경험으로 경력기술서 만들기', { id: j.id, t: 'career' })}</div>
${p ? `<div class="fb optional"><b>${DOC_TYPES[p.type]}에 넣을 경험 선택</b><p class="hint">[경험 연결]에서 이 공고와 연결한 경험은 미리 선택돼 있고, 연결이 많은 순서로 배치됩니다. ${p.type === 'resume' ? "[작성 전략]의 요약 메시지·핵심 역량은 요약·핵심 역량 초안으로 들어갑니다(미확인 상태)." : ''} '확인 필요' 항목에서 나온 문장은 미확인으로 표시돼 제출본에서 빠집니다.</p>
${realExps(j).map(e => `<label class="chk" style="display:flex"><input type="checkbox" data-a2="pickExp" data-e="${e.id}" ${p.sel.includes(e.id) ? 'checked' : ''}> ${esc(expName(e))} <span class="meta">${esc(e.period)} ${linkScore(job(p.jobId), e.id) ? '· 이 공고와 연결됨' : ''} ${openCount(e, 'must') ? '· 제출 전 확인 필요 ' + openCount(e, 'must') : ''}</span></label>`).join('') || '<p class="muted">경험이 없습니다.</p>'}
<div class="row">${btn('genDoc', '문서 만들기', {}, 'primary', !p.sel.length)}${btn('cancelPick', '취소', {}, 'quiet')}</div></div>` : ''}</details>
${D.length ? `<table class="t"><thead><tr><th>문서</th><th>수정 시각</th><th>버전</th><th>알림</th></tr></thead><tbody>${D.map(d => `<tr><td><a href="#/doc/${d.id}">${esc(d.title)}</a> ${badge(DOC_TYPES[d.type])}${d.basedOn ? ` <span class="meta">기본 문서에서 복사</span>` : ''}</td><td>${fmt(d.updatedAt)}</td><td>${d.versions.length}</td><td>${staleExps(d).length ? badge('원본 변경 ' + staleExps(d).length, 'improve') : '-'}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">아직 문서가 없습니다.</p>'}</div>`;
};

V.docs = () => {
  const M = S.docs.filter(isMaster); const ip = UI.impPreview;
  return `<h1>이력서 · 경력기술서</h1>
<div class="card"><h2 style="margin-top:0">1. 기본 문서</h2><p class="hint">모든 경력을 담은 '전체 버전'입니다. 공고에 지원할 때는 이걸 복사해서 고치고, 기본 문서는 그대로 둡니다.</p>
${M.length ? `<table class="t"><tbody>${M.map(d => `<tr><td><a href="#/doc/${d.id}"><b>${esc(d.title)}</b></a> ${badge(DOC_TYPES[d.type])}<br><span class="meta">채운 문장 ${d.sentences.filter(x => x.text.trim()).length}개 · 수정 ${fmt(d.updatedAt)}${d.importedFrom ? ` · 파일에서 불러옴(${esc(d.importedFrom.name)})` : ''}</span></td><td class="meta">공고용 복사본 ${S.docs.filter(x => x.basedOn === d.id).length}개</td></tr>`).join('')}</tbody></table>` : ''}
<div class="row">${btn('newMaster', '＋ 기본 이력서 새로 쓰기', { t: 'resume' }, M.some(d => d.type === 'resume') ? '' : 'primary')}${btn('newMaster', '＋ 기본 경력기술서 새로 쓰기', { t: 'career' }, M.some(d => d.type === 'career') ? '' : 'primary')}</div></div>
<div class="card"><h2 style="margin-top:0">가지고 있는 이력서 불러오기 <span class="meta">선택</span></h2>
<p class="hint">PDF · Word(DOCX·DOC) · RTF · 한글(HWPX) · 텍스트 파일을 올리면 글자만 뽑아 기본 문서로 나눠 넣습니다. 파일 자체는 저장하지 않습니다. 한글 .hwp는 한글에서 PDF나 DOCX로 저장해 올려주세요.</p>
<div class="row"><select id="imp-type"><option value="resume" ${UI.impType !== 'career' ? 'selected' : ''}>이력서로 불러오기</option><option value="career" ${UI.impType === 'career' ? 'selected' : ''}>경력기술서로 불러오기</option></select>
<label class="btn primary">${UI.busy.extract ? '읽는 중…' : '파일 첨부'}<input type="file" id="resume-file" accept=".pdf,.docx,.doc,.rtf,.odt,.hwpx,.hwp,.txt,.md" hidden></label></div>
<details><summary>파일 대신 내용을 붙여넣기</summary><textarea id="imp-text" rows="8" placeholder="이력서 내용을 복사해 붙여넣으세요."></textarea><div class="row">${btn('importPaste', '나눠서 미리보기')}</div></details>
${UI.impMsg ? `<p class="msg ${UI.impMsg.type}">${esc(UI.impMsg.text)}</p>` : ''}
${ip ? `<div class="fb optional"><b>미리보기 — ${esc(ip.name)}</b> <span class="meta">섹션 ${ip.parsed.groups.length}개 · 문장 ${ip.parsed.sentences.length}개 · ${DOC_TYPES[ip.type]}</span>
<p class="hint">짧은 줄은 섹션 제목, 글머리표나 긴 줄은 문장으로 나눴습니다. 틀린 곳은 만든 뒤 문서에서 고칠 수 있고, 원문도 함께 보관됩니다.</p>
${ip.parsed.groups.slice(0, 12).map(g => `<p><b>${esc(g.title)}</b> <span class="meta">문장 ${ip.parsed.sentences.filter(x => x.grp === g.key).length}개</span></p>`).join('')}${ip.parsed.groups.length > 12 ? `<p class="meta">… 외 ${ip.parsed.groups.length - 12}개</p>` : ''}
<details><summary>뽑아낸 원문 보기</summary><div class="pre quote">${esc(ip.text.slice(0, 5000))}</div></details>
<div class="row">${btn('impConfirm', `기본 ${DOC_TYPES[ip.type]}로 만들기`, {}, 'primary')}${btn('impCancel', '취소', {}, 'quiet')}</div></div>` : ''}</div>
<div class="card"><h2 style="margin-top:0">2. 공고별 문서</h2><p class="hint">지원 회사 → [지원 문서] 탭에서 기본 문서를 복사해 만듭니다.</p>
${S.jobs.map(j => { const D = S.docs.filter(d => d.jobId === j.id); return `<div class="card"><a href="#/job/${j.id}/docs"><b>${esc(j.company || '회사명 미입력')}</b></a> ${sampleB(j)} <span class="meta">${esc(j.position)}</span>
${D.length ? `<ul>${D.map(d => `<li><a href="#/doc/${d.id}">${esc(d.title)}</a> ${badge(DOC_TYPES[d.type])} <span class="meta">수정 ${fmt(d.updatedAt)} · 버전 ${d.versions.length}</span> ${staleExps(d).length ? badge('원본 변경', 'improve') : ''}</li>`).join('')}</ul>` : '<p class="meta">문서 없음</p>'}</div>`; }).join('') || `<p class="muted">지원 공고가 없습니다.</p>${btn('newJob', '＋ 지원 공고 추가', {}, 'primary')}`}</div>`;
};

// ───────── 문서 편집 화면: 왼쪽 문서 · 오른쪽 문맥 피드백 ─────────
// 문장 단위 규칙 점검 (AI 없이 작동). 판정이 아니라 "더 물어볼 곳"을 짚는다.
function verifyWhat(s) {
  if (s.fromStrategy) return '작성 전략에서 가져온 초안입니다. 실제로 한 일인지, 어떤 경험이 근거인지 확인하세요.';
  const e = s.expIds.map(exp).find(x => x?.unknown?.[s.field]);
  if (e) return `경험 「${expName(e)}」의 ${LABEL[s.field] || '내용'}이(가) '확인 필요'로 적혀 있습니다. 기간·수치·역할이 맞는지 확인하세요.`;
  if (/확인\s*필요/.test(s.text)) return '문장 안에 "확인 필요"가 남아 있습니다. 빈 곳을 채우거나 그 부분을 지우세요.';
  if (s.aiWarn) return `AI 수정안에 원래 문장·내 답변에 없던 표현(${s.aiWarn})이 들어왔습니다. 사실인지 확인하세요.`;
  return '미확인으로 표시한 문장입니다. 사실이 맞는지 확인한 뒤 표시를 푸세요.';
}
function sentChecks(d, s) {
  const t = (s.text || '').trim(), out = []; if (!t) return out;
  const g = d.groups.find(x => x.key === s.grp), body = !!(g?.career || g?.expId);
  const add = (key, level, issue, why, question) => { if (!s.skip?.[key]) out.push({ key, level, issue, why, question }); };
  if (s.unverified) add('verify', 'must', '확인이 필요한 문장', verifyWhat(s), '확인한 사실을 적어주세요. 확인할 수 없으면 "확인 불가"라고 적으세요 — 미확인으로 두면 제출본에서 자동으로 빠집니다.');
  const nums = t.match(NUM_RE);
  if (nums) {
    if (!s.expIds.map(exp).some(e => e?.f?.evidence?.trim())) add('num-evidence', 'must', `수치(${uniq(nums).join(', ')})의 근거가 연결되지 않음`, '수치는 면접·평판 조회에서 확인될 수 있습니다. 어디서 나온 숫자인지 답할 수 있어야 합니다.', '이 수치는 어디서 확인했나요? (매출 보고서, 본사 평가, 시스템 화면 등)');
    if (!PERIOD_RE.test(t)) add('num-base', 'improve', '수치의 기간·비교 기준이 없음', '"20% 상승"은 언제와 비교해 얼마 동안인지가 있어야 의미가 생깁니다.', '이 수치는 어느 기간에, 무엇과 비교한 값인가요?');
  }
  const h = t.match(HYPE_RE);
  if (h) add('hype', /주도|총괄|달성/.test(h.join()) ? 'must' : 'improve', `모호하거나 과장될 수 있는 표현: ${uniq(h).join(', ')}`, '"주도·총괄·달성"은 실제 역할·결과가 뒷받침될 때만 씁니다. "크게·많이·다양한"은 읽는 사람이 규모를 알 수 없습니다.', '이 표현을 사실로 바꾸면요? 무엇을, 몇 번, 누구와, 어느 범위까지 했나요?');
  if (/(우리|팀이|팀과|팀원들과|함께|다 같이|전원)/.test(t) && !/(내가|제가|직접|담당|맡)/.test(t)) add('role', 'improve', '팀이 한 일과 내가 한 일이 섞여 있음', '어디까지가 본인 몫인지 보여야 역량으로 읽힙니다.', '이 중 본인이 직접 한 부분은 무엇인가요?');
  if (/(교육|트레이닝|코칭|온보딩)/.test(t) && !/(대상|\d+\s*명)/.test(t)) add('training', 'improve', '교육의 대상·내용·본인 역할이 드러나지 않음', '누구에게 무엇을 어떻게 했는지, 설계했는지 진행만 했는지가 보여야 합니다.', '교육 대상(직급·인원), 내용, 본인이 맡은 범위(설계·진행·점검)는 무엇이었나요?');
  if (body && t.replace(/\s/g, '').length < 18) add('thin', 'improve', '짧아서 구체적인 행동이 보이지 않음', '무엇을·누구에게·어떤 방식으로 했는지가 보여야 역량이 전달됩니다.', '구체적으로 무엇을 했나요? 대상·방법·빈도(또는 기간)를 적어주세요.');
  if (s.label === '성과' && !nums) add('no-num', 'optional', '수치 없는 성과 — 결과물·범위·피드백으로 보강할 수 있는지', '수치가 없어도 결과물·맡은 범위·받은 피드백이면 근거가 됩니다. 없는 숫자를 만들 필요는 없습니다.', '이 일로 남은 결과물이나 받은 피드백(상사·고객·본사)이 있나요?');
  return out;
}
const LV_ORDER = ['must', 'improve', 'optional'];
const docIssues = d => d.sentences.filter(s => s.text.trim()).flatMap(s => sentChecks(d, s).map(c => ({ s, c }))).sort((a, b) => LV_ORDER.indexOf(a.c.level) - LV_ORDER.indexOf(b.c.level));
// 경험을 문서의 경력 섹션으로 넣는다. 비어 있는 자리표시 경력은 치운다.
function addExpGroups(d, ids) {
  const j = job(d.jobId); ids = [...ids].sort((a, b) => linkScore(j, b) - linkScore(j, a));
  const blankG = new Set(d.groups.filter(g => g.career && !g.expId && !hasCF(g) && !g.title.trim() && !d.sentences.some(s => s.grp === g.key && s.text.trim())).map(g => g.key));
  d.groups = d.groups.filter(g => !blankG.has(g.key)); d.sentences = d.sentences.filter(s => !blankG.has(s.grp));
  let at = d.groups.findIndex(g => g.key === 'edu'); if (at < 0) at = d.groups.length; let n = 0;
  for (const id of ids) {
    const e = exp(id); if (!e || d.groups.some(g => g.expId === id)) continue; const key = 'exp-' + e.id;
    d.groups.splice(at++, 0, { key, title: groupTitle(e), expId: e.id, unverified: headUnverified(e) });
    d.sentences.push(...sentencesFor(d.type, e, key)); (d.src ??= {})[e.id] = snap(e); n++;
  }
  return n;
}
const docEmpty = d => !d.sentences.some(s => s.text.trim());

V.doc = r => {
  const d = doc(r.id); if (!d) return notFound(); const j = job(d.jobId);
  const master = isMaster(d), base = d.basedOn ? doc(d.basedOn) : null, stale = staleExps(d);
  const pc = UI.show['check:' + d.id] ? preCheck(d) : null, unv = d.sentences.filter(s => s.unverified).length;
  const nIssue = docIssues(d).filter(x => x.c.level !== 'optional').length;
  const head = `<div class="doc-head"><a class="back" href="${master ? '#/docs' : `#/job/${d.jobId}/docs`}">← ${master ? '이력서 · 경력기술서' : esc(j?.company || '지원 회사')}</a>
<div class="ctx">${master ? `${badge('공통 문서', 'ctxb')} <span>어느 공고에도 연결되지 않은 기본 문서</span>` : `${badge('지원 문서', 'ctxb on')} <b>${esc(j?.company || '(삭제된 공고)')}</b>${j?.position ? ` · ${esc(j.position)}` : ''}`} · <b>${DOC_TYPES[d.type]}</b></div>
${UI.show['title:' + d.id] ? `<div class="row">${inp(`doc:${d.id}:title`, d.title)}${btn('toggle', '완료', { k: 'title:' + d.id }, 'quiet')}</div>` : `<h1>${esc(d.title)} ${btn('toggle', '이름 바꾸기', { k: 'title:' + d.id }, 'link small')}</h1>`}
<p class="meta">${master ? `공고에 지원할 때는 이 문서를 복사해 고칩니다(복사본 ${S.docs.filter(x => x.basedOn === d.id).length}개)` : `${d.basedOn ? `복사한 기본 문서: ${base ? `<a href="#/doc/${base.id}">${esc(base.title)}</a>` : '(삭제됨)'} · ` : ''}여기서 고친 내용은 이 회사 문서에만 남습니다`} · 수정 ${fmt(d.updatedAt)}</p>
<div class="row toolbar no-print">${btn('toggleCheck', pc ? '점검 닫기' : '제출 전 점검', { id: d.id }, 'primary')}<a class="btn" href="#/print/${d.id}">인쇄 · PDF</a>${btn('copyDoc', '텍스트 복사', { id: d.id })}${btn('saveVer', '버전 저장', { id: d.id }, 'quiet')}
<details class="more" ${UI.confirm === 'del-doc-' + d.id ? 'open' : ''}><summary class="btn quiet" aria-label="문서 메뉴 더보기">⋯</summary><div class="menu">${btn('mdDoc', 'Markdown 다운로드', { id: d.id }, 'link')}${confirmBtn('del-doc-' + d.id, '문서 삭제', 'delDoc', { id: d.id })}</div></details></div></div>`;
  const notices = `${base && base.updatedAt > d.baseAt ? `<div class="note warn no-print">기본 문서가 이 문서를 만든 뒤 수정됐습니다. 필요한 부분만 옮기거나 새로 복사하세요. ${btn('ackBase', '확인함', { id: d.id }, 'quiet')} <a href="#/doc/${base.id}">기본 문서 보기</a></div>` : ''}
${stale.map(id => { const e = exp(id); const old = d.src[id]; const diff = e ? ALL.filter(([k]) => val(old, k) !== val(e, k)) : [];
  return `<div class="note warn no-print"><b>원본 경험이 바뀌었습니다: ${esc(e ? expName(e) : old.org || '삭제된 경험')}</b>${e ? '' : ' — 원본이 삭제됐습니다.'}
${diff.length ? `<details><summary>바뀐 항목 ${diff.length}개 보기</summary>${diff.map(([k, l]) => `<h4>${l}</h4><div class="cmp"><div><span>문서 만들 때</span><div class="before">${esc(val(old, k)) || '(비어 있음)'}</div></div><div><span>지금 원본</span><div class="after">${esc(val(e, k)) || '(비어 있음)'}</div></div></div>`).join('')}</details>` : ''}
<div class="row">${e ? btn('regen', '바뀐 내용으로 수정안 보기', { id: d.id, e: id }) : ''}${btn('ackStale', '검토함 · 현재 문서 유지', { id: d.id, e: id }, 'quiet')}</div></div>`; }).join('')}
${pc ? checkView(d, pc) : ''}${unv ? `<p class="note warn">'확인 필요' 문장 ${unv}개는 복사·다운로드·인쇄 때 자동으로 빠집니다. 문장 옆 표시에서 무엇을 확인할지 볼 수 있습니다.</p>` : ''}`;
  const empty = docEmpty(d) && !UI.show['blank:' + d.id];
  const left = `${notices}${UI.dpick?.docId === d.id ? draftPicker(d) : empty ? emptyState(d) : ''}
${empty ? '' : `${d.importedFrom?.text ? `<details class="no-print"><summary>불러온 원문 보기 (${esc(d.importedFrom.name)})</summary><div class="pre quote">${esc(d.importedFrom.text)}</div></details>` : ''}
<div class="doc-body">${d.groups.map((g, i) => secView(d, g, i)).join('')}</div>
<div class="row no-print">${S.experiences.length ? btn('draftPick', '＋ 저장한 경험에서 가져오기', { id: d.id }) : ''}${btn('addGrp', '＋ 경력 직접 쓰기', { id: d.id }, 'quiet')}${btn('addSec', '＋ 섹션', { id: d.id }, 'quiet')}</div>`}
<details class="no-print"><summary>버전 ${d.versions.length}개</summary>${d.versions.length ? `<table class="t"><tbody>${d.versions.map(v => `<tr><td>${esc(v.label)}<br><span class="meta">${fmt(v.at)} · 문장 ${v.sentences.length}개</span></td><td style="text-align:right">${btn('restoreVer', '이 버전으로 복원', { id: d.id, v: v.id }, 'quiet')} ${btn('dupVer', '새 문서로 복제', { id: d.id, v: v.id }, 'quiet')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">저장한 버전이 없습니다. 수정 적용·복원 전에는 자동으로 저장됩니다.</p>'}</details>`;
  return head + `<div class="doc-layout">${split('doc', { label: '문서', html: left }, { label: `피드백${nIssue ? ' ' + nIssue : ''}`, html: `<div id="fbpanel">${fbPanel(d)}</div>` })}</div>`;
};
function emptyState(d) {
  const E = realExps(job(d.jobId));
  return `<div class="empty no-print"><h2>어디서부터 채울까요?</h2>
${E.length ? `<p>경험 보관함에 저장한 경험 ${E.length}개가 있습니다. 골라서 넣으면 회사·직책·기간과 주요 업무·성과 문장이 초안으로 들어가고, 오른쪽에서 문장마다 보완할 곳을 짚어 드립니다.</p>
<div class="row">${btn('draftPick', '저장한 경험에서 초안 만들기', { id: d.id }, 'primary lg')}</div>`
    : `<p>아직 저장한 경험이 없습니다. 질문 몇 개에 답하면 경험이 정리되고, 그걸로 이 문서의 초안을 만듭니다.</p>
<div class="row">${btn('newExp', '질문에 답하며 경험 추가', { m: 'q' }, 'primary lg')}<a class="btn" href="#/docs">가지고 있는 이력서 불러오기</a></div>`}
<p class="hint">경력 요약·핵심 역량은 경력 문장이 채워진 뒤에 써도 됩니다. ${btn('toggle', '빈 양식에 직접 쓰기', { k: 'blank:' + d.id }, 'link')}</p></div>`;
}
function draftPicker(d) {
  const p = UI.dpick, j = job(d.jobId), E = realExps(j);
  return `<div class="empty no-print"><h2>초안에 넣을 경험 고르기</h2><p class="hint">${j ? '[경험 연결]에서 이 공고와 연결한 경험이 먼저 선택돼 있고, 연결이 많은 순서로 배치됩니다. ' : ''}경험의 '확인 필요' 항목에서 나온 문장은 미확인으로 들어가 제출본에서 빠집니다.</p>
${E.map(e => { const inDoc = d.groups.some(g => g.expId === e.id); return `<label class="chk pick"><input type="checkbox" data-a2="dpickExp" data-e="${e.id}" ${p.sel.includes(e.id) ? 'checked' : ''} ${inDoc ? 'disabled' : ''}> <b>${esc(expName(e))}</b> <span class="meta">${esc(e.period || '기간 미입력')}${inDoc ? ' · 이미 문서에 있음' : ''}${linkScore(j, e.id) ? ' · 이 공고와 연결됨' : ''}${e.f?.action || e.f?.result ? '' : ' · 주요 업무·성과가 비어 있음'}</span></label>`; }).join('')}
<div class="row">${btn('draftGen', `초안 만들기${p.sel.length ? ` (${p.sel.length}개)` : ''}`, { id: d.id }, 'primary', !p.sel.length)}${btn('draftCancel', '취소', {}, 'quiet')}${btn('newExp', '＋ 경험 새로 추가', { m: 'q' }, 'link')}</div></div>`;
}
function secView(d, g, i) {
  const ss = d.sentences.filter(s => s.grp === g.key), j = job(d.jobId);
  const light = (g.key === 'summary' || g.key === 'skills') && !ss.some(s => s.text.trim()) && !UI.show['w:' + d.id + g.key];
  const title = gTitle(g) || (g.career ? '새 경력 — 회사·기간을 입력하세요' : '제목 없는 섹션');
  if (g.career && !g.expId && !gTitle(g) && UI.show['t:' + g.key] === undefined) UI.show['t:' + g.key] = true; // 새 경력은 칸부터 연다
  const editing = !!UI.show['t:' + g.key];
  const e = g.expId ? exp(g.expId) : null;
  const links = e ? reqs(j).filter(r => j.mapping[r.id]?.expIds?.includes(g.expId)) : [];
  return `<section class="sec">
<div class="sec-h"><h3>${esc(title)}</h3>${g.unverified ? `<span class="flag must" title="${esc('원본 경험의 회사명·직책·기간 중 비었거나 확인 필요로 표시된 값이 있습니다.')}">회사·직책·기간 확인 필요</span>` : ''}
<span class="sec-tools no-print">${btn('toggle', editing ? '완료' : '제목 편집', { k: 't:' + g.key }, 'link small')}
<details class="more" ${UI.confirm === 'del-grp-' + g.key ? 'open' : ''}><summary aria-label="섹션 메뉴">⋯</summary><div class="menu">${btn('grpMove', '위로 이동', { id: d.id, g: g.key, dir: -1 }, 'link', i === 0)}${btn('grpMove', '아래로 이동', { id: d.id, g: g.key, dir: 1 }, 'link', i === d.groups.length - 1)}${e ? `<a href="#/exp/${e.id}">원본 경험 열기</a>` : ''}${confirmBtn('del-grp-' + g.key, '섹션 삭제', 'delGrp', { id: d.id, g: g.key })}</div></details></span></div>
${editing ? (g.career && !g.expId ? careerView(d, g) : `<div class="fld">${inp(`grp:${d.id}|${g.key}:title`, g.title, '섹션 제목')}${g.expId ? chk(`grp:${d.id}|${g.key}:unverified`, g.unverified, '회사·직책·기간 확인 필요', true) : ''}</div>`) : ''}
${links.length ? `<p class="meta no-print">이 공고와 연결: ${links.map(r => esc(r.text)).join(' · ')}</p>` : ''}
${light ? `<p class="hint no-print">${g.key === 'summary' ? '경력 문장을 채운 뒤 한두 줄로 쓰면 됩니다.' : '경력 문장에서 확인된 역량만 적으면 됩니다.'} ${btn('toggle', '지금 쓰기', { k: 'w:' + d.id + g.key }, 'link')}</p>`
    : ss.map((s, k) => sentView(d, g, s, k, ss.length, ss[k - 1]?.label)).join('') || `<p class="hint">문장이 없습니다.${e ? ` 이 경험의 주요 업무·성과가 비어 있습니다 — <a href="#/exp/${e.id}/q">질문에 답해 채우기</a>` : ''}</p>`}
${light ? '' : `<div class="no-print">${btn('addSent', '＋ 문장', { id: d.id, g: g.key }, 'link small')}</div>`}</section>`;
}
function sentView(d, g, s, k, n, prevLabel) {
  const ref = `sent:${d.id}|${s.id}`, cs = sentChecks(d, s), sel = UI.sel[d.id] === s.id;
  const top = cs.find(c => c.level !== 'optional');
  const ph = HINT[s.label] || (g.key === 'summary' ? '예: 리테일 현장에서 ○년간 … (확인된 사실만)' : g.key === 'skills' ? '예: 매장 운영, 팀 교육 (경험에서 확인된 것만)' : '');
  return `<div class="sent ${sel ? 'sel' : ''} ${s.unverified ? 'unv' : ''}" data-doc="${d.id}" data-sid="${s.id}">
${s.label && s.label !== prevLabel ? `<span class="slabel">${esc(s.label)}</span>` : ''}${ta(`${ref}:text`, s.text, 1, ph)}
${s.unverified ? `<p class="flag-line"><span class="flag must">확인 필요</span> ${esc(verifyWhat(s))}</p>` : top ? `<p class="flag-line"><span class="flag ${top.level}">${esc(LEVELS[top.level])}</span> ${esc(top.issue)}${cs.length > 1 ? ` 외 ${cs.length - 1}개` : ''}</p>` : ''}${s.prop ? `<p class="flag-line"><span class="flag ok">수정안 있음</span> 오른쪽에서 비교 후 적용</p>` : ''}
<div class="stools no-print"><label>인쇄 소제목 ${sel_(`${ref}:label`, s.label, LABELS[d.type].map(l => [l, l || '없음']))}</label>${chk(`${ref}:unverified`, s.unverified, '확인 필요로 표시', true)}${btn('sentMove', '↑', { id: d.id, s: s.id, dir: -1 }, 'link', k === 0)}${btn('sentMove', '↓', { id: d.id, s: s.id, dir: 1 }, 'link', k === n - 1)}${btn('delSent', '삭제', { id: d.id, s: s.id }, 'link')}${btn('tab', `피드백 보기${cs.length ? ' ' + cs.length : ''}`, { k: 'doc', i: 1 }, 'quiet only-m')}</div></div>`;
}
const sel_ = (b, v, opts) => sel(b, v, opts, false);
function fbPanel(d) {
  const s = d.sentences.find(x => x.id === UI.sel[d.id]);
  return s ? sentPanel(d, s) : docPanel(d);
}
function sentPanel(d, s) {
  const ref = `sent:${d.id}|${s.id}`, cs = sentChecks(d, s), E = s.expIds.map(exp).filter(Boolean), g = d.groups.find(x => x.key === s.grp);
  const answered = cs.filter(c => s.qa?.[c.key]?.trim()).length;
  return `<div class="panel-h"><b>선택한 문장</b> ${btn('selSent', '← 문서 전체 보기', { id: d.id, s: '' }, 'link small')}</div>
<p class="quote">${s.text.trim() ? esc(s.text) : '<span class="muted">(비어 있음 — 왼쪽에서 쓰세요)</span>'}</p>
<p class="meta">${esc(gTitle(g) || '')}${E.length ? ` · 근거 경험: ${E.map(e => `<a href="#/exp/${e.id}">${esc(expName(e))}</a>`).join(', ')}` : ' · 연결된 경험 없음'}${isMaster(d) ? '' : ' · 고치면 이 회사 문서에만 반영'}</p>
${s.undo ? `<div class="msg ok">방금 수정안을 적용했습니다. ${btn('sentUndo', '되돌리기', { id: d.id, s: s.id }, 'link')}</div>` : ''}
${s.prop ? `<div class="proposal"><h4>수정안 <span class="meta">${s.prop.source === 'AI' ? 'AI' : '규칙 초안'}</span></h4>
<div class="cmp"><div><span>지금 문장</span><div class="before">${esc(s.prop.before) || '(비어 있음)'}</div></div><div><span>수정안 — 직접 고쳐도 됩니다</span>${ta(`${ref}:prop.after`, s.prop.after, 3)}</div></div>
<p class="hint">${esc(s.prop.reason)}</p>${s.prop.warn ? `<p class="msg err">${esc(s.prop.warn)}</p>` : ''}
<div class="row">${btn('sentApply', '적용', { id: d.id, s: s.id }, 'primary')}${btn('sentCancel', '취소', { id: d.id, s: s.id }, 'quiet')}</div></div>` : ''}
${!s.text.trim() ? '' : cs.length ? cs.map(c => `<article class="fb ${c.level}"><div>${badge(LEVELS[c.level], c.level)}</div>
<dl><dt>부족한 부분</dt><dd>${esc(c.issue)}</dd><dt>보완 이유</dt><dd>${esc(c.why)}</dd><dt>추가 질문</dt><dd><b>${esc(c.question)}</b></dd></dl>
${ta(`${ref}:qa.${c.key}`, s.qa?.[c.key] || '', 2, '여기에 답하세요. 모르면 "확인 필요"라고 적어도 됩니다.')}
<div class="row">${btn('sentPropose', '답변으로 수정안 만들기', { id: d.id, s: s.id, k: c.key })}${btn('sentSkip', '해당 없음', { id: d.id, s: s.id, k: c.key }, 'quiet')}</div></article>`).join('')
    : `<p class="msg ok">규칙 점검에서 걸린 곳이 없습니다.</p><p class="hint">규칙 점검은 수치 근거·과장 표현·역할 구분·구체성만 봅니다. 문장 전체를 다시 다듬고 싶다면 아래 AI 수정을 쓰세요.</p>`}
${s.text.trim() ? `<details class="ai-wrap" ${answered || UI.aiMsg['sent:' + d.id + '|' + s.id] ? 'open' : ''}><summary>답변을 반영해 문장 다시 쓰기 (AI)</summary>
${aiPanel('sent', d.id + '|' + s.id, '이 문장 수정안', `이 문장, 내가 적은 답변${E.length ? ', 근거 경험 원본' : ''}만 보냅니다. 답변에 없는 수치·성과는 넣지 않도록 요청하고, 들어오면 자동으로 '확인 필요'로 표시합니다.`)}</details>` : ''}
${s.skip && Object.keys(s.skip).length ? `<p class="meta">넘긴 항목 ${Object.keys(s.skip).length}개 ${btn('sentUnskip', '다시 보기', { id: d.id, s: s.id }, 'link')}</p>` : ''}`;
}
function docPanel(d) {
  const j = job(d.jobId), master = isMaster(d), I = docIssues(d);
  const byLv = lv => I.filter(x => x.c.level === lv).length;
  const rq = d.revReq && reqs(j).find(x => x.id === d.revReq), rqExp = rq ? (j.mapping[rq.id]?.expIds || []).map(exp).filter(Boolean) : [];
  return `<div class="panel-h"><b>문서 전체</b> <span class="meta">왼쪽에서 문장을 누르면 그 문장의 피드백이 나옵니다</span></div>
<h4>보완할 문장 ${I.length ? LV_ORDER.map(lv => byLv(lv) ? badge(LEVELS[lv] + ' ' + byLv(lv), lv) : '').join(' ') : ''}</h4>
${I.length ? `<ul class="issues">${I.filter(x => x.c.level !== 'optional').slice(0, 10).map(({ s, c }) => `<li><button type="button" class="linkish" data-a="selSent" data-id="${d.id}" data-s="${s.id}">${badge(LEVELS[c.level], c.level)} ${esc(c.issue)}<span class="meta"> — “${esc(s.text.slice(0, 40))}${s.text.length > 40 ? '…' : ''}”</span></button></li>`).join('')}</ul>`
    : `<p class="hint">${docEmpty(d) ? '문장이 채워지면 여기서 보완할 곳을 짚어 드립니다.' : '규칙 점검에서 걸린 문장이 없습니다.'}</p>`}
${master ? '' : !j ? '' : reqs(j).length ? `<h4>공고 요구사항 ↔ 내 경험</h4><p class="hint">[경험 연결]에서 이 요건에 연결한 경험을 근거로 수정안을 받습니다. 해보지 않은 일은 추가하지 않습니다.</p>
${coverage(d, j).map(({ r, hits }) => { const ex = (j.mapping[r.id]?.expIds || []).map(exp).filter(Boolean); return `<div class="req-line"><div>${r.cat === 'required' ? badge('필수', 'req') : badge(CATS[r.cat])} ${esc(r.text)}</div>
<p class="meta">${ex.length ? `연결한 경험: ${ex.map(e => esc(expName(e))).join(', ')}` : `연결한 경험 없음 — <a href="#/job/${j.id}/match">경험 연결</a>에서 연결하세요`}${hits.length ? ` · 관련 문장 ${hits.length}개` : ''}</p>
${ex.length ? btn('reqRevise', '이 요건에 맞춰 수정 제안', { id: d.id, r: r.id }, 'quiet small') : ''}</div>`; }).join('')}`
    : `<p class="note">공고 요구사항이 아직 없습니다. <a href="#/job/${j.id}/req">요구사항 탭</a>에서 분석하면 여기서 내 경험과 맞춰 수정 제안을 받을 수 있습니다.</p>`}
${docEmpty(d) ? '' : `<h4>수정 요청</h4>
<div class="row">${PRESETS.filter(p => !master || !p.includes('공고')).map(p => btn('preset', p, { id: d.id, p }, d.revInstr === p ? 'primary small' : 'quiet small')).join('')}</div>
${ta(`doc:${d.id}:revInstr`, d.revInstr, 2, '직접 적어도 됩니다. 예: 매장 데이터 분석 업무가 먼저 보이게')}
${rq ? `<p class="meta">근거로 쓸 경험: ${rqExp.map(e => esc(expName(e))).join(', ')} · 이 회사 문서에만 적용되고 경험 원본은 바뀌지 않습니다</p>` : ''}
${aiPanel('revise', d.id, '수정안 받기', `문서 문장, 수정 요청, ${master ? '' : '공고 요구사항, '}이 문서에 쓰인 경험 원본만 보냅니다. 원본에 없는 수치가 들어오면 자동으로 걸러 표시합니다.`)}
${d.revision ? revView(d, d.revision) : ''}`}`;
}
function careerView(d, g) {
  const r = k => `grp:${d.id}|${g.key}:${k}`, t = tenure(g);
  return `<div class="grid2"><div class="fld"><span>회사</span>${inp(r('company'), g.company || '', '예: 룰루레몬애틀라티카코리아', 'text', true)}</div><div class="fld"><span>직책 · 담당</span>${inp(r('role'), g.role || '', '예: Key Leader', 'text', true)}</div></div>
<div class="grid2"><div class="fld"><span>입사 (년.월)</span>${inp(r('start'), g.start || '', '예: 2022.07', 'text', true)}</div><div class="fld"><span>퇴사 (년.월)</span>${g.current ? '<input value="재직중" disabled>' : inp(r('end'), g.end || '', '예: 2025.11', 'text', true)}${chk(r('current'), g.current, '재직중', true)}</div></div>
<p class="meta">근속기간 <b>${t || (g.start && (g.end || g.current) ? '기간을 확인하세요' : '-')}</b>${t ? ' — 입사월부터 퇴사월까지 자동 계산' : ''}</p>`;
}
function revView(d, rev) {
  const pend = rev.changes.filter(c => c.status === 'pending').length;
  return `<h3>수정안 — "${esc(rev.instr)}" <span class="meta">${esc(rev.source)} · ${fmt(rev.at)}</span></h3>${isMaster(d) ? '' : '<p class="hint">이 회사 문서에만 적용됩니다. 기본 문서와 경험 원본은 바뀌지 않습니다.</p>'}
<div class="row">${btn('applyAll', `전체 적용 (${pend})`, { id: d.id }, 'primary', !pend)}${btn('closeRev', '수정안 닫기', { id: d.id }, 'quiet')}</div>
${rev.changes.map(c => `<div class="fb ${c.status === 'applied' ? 'optional' : c.warn ? 'must' : 'improve'}">
<div class="meta">${c.kind === 'title' ? '경력 제목' : esc(c.label || '')} ${c.status === 'applied' ? badge('적용함', 'ok') : c.status === 'cancelled' ? badge('취소함') : ''} ${c.edited ? badge('직접 수정했던 문장', 'improve') : ''}</div>
<div class="cmp"><div><span>변경 전</span><div class="before">${esc(c.before) || '(새 문장)'}</div></div><div><span>변경 후</span><div class="after">${esc(c.after) || '(삭제)'}</div></div></div>
<p class="hint">수정 이유: ${esc(c.reason)}${c.expIds?.length ? ` · 근거 경험: ${c.expIds.map(exp).filter(Boolean).map(expName).map(esc).join(', ')}` : ''}</p>${c.warn ? `<p class="msg err">${esc(c.warn)}</p>` : ''}
<div class="row">${c.status === 'pending' ? btn('applyOne', '적용', { id: d.id, c: c.id }) + btn('cancelOne', '취소', { id: d.id, c: c.id }, 'quiet') : c.status === 'applied' ? btn('undoOne', '적용 취소(되돌리기)', { id: d.id, c: c.id }, 'quiet') : btn('reviveOne', '다시 검토', { id: d.id, c: c.id }, 'quiet')}</div></div>`).join('')}`;
}
function checkView(d, { out, sub }) {
  return `<div class="card"><h2 style="margin-top:0">제출 전 점검</h2>
${out.length ? `<ul>${out.map(([lv, t]) => `<li>${badge(LEVELS[lv], lv)} ${esc(t)}</li>`).join('')}</ul>` : '<p class="msg ok">자동 점검에서 걸린 항목이 없습니다.</p>'}
<h3>공고의 제출 서류·작성 조건</h3>${sub.length ? sub.map(x => `<div>${chk(`doc:${d.id}:checks.${x.id}`, d.checks?.[x.id], esc(x.text))}</div>`).join('') : '<p class="muted">공고에서 찾은 조건이 없습니다. 공고 원문을 직접 한 번 더 확인하세요.</p>'}
<p class="hint">이 사이트는 지원서를 자동으로 제출하거나 외부로 보내지 않습니다.</p></div>`;
}

V.print = r => {
  const d = doc(r.id); if (!d) return notFound();
  const unv = d.sentences.filter(s => s.unverified).length;
  const body = d.groups.map(g => { const ss = d.sentences.filter(s => s.grp === g.key && !s.unverified && s.text.trim()); if (!ss.length) return ''; let lab = null, html = `<h2>${esc(gTitle(g) || '(제목 없음)')}</h2>`, list = [];
    const flushL = () => { if (list.length) { html += `<ul>${list.join('')}</ul>`; list = []; } };
    for (const s of ss) { if (s.label && s.label !== lab) { flushL(); lab = s.label; html += `<h3>${esc(lab)}</h3>`; } list.push(`<li>${esc(s.text)}</li>`); }
    flushL(); return html; }).join('');
  return `<div class="row no-print"><a class="btn" href="#/doc/${d.id}">← 편집으로</a>${CLAUDE ? btn('printFile', '인쇄용 파일 저장 (.html)', { id: d.id }, 'primary') : btn('print', '인쇄 / PDF로 저장', {}, 'primary')}<span class="meta">${unv ? `미확인 문장 ${unv}개는 제외했습니다.` : ''} ${CLAUDE ? '저장한 파일을 브라우저로 열고 인쇄(⌘P) → PDF로 저장을 고르세요.' : "인쇄 창에서 'PDF로 저장'을 고르세요."}</span></div>
<article class="print-doc"><h1>${esc(d.title)}</h1>${body || '<p>제출 가능한 문장이 없습니다.</p>'}</article>`;
};

V.backup = () => {
  const n = S.experiences.length, m = S.jobs.length, k = S.docs.length; const imp = UI.importData;
  return `<div class="narrow"><h1>백업 · 데이터</h1>${storageNote()}
<div class="card"><h2 style="margin-top:0">JSON 백업</h2><p>현재: 경험 ${n}개 · 지원 회사 ${m}곳 · 문서 ${k}개</p>
<div class="row">${btn('exportJson', '백업 파일 내려받기 (.json)', {}, 'primary')}<label class="btn">백업 파일에서 복원<input type="file" id="import-file" accept="application/json,.json" hidden></label></div>
${imp ? `<div class="note warn">복원할 파일: 경험 ${imp.experiences.length}개 · 지원 회사 ${imp.jobs.length}곳 · 문서 ${imp.docs.length}개${imp.exportedAt ? ` (백업 시각 ${fmt(imp.exportedAt)})` : ''}<br>복원하면 지금 브라우저의 데이터가 이 파일로 <b>대체</b>됩니다. 먼저 현재 데이터를 백업하세요.
<div class="row">${btn('doImport', '복원', {}, 'danger')}${btn('cancelImport', '취소', {}, 'quiet')}</div></div>` : ''}
${UI.importErr ? `<p class="msg err">${esc(UI.importErr)}</p>` : ''}</div>
<div class="card"><h2 style="margin-top:0">예시 데이터</h2><p class="hint">예시는 [예시] 표시가 붙은 가상 데이터입니다.</p><div class="row">${btn('loadSamples', '예시 불러오기')}${btn('clearSamples', '예시 모두 지우기', {}, 'quiet')}</div></div>
<div class="card"><h2 style="margin-top:0">AI 연결 상태</h2><p>${HOSTED ? (AI.ok ? '[AI로 실행]은 내 Claude 계정 사용량으로 실행됩니다. 요청할 때 필요한 데이터만 보냅니다.' : 'AI를 쓸 수 없는 화면입니다. 요청문 복사 → 응답 붙여넣기로 진행하세요.') : !AI.server ? '로컬 서버 없이 열려 있습니다. URL 가져오기와 AI는 쓸 수 없고, 수동 흐름(요청문 복사 → 응답 붙여넣기)은 됩니다.' : AI.ok ? `서버에 AI가 연결돼 있습니다 (${esc(AI.model)}). 요청할 때 필요한 데이터만 보냅니다.` : 'AI 미연결. 서버를 <code>ANTHROPIC_API_KEY=… python3 server.py</code> 로 실행하면 연결됩니다. 키는 서버 환경변수에만 두고 브라우저에는 저장하지 않습니다.'}</p></div>
<div class="card"><h2 style="margin-top:0">모든 데이터 지우기</h2><p class="hint">이 브라우저에 저장된 경험·공고·문서가 모두 삭제됩니다.</p>${confirmBtn('wipe', '전부 삭제', 'wipe', {})}</div></div>`;
};

// ───────── 동작 ─────────
const go = h => { location.hash = h; };
const A = {
  rerender() { },
  ask({ k }) { UI.confirm = k || null; },
  tab({ k, i }) { (UI.tabY[k] ??= [])[UI.tabs[k] || 0] = scrollY; UI.tabs[k] = +i; document.querySelectorAll(`[data-split="${k}"] > .pane`).forEach((p, n) => p.classList.toggle('on', n === +i)); document.querySelectorAll(`.tabs-m [data-a="tab"][data-k="${k}"]`).forEach((b, n) => b.classList.toggle('on', n === +i)); scrollTo(0, UI.tabY[k]?.[+i] || 0); return 'noRender'; },
  newExp({ m }) { const e = newExpObj(); S.experiences.unshift(e); save(); go(`#/exp/${e.id}${m === 'q' ? '/q' : ''}`); return 'noRender'; },
  delExp({ id }) { S.experiences = S.experiences.filter(e => e.id !== id); UI.confirm = null; save(); toast('경험을 삭제했습니다. 관련 문서에는 알림이 표시됩니다.'); go('#/exp'); return 'noRender'; },
  applyDraft({ id, k }) { const e = exp(id); pushHistory(e, 'AI 정리 반영 전'); setPath(e, HEAD.some(h => h[0] === k) ? k : 'f.' + k, e.aiDraft.fields[k]); if (e.aiDraft.warn?.[k]) { e.unknown[k] = true; toast("원문에 없는 표현이 있어 '확인 필요'로 표시했습니다."); } e.updatedAt = nowIso(); save(); },
  applyDraftEmpty({ id }) { const e = exp(id); pushHistory(e, 'AI 정리 반영 전'); let n = 0; for (const [k, v] of Object.entries(e.aiDraft.fields)) if (!val(e, k).trim()) { setPath(e, HEAD.some(h => h[0] === k) ? k : 'f.' + k, v); if (e.aiDraft.warn?.[k]) e.unknown[k] = true; n++; } e.updatedAt = nowIso(); save(); toast(`빈 항목 ${n}개에 반영했습니다.`); },
  qUnknown({ id, k }) { const e = exp(id); e.unknown[k] = true; e.updatedAt = nowIso(); save(); },
  qSkip({ id, k }) { const e = exp(id); (e.qSkip ??= {})[k] = true; save(); },
  qUnskip({ id }) { exp(id).qSkip = {}; save(); },
  runRules({ id }) {
    const e = exp(id); refreshRules(e); save();
    toast(`점검 완료: 열린 피드백 ${e.feedback.filter(x => x.status === 'open').length}개`);
  },
  propose({ id, i }) {
    const e = exp(id), x = e.feedback.find(y => y.id === i);
    if (!x.answer?.trim()) return toast('추가 질문에 먼저 답해주세요.');
    const before = val(e, x.field), ans = x.answer.trim(); const isHead = HEAD.some(h => h[0] === x.field);
    x.proposal = { before, after: isHead || !before.trim() || x.key.startsWith('unknown-') || x.key.startsWith('empty-') ? ans : before + '\n' + ans, reason: isHead ? '답변으로 항목을 채웁니다.' : '규칙 기반 초안: 답변을 해당 항목에 덧붙였습니다. 문장을 직접 다듬거나 AI 수정안을 받으세요.', source: '규칙' };
    save();
  },
  applyFb({ id, i }) {
    const e = exp(id), x = e.feedback.find(y => y.id === i); pushHistory(e, '피드백 적용 전');
    setPath(e, HEAD.some(h => h[0] === x.field) ? x.field : 'f.' + x.field, x.proposal.after);
    const bad = x.proposal.source === 'AI' ? unsupported(x.proposal.after, x.proposal.before + '\n' + x.answer) : [];
    if (bad.length) e.unknown[x.field] = true; // 답변·기존 내용에 없는 수치·표현이 들어가면 확인 필요로
    // '확인 필요' 표시는 그 사실을 확인해 달라는 질문(unknown-)에 답했을 때만 푼다. 다른 질문 답변으로 풀리면 미확인 수치가 확정 문장이 된다.
    else if (x.key.startsWith('unknown-') && e.unknown?.[x.field] && !/확인\s*필요/.test(x.proposal.after)) delete e.unknown[x.field];
    x.status = 'applied'; x.appliedAt = nowIso(); e.updatedAt = nowIso(); save(); toast('적용했습니다. 원본 경험이 바뀌어 관련 문서에 알림이 뜹니다.');
  },
  cancelProposal({ id, i }) { exp(id).feedback.find(y => y.id === i).proposal = null; save(); },
  dismissFb({ id, i }) { exp(id).feedback.find(y => y.id === i).status = 'dismissed'; save(); },
  reopenFb({ id, i }) { exp(id).feedback.find(y => y.id === i).status = 'open'; save(); },
  resetBase({ id }) { const e = exp(id); e.fbBase = snap(e); save(); },

  newJob() { const j = newJobObj(); S.jobs.unshift(j); save(); go(`#/job/${j.id}/info`); setTimeout(() => document.querySelector(`[data-b="job:${j.id}:url"]`)?.focus(), 50); return 'noRender'; },
  delJob({ id }) { S.jobs = S.jobs.filter(j => j.id !== id); S.docs = S.docs.filter(d => d.jobId !== id); UI.confirm = null; save(); go('#/jobs'); return 'noRender'; },
  async fetchPosting({ id }) {
    const j = job(id); if (UI.busy['fetch:' + id]) return; // 칸을 벗어날 때 자동 불러오기와 버튼이 겹치지 않게
    if (!j.url?.trim()) { UI.fetchMsg[id] = { type: 'err', text: 'URL을 먼저 입력하세요.' }; return; }
    UI.busy['fetch:' + id] = true; render(); const r = await api('/api/fetch', { url: j.url.trim() }); UI.busy['fetch:' + id] = false;
    if (!r.ok) { j.fetch = { ok: false, reason: r.reason, at: nowIso() }; UI.fetchMsg[id] = { type: 'err', text: `공고를 가져오지 못했습니다: ${r.reason}\n→ 공고 페이지에서 본문을 복사해 아래 '공고 본문'에 붙여넣어 주세요. 가져오지 못한 공고는 분석된 것으로 표시하지 않습니다.` }; }
    else { j.fetch = { ok: true, at: r.checkedAt, chars: r.chars, title: r.title, imageOnly: !!r.imageOnly };
      const filled = [['company', '회사명'], ['position', '직무명'], ['deadline', '마감일']].filter(([k]) => r.job?.[k] && !j[k]?.trim() && (j[k] = r.job[k])).map(([, l]) => l);
      const img = r.imageOnly ? `\n공고 본문이 이미지로만 되어 있어 글자로 가져오지 못했습니다. 페이지 요약만 넣었으니, 공고 이미지를 보고 주요 업무·자격요건을 본문에 붙여넣어 주세요.${r.images?.length ? '\n공고 이미지: ' + r.images.join(' , ') : ''}` : '';
      const head = filled.length ? `${filled.join('·')}을(를) 채웠습니다. ` : r.job?.company ? '' : '회사명·직무는 이 페이지에서 찾지 못했습니다 — 직접 적어주세요. ';
      if (!j.postingText.trim()) {
        Object.assign(j, { postingText: r.text, postingSource: `URL에서 가져옴 (${j.url})`, postingAt: r.checkedAt });
        const { cats, unclassified } = extractPosting(j.postingText); const n = ['duties', 'required', 'preferred'].reduce((a, c) => a + cats[c].length, 0);
        // 여러 직무가 한 페이지에 섞인 공고는 규칙으로 나누면 수백 줄이 요건이 된다 → 자동 분리는 적당할 때만
        const sane = n > 0 && n <= 60;
        if (sane) j.analysis = { at: nowIso(), source: '규칙 기반 추출', posting: j.postingText, postingSource: j.postingSource, url: j.url, cats, interpreted: [], unclassified };
        UI.fetchMsg[id] = { type: r.imageOnly || !sane ? 'info' : 'ok', text: `${head}공고 본문 ${r.chars}자를 가져왔습니다. ${sane ? `요구사항 ${n}개로 나눴습니다 — 요구사항 탭에서 확인하세요.` : n ? '여러 직무가 섞였거나 길어서 요구사항을 자동으로 나누지 않았습니다. 지원할 직무 부분만 남기고 요구사항 탭에서 나누세요.' : '요구사항 제목(주요업무·자격요건 등)을 찾지 못했습니다. 요구사항 탭에서 AI 분석을 쓰거나 직접 옮기세요.'} 메뉴·광고 같은 줄이 섞였을 수 있으니 확인하세요.${img}` };
      } else { j.fetchPreview = r.text; j.fetchAt = r.checkedAt; UI.fetchMsg[id] = { type: 'info', text: `${head}이미 본문이 있어 바로 바꾸지 않았습니다.${img}` }; } }
    save();
  },
  usePreview({ id }) { const j = job(id); Object.assign(j, { postingText: j.fetchPreview, postingSource: `URL에서 가져옴 (${j.url})`, postingAt: j.fetchAt || nowIso(), fetchPreview: null }); save(); },
  dropPreview({ id }) { job(id).fetchPreview = null; save(); },
  extract({ id }) {
    const j = job(id); if (!j.postingText?.trim()) return toast('공고 본문이 비어 있습니다.');
    const { cats, unclassified } = extractPosting(j.postingText);
    j.analysis = { at: nowIso(), source: '규칙 기반 추출', posting: j.postingText, postingSource: j.postingSource, url: j.url, cats, interpreted: j.analysis?.interpreted || [], unclassified };
    save(); const n = Object.values(cats).reduce((a, b) => a + b.length, 0);
    toast(n ? `요구사항 ${n}개를 추출했습니다.` : '섹션 제목을 찾지 못했습니다. 아래 분류하지 못한 줄을 옮기거나 AI 분석을 쓰세요.');
  },
  delReqItem({ id, c, x }) { const a = job(id).analysis; if (c === 'interpreted') a.interpreted = a.interpreted.filter(y => y.id !== x); else a.cats[c] = a.cats[c].filter(y => y.id !== x); save(); },
  addSource({ id }) { job(id).sources.push({ id: uid(), title: '', url: '', text: '', at: '', origin: '' }); save(); },
  delSource({ id, s }) { const j = job(id); j.sources = j.sources.filter(x => x.id !== s); j.facts.forEach(f => { if (f.srcId === s) f.srcId = ''; }); save(); },
  async fetchSource({ id, s }) {
    const src = job(id).sources.find(x => x.id === s); if (!src.url?.trim()) { UI.fetchMsg[s] = { type: 'err', text: 'URL을 먼저 입력하세요.' }; return; }
    UI.busy['fetch:' + s] = true; render(); const r = await api('/api/fetch', { url: src.url.trim() }); UI.busy['fetch:' + s] = false;
    if (!r.ok) UI.fetchMsg[s] = { type: 'err', text: `가져오지 못했습니다: ${r.reason}\n→ 페이지 내용을 복사해 아래 칸에 붙여넣어 주세요.` };
    else { Object.assign(src, { text: r.text, at: r.checkedAt, origin: 'URL에서 가져옴', title: src.title || r.title }); UI.fetchMsg[s] = { type: 'ok', text: `가져왔습니다(${r.chars}자). 공식 자료인지, 불필요한 줄이 없는지 확인하세요.` }; }
    save();
  },
  addFact({ id }) { job(id).facts.push({ id: uid(), cat: 'biz', kind: '해석', text: '', srcId: '', quote: '', quoteOk: true, implication: '', expIds: [], source: '직접' }); save(); },
  delFact({ id, f }) { const j = job(id); j.facts = j.facts.filter(x => x.id !== f); save(); },
  answerToExp({ id, r }) {
    const j = job(id), m = j.mapping[r], req = reqs(j).find(x => x.id === r);
    if (!m.answer?.trim()) return toast('답변을 먼저 적어주세요.');
    const e = newExpObj(); e.raw = `[${j.company} 공고 요건 "${req?.text}"에 대한 답변]\n${m.answer}`; S.experiences.unshift(e); save(); toast('경험 보관함에 새 경험으로 추가했습니다. 나중에 항목을 정리하세요.');
  },
  useStrategyAI({ id, k }) { const j = job(id); j.strategy[k] = j.strategyAI[k]; save(); },
  newMaster({ t }) { const d = makeMaster(t); save(); go(`#/doc/${d.id}`); return 'noRender'; },
  tailor({ m, j }) { const d = tailorFrom(m, j); save(); toast('기본 문서를 복사했습니다. 기본 문서는 바뀌지 않습니다.'); go(`#/doc/${d.id}`); return 'noRender'; },
  ackBase({ id }) { const d = doc(id); d.baseAt = doc(d.basedOn)?.updatedAt || nowIso(); save(); },
  reqRevise({ id, r }) { const d = doc(id), j = job(d.jobId), q = reqs(j).find(x => x.id === r); const ex = (j.mapping[r]?.expIds || []).map(exp).filter(Boolean).map(expName); d.revInstr = `이 공고의 "${q?.text}" 요건에 맞춰서. 근거는 연결한 경험(${ex.join(', ')})에 적힌 내용만 쓰고, 해보지 않은 일은 추가하지 말 것`; d.revReq = r; save(); toast('수정 요청을 채웠습니다. 아래 [수정안 받기]를 누르세요.'); },
  toggle({ k }) { UI.show[k] = !UI.show[k]; },
  selSent({ id, s }) { UI.sel[id] = s || null; UI.jump = s || null; },
  draftPick({ id }) { const d = doc(id), j = job(d.jobId), E = realExps(j).filter(e => !d.groups.some(g => g.expId === e.id)); UI.dpick = { docId: id, sel: (j ? E.filter(e => linkScore(j, e.id) > 0) : E).map(e => e.id) }; },
  draftCancel() { UI.dpick = null; },
  draftGen({ id }) { const d = doc(id); if (!docEmpty(d)) saveVersion(d, `경험 추가 전 자동 보관 (${fmt(nowIso())})`); const n = addExpGroups(d, UI.dpick.sel); UI.dpick = null; UI.sel[id] = null; d.updatedAt = nowIso(); save(); toast(`경험 ${n}개로 초안을 만들었습니다. 오른쪽에서 보완할 문장을 확인하세요.`); },
  sentPropose({ id, s, k }) {
    const d = doc(id), x = d.sentences.find(y => y.id === s), ans = x.qa?.[k]?.trim();
    if (!ans) return toast('추가 질문에 먼저 답해주세요.');
    if (k === 'verify') {
      if (/확인\s*(불가|안\s*됨)|모름|모르/.test(ans)) { (x.skip ??= {})[k] = 'kept'; save(); return toast('미확인으로 둡니다. 제출본(복사·인쇄)에서 자동으로 빠집니다.'); }
      x.prop = { keys: [k], before: x.text, after: x.text.replace(/\s*\(?확인\s*필요\)?/g, '').trim(), reason: `확인했다고 답했습니다(“${ans}”). 적용하면 '확인 필요' 표시를 풉니다. 문장이 확인한 사실과 다르면 고쳐서 적용하세요.`, source: '규칙' };
    } else x.prop = { keys: [k], before: x.text, after: x.text.replace(/[.\s]+$/, '') + ' — ' + ans, reason: '규칙 초안: 답변을 문장 뒤에 붙였습니다. 자연스럽게 다듬어 적용하세요. 문장을 새로 쓰려면 아래 AI 수정을 쓰세요.', source: '규칙' };
    save();
  },
  sentApply({ id, s }) {
    const d = doc(id), x = d.sentences.find(y => y.id === s), p = x.prop;
    x.undo = { text: x.text, unverified: x.unverified, skip: clone(x.skip || {}), prop: p };
    x.text = p.after.trim(); x.edited = true; x.skip ??= {}; p.keys.forEach(k => { x.skip[k] = 'applied'; });
    if (p.source === 'AI' && p.bad) { x.unverified = true; x.aiWarn = p.bad; }
    else if (p.keys.includes('verify')) { x.unverified = /확인\s*필요/.test(x.text); x.aiWarn = ''; }
    x.prop = null; d.updatedAt = nowIso(); save(); toast(x.unverified ? "적용했습니다. 확인되지 않은 표현이 있어 '확인 필요'로 표시했습니다." : '적용했습니다.');
  },
  sentUndo({ id, s }) { const d = doc(id), x = d.sentences.find(y => y.id === s), u = x.undo; Object.assign(x, { text: u.text, unverified: u.unverified, skip: u.skip, prop: u.prop, undo: null }); d.updatedAt = nowIso(); save(); },
  sentCancel({ id, s }) { doc(id).sentences.find(y => y.id === s).prop = null; save(); },
  sentSkip({ id, s, k }) { const x = doc(id).sentences.find(y => y.id === s); (x.skip ??= {})[k] = 'dismissed'; save(); },
  sentUnskip({ id, s }) { doc(id).sentences.find(y => y.id === s).skip = {}; save(); },
  addGrp({ id }) { const d = doc(id); const c = careerGroup(d.type); const at = d.groups.findIndex(g => g.key === 'edu'); d.groups.splice(at < 0 ? d.groups.length : at, 0, c.g); d.sentences.push(...c.ss); d.updatedAt = nowIso(); save(); },
  addSec({ id }) { const d = doc(id); const key = 'g-' + uid(); d.groups.push({ key, title: '새 섹션' }); d.sentences.push(newSent(key, '')); d.updatedAt = nowIso(); save(); },
  grpMove({ id, g, dir }) { const d = doc(id); const i = d.groups.findIndex(x => x.key === g), k = i + +dir; if (k < 0 || k >= d.groups.length) return; [d.groups[i], d.groups[k]] = [d.groups[k], d.groups[i]]; d.updatedAt = nowIso(); save(); },
  delGrp({ id, g }) { const d = doc(id); d.groups = d.groups.filter(x => x.key !== g); d.sentences = d.sentences.filter(s => s.grp !== g); UI.confirm = null; d.updatedAt = nowIso(); save(); },
  sentMove({ id, s, dir }) { const d = doc(id); const cur = d.sentences.find(x => x.id === s); const same = d.sentences.filter(x => x.grp === cur.grp); const k = same.indexOf(cur) + +dir; if (k < 0 || k >= same.length) return; const a = d.sentences.indexOf(cur), b = d.sentences.indexOf(same[k]); [d.sentences[a], d.sentences[b]] = [d.sentences[b], d.sentences[a]]; d.updatedAt = nowIso(); save(); },
  importPaste() { const t = $('#imp-text')?.value || ''; UI.impType = $('#imp-type')?.value; if (t.trim().length < 20) { UI.impMsg = { type: 'err', text: '붙여넣은 내용이 너무 짧습니다.' }; return; } UI.impMsg = null; UI.impPreview = { type: UI.impType, name: '붙여넣은 글', text: t, parsed: parseResume(t) }; },
  impConfirm() { const p = UI.impPreview; const d = makeMaster(p.type, p.parsed, { name: p.name, at: nowIso(), text: p.text }); UI.impPreview = null; UI.impMsg = null; save(); go(`#/doc/${d.id}`); return 'noRender'; },
  impCancel() { UI.impPreview = null; UI.impMsg = null; },
  pickDoc({ id, t }) { const j = job(id); UI.pick = { jobId: id, type: t, sel: realExps(j).filter(e => linkScore(j, e.id) > 0).map(e => e.id) }; },
  cancelPick() { UI.pick = null; },
  genDoc() { const p = UI.pick; const d = makeDoc(p.jobId, p.type, S.experiences.filter(e => p.sel.includes(e.id)).map(e => e.id)); UI.pick = null; save(); go(`#/doc/${d.id}`); return 'noRender'; },

  saveVer({ id }) { const d = doc(id); saveVersion(d, `버전 ${d.versions.length + 1}`); save(); toast('버전을 저장했습니다.'); },
  restoreVer({ id, v }) { const d = doc(id), ver = d.versions.find(x => x.id === v); saveVersion(d, `복원 전 자동 보관 (${fmt(nowIso())})`); d.groups = clone(ver.groups); d.sentences = clone(ver.sentences); d.revision = null; d.updatedAt = nowIso(); save(); toast(`"${ver.label}"(으)로 복원했습니다. 복원 전 상태도 버전에 보관했습니다.`); },
  dupVer({ id, v }) { const d = doc(id), ver = d.versions.find(x => x.id === v); const n = { ...clone(d), id: uid(), title: d.title + ' (복제)', groups: clone(ver.groups), sentences: clone(ver.sentences), versions: [], revision: null, createdAt: nowIso(), updatedAt: nowIso() }; S.docs.push(n); save(); go(`#/doc/${n.id}`); return 'noRender'; },
  delDoc({ id }) { const d = doc(id); S.docs = S.docs.filter(x => x.id !== id); UI.confirm = null; save(); go(isMaster(d) ? '#/docs' : `#/job/${d.jobId}/docs`); return 'noRender'; },
  async copyDoc({ id }) { const d = doc(id); toast(await copyText(docText(d, false)) ? '복사했습니다 (미확인 문장 제외).' : '복사하지 못했습니다.'); return 'noRender'; },
  mdDoc({ id }) { const d = doc(id); download(`${d.title.replace(/[\\/:*?"<>|]/g, '_')}.md`, docText(d, true), 'text/markdown'); return 'noRender'; },
  toggleCheck({ id }) { UI.show['check:' + id] = !UI.show['check:' + id]; },
  preset({ id, p }) { const d = doc(id); d.revInstr = p; d.revReq = null; save(); },
  closeRev({ id }) { doc(id).revision = null; save(); },
  applyOne({ id, c }) { const d = doc(id); const ch = d.revision.changes.find(x => x.id === c); if (!d.revision.snap) { saveVersion(d, `수정 적용 전 자동 보관 — ${d.revision.instr}`); d.revision.snap = true; } applyChange(d, ch); d.updatedAt = nowIso(); save(); },
  applyAll({ id }) { const d = doc(id); if (!d.revision.snap) { saveVersion(d, `수정 적용 전 자동 보관 — ${d.revision.instr}`); d.revision.snap = true; } d.revision.changes.filter(c => c.status === 'pending').forEach(c => applyChange(d, c)); d.updatedAt = nowIso(); save(); toast('전체 적용했습니다. 문장별로 되돌릴 수 있습니다.'); },
  undoOne({ id, c }) { const d = doc(id); undoChange(d, d.revision.changes.find(x => x.id === c)); d.updatedAt = nowIso(); save(); },
  cancelOne({ id, c }) { doc(id).revision.changes.find(x => x.id === c).status = 'cancelled'; save(); },
  reviveOne({ id, c }) { doc(id).revision.changes.find(x => x.id === c).status = 'pending'; save(); },
  ackStale({ id, e }) { const d = doc(id); const ex = exp(e); if (ex) d.src[e] = snap(ex); else delete d.src[e]; save(); },
  regen({ id, e: eid }) {
    const d = doc(id), e = exp(eid), old = d.src[eid], g = d.groups.find(x => x.expId === eid); const changes = [];
    if (g && groupTitle(e) !== g.title && val(old, 'org') + val(old, 'position') + val(old, 'period') !== e.org + e.position + e.period) changes.push({ id: uid(), kind: 'title', grp: g.key, before: g.title, after: groupTitle(e), unverified: headUnverified(e), reason: '원본의 회사명·직책·기간이 바뀌었습니다.', status: 'pending' });
    for (const [k, l] of DOC_FIELDS[d.type]) {
      if ((old.f?.[k] || '') === (e.f?.[k] || '') && !!old.unknown?.[k] === !!e.unknown?.[k]) continue;
      const ss = d.sentences.filter(s => s.expIds.includes(eid) && s.field === k);
      changes.push({ id: uid(), ids: ss.map(s => s.id), grp: g?.key || d.groups[0].key, label: l, field: k, expIds: [eid], before: ss.map(s => s.text).join('\n'), after: e.f?.[k] || '', unverified: !!e.unknown?.[k], edited: ss.some(s => s.edited), reason: `원본 경험의 「${LABEL[k]}」이(가) 바뀌었습니다.` + (ss.some(s => s.edited) ? ' 직접 수정한 문장이 있어 적용하면 수정본이 대체됩니다(되돌리기 가능).' : ''), status: 'pending' });
    }
    d.src[eid] = snap(e);
    if (!changes.length) { save(); return toast('이 문서에 쓰인 항목은 바뀌지 않았습니다. 검토 완료로 처리했습니다.'); }
    d.revision = { instr: '원본 경험 변경 반영', at: nowIso(), source: '원본 갱신', changes }; save();
  },
  addSent({ id, g }) { const d = doc(id); const grp = d.groups.find(x => x.key === g); const last = d.sentences.map(s => s.grp).lastIndexOf(g); d.sentences.splice(last < 0 ? d.sentences.length : last + 1, 0, { id: uid(), grp: g, label: last < 0 ? '' : d.sentences[last].label, field: '', text: '', expIds: grp.expId ? [grp.expId] : [], unverified: false, edited: true }); d.updatedAt = nowIso(); save(); },
  delSent({ id, s }) { const d = doc(id); d.sentences = d.sentences.filter(x => x.id !== s); d.updatedAt = nowIso(); save(); },
  print() { window.print(); return 'noRender'; },
  printFile({ id }) {
    const d = doc(id); const body = document.querySelector('.print-doc')?.outerHTML || '';
    const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(d.title)}</title><style>body{margin:0;font:15px/1.7 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;color:#1d1d1f;background:#fff;word-break:keep-all}.print-doc{max-width:760px;margin:0 auto;padding:48px 24px}h1{font-size:26px;margin:0 0 20px}h2{font-size:18px;border-bottom:1px solid #1d1d1f;padding-bottom:4px;margin:24px 0 8px}h3{font-size:15px;margin:12px 0 4px}ul{margin:4px 0 8px;padding-left:20px}@page{size:A4;margin:16mm}@media print{.print-doc{padding:0;max-width:none}h2,h3{break-after:avoid}li{break-inside:avoid}}</style></head><body>${body}</body></html>`;
    download(`${d.title.replace(/[\\/:*?"<>|]/g, '_')}.html`, html, 'text/html'); return 'noRender';
  },

  async aiRun({ t, c }) {
    const key = t + ':' + c; let prompt;
    try { prompt = TASKS[t].build(c); } catch (e) { UI.aiMsg[key] = { type: 'err', text: e.message }; return; }
    UI.busy[key] = true; UI.aiMsg[key] = { type: 'info', text: 'AI에 요청 중입니다…' }; render();
    let r;
    if (AI.sample) {
      try { const out = await AI.sample(SYS + '\n\n---\n\n' + prompt, { modelTier: 'default' }); r = { ok: true, text: out.text }; if (out.truncated) r = { ok: false, reason: '답이 길이 제한에 걸려 잘렸습니다. 범위를 줄여 다시 요청하세요.' }; }
      catch (e) {
        const why = { not_granted: 'AI 사용을 허용하지 않았습니다. 이번 화면에서는 수동 흐름을 쓰세요.', sampling_disabled: '이 계정에서는 AI를 쓸 수 없습니다.', rate_limited: '요청이 많거나 사용량 한도에 닿았습니다. 잠시 뒤 다시 누르세요.', prompt_too_large: '보낼 내용이 너무 깁니다. 범위를 줄여주세요.', session_expired: 'claude.ai에 다시 로그인해 주세요.', refused: 'Claude가 이 요청에 답하지 않았습니다. 내용을 바꿔 다시 요청하세요.' }[e?.code] || '일시적인 오류입니다. 다시 눌러보세요.';
        if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(e?.code)) { AI.ok = false; AI.sample = null; checkAILabel(); }
        r = { ok: false, reason: why };
      }
    } else r = await api('/api/ai', { system: SYS, prompt });
    UI.busy[key] = false;
    if (!r.ok) { UI.aiMsg[key] = { type: 'err', text: `AI 요청 실패: ${r.reason}\n→ [Claude에 보낼 요청문 복사]로 수동 진행할 수 있습니다. 기존 데이터는 바뀌지 않았습니다.` }; return; }
    aiApply(t, c, r.text);
  },
  async aiCopy({ t, c }) {
    const key = t + ':' + c;
    try { const p = SYS + '\n\n---\n\n' + TASKS[t].build(c); UI.prompts[key] = p; UI.pasteOpen[key] = true; UI.aiMsg[key] = { type: 'info', text: (await copyText(p)) ? '요청문을 복사했습니다. Claude에 붙여넣고, 받은 답을 아래 칸에 붙여넣으세요.' : '자동 복사에 실패했습니다. 아래 "복사한 요청문 보기"에서 직접 복사하세요.' }; }
    catch (e) { UI.aiMsg[key] = { type: 'err', text: e.message }; }
  },
  aiDownload({ t, c }) { try { download(`분석요청_${t}.txt`, SYS + '\n\n---\n\n' + TASKS[t].build(c)); } catch (e) { UI.aiMsg[t + ':' + c] = { type: 'err', text: e.message }; } },
  aiPaste({ t, c }) {
    const key = t + ':' + c; const text = document.getElementById('paste-' + key)?.value || '';
    if (!text.trim()) { UI.aiMsg[key] = { type: 'err', text: '붙여넣은 응답이 없습니다.' }; return; }
    aiApply(t, c, text);
  },

  async copyFallback() { toast(await copyText(UI.saveFallback.text) ? '복사했습니다.' : '자동 복사가 안 됩니다. 칸 안을 전체 선택해 복사하세요.'); return 'noRender'; },
  closeFallback() { UI.saveFallback = null; },
  exportJson() { download(`취업준비노트_백업_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ ...S, exportedAt: nowIso() }, null, 2), 'application/json'); toast('백업 파일을 내려받았습니다.'); return 'noRender'; },
  doImport() { const { exportedAt, ...data } = UI.importData; S = data; UI.importData = null; flush(); toast('백업에서 복원했습니다.'); },
  cancelImport() { UI.importData = null; UI.importErr = null; },
  loadSamples() { loadSamples(); },
  clearSamples() { clearSamples(); },
  wipe() { S = blank(); UI.confirm = null; flush(); toast('모든 데이터를 지웠습니다.'); go('#/'); }
};

// 체크박스·셀렉트 등 특수 입력
const A2 = {
  toggleMapExp(el) { const m = job(el.dataset.id).mapping[el.dataset.r]; const e = el.dataset.e; m.expIds = el.checked ? uniq([...m.expIds, e]) : m.expIds.filter(x => x !== e); m.touched = true; save(); },
  dpickExp(el) { const p = UI.dpick; p.sel = el.checked ? uniq([...p.sel, el.dataset.e]) : p.sel.filter(x => x !== el.dataset.e); render(); },
  pickExp(el) { const p = UI.pick; p.sel = el.checked ? uniq([...p.sel, el.dataset.e]) : p.sel.filter(x => x !== el.dataset.e); render(); },
  moveUnc(el) { const a = job(el.dataset.id).analysis; const x = a.unclassified.find(y => y.id === el.dataset.x); if (!x || !el.value) return; a.unclassified = a.unclassified.filter(y => y !== x); if (!a.cats[el.value].some(y => y.id === x.id)) a.cats[el.value].push({ ...x, quoteOk: true }); save(); render(); }
};

// ───────── 이벤트 ─────────
function target(kind, id) {
  const [a, b] = id.split('|');
  switch (kind) {
    case 'exp': return exp(a); case 'job': return job(a); case 'doc': return doc(a);
    case 'item': return exp(a)?.feedback.find(x => x.id === b);
    case 'map': return job(a)?.mapping[b];
    case 'src': return job(a)?.sources.find(x => x.id === b);
    case 'fact': return job(a)?.facts.find(x => x.id === b);
    case 'sent': return doc(a)?.sentences.find(x => x.id === b);
    case 'grp': return doc(a)?.groups.find(x => x.key === b);
  }
}
function touch(kind, id, path, o) {
  const a = id.split('|')[0]; const t = nowIso();
  if (kind === 'exp') o.updatedAt = t;
  if (kind === 'job') { o.updatedAt = t; if (path === 'postingText') { o.postingAt = t; o.postingSource = o.postingSource?.startsWith('URL') ? (o.postingSource.includes('직접 수정') ? o.postingSource : o.postingSource + ' · 이후 직접 수정') : '직접 붙여넣기'; } }
  if (kind === 'map') { o.touched = true; job(a).updatedAt = t; }
  if (kind === 'src' && path === 'text') { o.at = t; o.origin = o.origin?.startsWith('URL') ? 'URL에서 가져온 뒤 직접 수정' : '직접 붙여넣기'; }
  if (kind === 'sent') { if (path === 'text') o.edited = true; if (path === 'expSel') o.expIds = o.expSel ? [o.expSel] : []; doc(a).updatedAt = t; }
  if (kind === 'grp' && CAREER_F.includes(path)) o.title = careerTitle(o);
  if (kind === 'doc' || kind === 'grp') doc(a).updatedAt = t;
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'exp-q') return filterExp();
  bind(el);
});
function bind(el) {
  const b = el.closest?.('[data-b]'); if (!b) return;
  const [kind, id, path] = b.dataset.b.split(':'); const o = target(kind, id); if (!o) return;
  setPath(o, path, b.type === 'checkbox' ? b.checked : b.value);
  touch(kind, id, path, o); save();
  if (kind === 'sent' && path === 'text') { clearTimeout(bind.t); bind.t = setTimeout(refreshPanel, 500); }
}
function refreshPanel() { const p = $('#fbpanel'), d = doc(route().id); if (p && d && !p.contains(document.activeElement)) p.innerHTML = fbPanel(d); }
// 문장 칸을 누르면(포커스) 다시 그리지 않고 오른쪽 패널만 바꾼다 — 입력 중인 칸·커서를 지키려고
document.addEventListener('focusin', e => {
  const row = e.target.closest?.('.sent[data-sid]'); if (!row || UI.sel[row.dataset.doc] === row.dataset.sid) return;
  UI.sel[row.dataset.doc] = row.dataset.sid;
  document.querySelectorAll('.sent.sel').forEach(x => x.classList.remove('sel')); row.classList.add('sel'); refreshPanel();
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'exp-kind' || el.id === 'exp-state') return filterExp();
  if (el.id === 'import-file') return readImport(el.files[0]);
  if (el.id === 'resume-file') return readResumeFile(el.files[0]);
  if (el.id === 'imp-type') { UI.impType = el.value; if (UI.impPreview) { UI.impPreview.type = el.value; render(); } return; }
  if (el.dataset.a2) return A2[el.dataset.a2](el);
  const u = el.dataset.b?.match(/^job:([^:]+):url$/); if (u && /^https?:\/\/\S+\.\S+/.test(el.value.trim()) && !job(u[1])?.postingText.trim()) return A.fetchPosting({ id: u[1] }).then(() => render());
  if (el.dataset.b !== undefined && (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date')) bind(el);
  if (el.dataset.rr !== undefined) render();
});
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
  e.preventDefault(); const fn = A[el.dataset.a]; if (!fn) return;
  try { if (await fn({ ...el.dataset }) !== 'noRender') render(); }
  catch (err) { console.error(err); toast('오류가 났습니다: ' + err.message); }
});
function filterExp() {
  const q = ($('#exp-q')?.value || '').toLowerCase().trim(), k = $('#exp-kind')?.value, st = $('#exp-state')?.value; let n = 0;
  document.querySelectorAll('#exp-cards > .card').forEach(c => {
    const ok = (!q || c.dataset.text.includes(q)) && (!k || c.dataset.kind === k) && (!st || (st === 'must' && c.dataset.must === '1') || (st === 'unchecked' && c.dataset.unchecked === '1') || (st === 'sample' && c.dataset.sample === '1') || (st === 'real' && c.dataset.sample === '0'));
    c.hidden = !ok; n += ok;
  });
  const none = $('#exp-none'); if (none) none.hidden = n > 0;
}
const loadScript = src => new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const t = document.createElement('script'); t.src = src; t.onload = ok; t.onerror = () => no(new Error('라이브러리를 불러오지 못했습니다')); document.head.append(t); });
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
async function extractInBrowser(file, ext) {
  try {
    const buf = await file.arrayBuffer(); let text = '';
    if (ext === 'pdf') {
      await loadScript(CDN + 'pdf.js/3.11.174/pdf.min.js'); await loadScript(CDN + 'pdf.js/3.11.174/pdf.worker.min.js');
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
      for (let i = 1; i <= pdf.numPages; i++) { const c = await (await pdf.getPage(i)).getTextContent(); text += c.items.map(x => x.str + (x.hasEOL ? '\n' : '')).join('') + '\n'; }
      if (broken(text)) return await ocrPdf(buf); // 스캔본·글꼴이 깨진 PDF → 페이지를 그림으로 읽는다
    } else if (ext === 'docx') {
      await loadScript(CDN + 'mammoth/1.6.0/mammoth.browser.min.js');
      text = (await window.mammoth.extractRawText({ arrayBuffer: buf })).value;
    } else if (ext === 'hwpx') {
      await loadScript(CDN + 'jszip/3.10.1/jszip.min.js');
      const zip = await window.JSZip.loadAsync(buf);
      for (const n of Object.keys(zip.files).filter(n => /^Contents\/section\d+\.xml$/.test(n)).sort()) {
        const xml = await zip.file(n).async('string');
        for (const para of xml.match(/<hp:p\b[\s\S]*?<\/hp:p>/g) || []) text += (para.match(/<hp:t[^>]*>([\s\S]*?)<\/hp:t>/g) || []).map(t => t.replace(/<[^>]+>/g, '')).join('') + '\n';
      }
      text = new DOMParser().parseFromString(`<p>${text.replace(/</g, '&lt;')}</p>`, 'text/html').body.textContent; // &amp; 같은 표기 풀기
    } else if (ext === 'hwp') return { ok: false, reason: '한글(.hwp) 파일은 읽지 못합니다. 한글에서 [다른 이름으로 저장]으로 PDF·DOCX·HWPX 중 하나로 바꿔 올려주세요.' };
    else return { ok: false, reason: `배포된 사이트에서는 .${ext} 파일을 읽지 못합니다. PDF·DOCX·HWPX·TXT로 저장해 올려주세요.` };
    text = lines(text).join('\n');
    if (text.length < 20) return { ok: false, reason: '파일에서 글자를 거의 찾지 못했습니다. 그림으로도 읽지 못했습니다. 내용을 직접 붙여넣어 주세요.' };
    return { ok: true, text: text.slice(0, 60000) };
  } catch (e) { return { ok: false, reason: `파일 내용을 읽지 못했습니다(${e?.message || e}). 암호가 걸렸거나 손상된 파일일 수 있습니다.` }; }
}
// 읽은 글자 중 한글·영문·숫자·흔한 기호가 80% 미만이면 글꼴 정보가 깨진 PDF로 본다
const broken = t => { const s = t.replace(/\s/g, ''); return s.length < 20 || (s.match(/[가-힣A-Za-z0-9@.,·()\-~|/:%+&'"]/g) || []).length / s.length < 0.8; };
const OCR_PROMPT = `첨부한 이미지는 한 사람의 이력서 페이지입니다. 보이는 글자를 그대로 옮겨 적으세요. 없는 내용을 더하거나 고치거나 요약하지 마세요.
형식: 섹션 제목(프로필·경력·학력·핵심 역량·스킬 등)은 한 줄에 제목만. 경력 한 건은 "회사명 | 직책 | 시작년.월 - 끝년.월" 한 줄(재직 중이면 끝을 "재직중"), 그 아래 업무는 "- "로 시작하는 줄. 학력·스킬·그 밖의 항목은 "- "로 시작하는 줄. 사진·아이콘·막대 그림은 적지 말고, 옮긴 글만 답하세요.`;
// pdf.js는 Type3 글꼴 PDF를 그리다 멈춰서, 그림으로 바꾸는 건 MuPDF(wasm)로 한다
async function ocrPdf(buf) {
  UI.impMsg = { type: 'info', text: '글자 정보가 없는 PDF(스캔본·글꼴이 그림으로 저장된 파일)라 페이지를 그림으로 읽고 있습니다. 30초~1분쯤 걸립니다…' }; render();
  const m = await import('https://cdn.jsdelivr.net/npm/mupdf@1.26.4/dist/mupdf.js'), doc = m.Document.openDocument(new Uint8Array(buf), 'application/pdf'), imgs = [];
  for (let i = 0; i < Math.min(doc.countPages(), 5); i++) imgs.push(new Blob([doc.loadPage(i).toPixmap(m.Matrix.scale(2, 2), m.ColorSpace.DeviceRGB, false, true).asPNG()], { type: 'image/png' }));
  let text = '';
  if (AI.sample && (await AI.sample.limits?.().catch(() => null))?.images) text = (await AI.sample(OCR_PROMPT, { images: imgs, modelTier: 'default' })).text;
  else {
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
    const w = await window.Tesseract.createWorker('kor+eng');
    try { for (const b of imgs) text += (await w.recognize(b)).data.text + '\n'; } finally { await w.terminate(); }
  }
  return broken(text) ? { ok: false, reason: '그림으로도 글자를 읽지 못했습니다. 내용을 직접 붙여넣어 주세요.' } : { ok: true, text: lines(text).join('\n').slice(0, 60000), ocr: !AI.sample };
}
async function readResumeFile(file) {
  if (!file) return; UI.impType = $('#imp-type')?.value || 'resume';
  if (file.size > 10e6) { UI.impMsg = { type: 'err', text: '10MB보다 큰 파일은 올릴 수 없습니다.' }; return render(); }
  const ext = file.name.split('.').pop().toLowerCase(); let r;
  UI.busy.extract = true; UI.impMsg = { type: 'info', text: `"${file.name}"을 읽는 중입니다…` }; render();
  if (ext === 'txt' || ext === 'md') r = { ok: true, text: await file.text() };
  else if (HOSTED || ext === 'pdf') r = await extractInBrowser(file, ext);
  else {
    const b64 = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(',')[1] || ''); fr.readAsDataURL(file); });
    r = await api('/api/extract', { name: file.name, data: b64 });
  }
  UI.busy.extract = false;
  if (!r.ok) { UI.impMsg = { type: 'err', text: `파일을 읽지 못했습니다: ${r.reason}\n→ 파일 내용을 복사해 '파일 대신 내용을 붙여넣기'로 넣어도 됩니다.` }; UI.impPreview = null; }
  else { const parsed = parseResume(r.text); UI.impMsg = { type: r.ocr ? 'info' : 'ok', text: `"${file.name}"에서 글자 ${r.text.length}자를 읽었습니다. ${r.ocr ? '그림에서 읽은 글자라 틀린 글자·섞인 줄이 있을 수 있습니다 — 만든 뒤 원본과 대조해 고쳐주세요.' : '아래 미리보기를 확인하세요.'}` }; UI.impPreview = { type: UI.impType, name: file.name, text: r.text, parsed }; }
  render();
}
function readImport(file) {
  if (!file) return; const fr = new FileReader();
  fr.onload = () => { try { const d = JSON.parse(fr.result); if (!valid(d)) throw new Error('이 앱의 백업 파일 형식이 아닙니다.'); UI.importData = d; UI.importErr = null; } catch (e) { UI.importData = null; UI.importErr = '복원할 수 없는 파일입니다: ' + e.message; } render(); };
  fr.readAsText(file);
}

// ───────── 라우터 ─────────
function route() { const [name, id, sub] = location.hash.replace(/^#\/?/, '').split('/'); return { name: name || 'home', id, sub }; }
function render(top = false) {
  const r = route(); const y = scrollY;
  try { $('#main').innerHTML = (V[r.name] || V.home)(r) + (UI.saveFallback ? `<div class="card" id="save-fallback"><h2 style="margin-top:0">파일로 저장하지 못했습니다 — ${esc(UI.saveFallback.name)}</h2><p class="hint">이 화면에서는 파일 저장이 막혀 있습니다. 아래 내용을 모두 선택해 복사한 뒤 메모장 등에 붙여 저장하세요.</p><textarea rows="10" readonly>${esc(UI.saveFallback.text)}</textarea><div class="row">${btn('copyFallback', '전체 복사')}${btn('closeFallback', '닫기', {}, 'quiet')}</div></div>` : ''); }
  catch (err) { console.error(err); $('#main').innerHTML = `<div class="note danger">화면을 그리다 오류가 났습니다: ${esc(err.message)}<br>데이터는 저장돼 있습니다. <a href="#/backup">백업 화면</a>에서 백업을 받아두세요.</div>`; }
  const navKey = { job: 'jobs', doc: 'docs', print: 'docs' }[r.name] || r.name;
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === navKey));
  scrollTo(0, top ? 0 : y);
  if (r.name === 'exp' && !r.id) filterExp();
  if (UI.jump) { document.querySelector(`.sent[data-sid="${UI.jump}"]`)?.scrollIntoView({ block: 'center' }); UI.jump = null; }
}
function takeJump() { const r = route(); if (r.name === 'doc' && r.sub) { UI.sel[r.id] = r.sub; UI.jump = r.sub; history.replaceState(null, '', '#/doc/' + r.id); } }
addEventListener('hashchange', () => { UI.confirm = null; takeJump(); render(true); });
takeJump();
render();
checkAI().then(() => render());
