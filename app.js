import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY, PAYMENT_LINK } from './config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const configured = !SUPABASE_URL.includes('YOUR-PROJECT');

// SECURITY/RELIABILITY (#9): centralized helper so every important mutation
// checks the client exists and actually inspects { data, error } instead of
// assuming success. Wrap any Supabase call with this and it throws a clear,
// user-facing error instead of quietly doing nothing or crashing later with
// a confusing "cannot read property of undefined".
function assertSupabase(result, fallbackMessage){
  if (!supabase) throw new Error('Not connected to the database — refresh the page and try again.');
  if (result && result.error) throw new Error(result.error.message || fallbackMessage || 'That action failed.');
  return result?.data;
}

/* ============ ICONS ============ */
const ICONS = {
  home:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/></svg>',
  study:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 5 8 4.3 4.5 4.5v13c3.5-.2 6 .5 7.5 2 1.5-1.5 4-2.2 7.5-2v-13C16 4.3 13.5 5 12 6.5Z"/><path d="M12 6.5v13"/></svg>',
  notes:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h7M9 16h7M9 8.5h3"/></svg>',
  doubts:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17h.01"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1-1.5 2.2"/><circle cx="12" cy="12" r="9.5"/></svg>',
  live:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v11H8l-4 4z"/></svg>',
  lock:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>',
  bookmark:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  dashboard:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  profile:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>',
  admin:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/></svg>',
  bell:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  sun:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.5 12h2M19.5 12h2M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5"/></svg>',
  moon:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/></svg>',
  star:'<svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.4 1.5-6.8-5.2-4.7 6.9-.7z"/></svg>',
  starBig:'<svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l2.9 6.3 6.9.7-5.2 4.7 1.5 6.8L12 17.6l-6.1 3.4 1.5-6.8-5.2-4.7 6.9-.7z"/></svg>',
  back:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  send:'<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M3 11.5 21 3l-6 18-4-7.5-8-2z"/></svg>',
  stop:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  search:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  chev:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  heart:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-9.5-8.8C1 8 2.5 4.5 6 4c2-.3 4 1 6 3.5C14 5 16 3.7 18 4c3.5.5 5 4 3.5 7.2C19 15.6 12 20 12 20Z"/></svg>',
  reply:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10 4 15l5 5"/><path d="M4 15h10a6 6 0 0 0 6-6V6"/></svg>',
  flag:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v18"/><path d="M5 4h13l-3 4 3 4H5"/></svg>',
  plus:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  logo:'<svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect x="6" y="4" width="24" height="32" rx="4" fill="var(--indigo)"/><rect x="6" y="4" width="24" height="32" rx="4" stroke="var(--amber)" stroke-width="1.4"/><path d="M12 4v32" stroke="rgba(232,152,31,0.7)" stroke-width="1.6"/><path d="M17 13h9M17 19h9M17 25h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity="0.85"/><path d="M30 8 34 4v6l-4 2Z" fill="var(--amber)"/></svg>',
  crown:'<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M3 8l4 3 5-6 5 6 4-3-2 11H5z"/></svg>',
  plane:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4 3 11.2l6.5 2.3M21 4l-3.5 16-8-6.5M21 4 9.5 13.5"/></svg>',
  clipboard:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="m9 12 2 2 4-4"/></svg>',
  timer:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/></svg>',
  rooms:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6"/><circle cx="18" cy="9" r="2.3"/><path d="M15.5 14c2.8.3 5 2.3 5 5.5"/></svg>',
  music:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  x:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  palette:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.4-.3-.4-.5-.9-.5-1.4 0-1.1.9-2 2-2h2.3A4.2 4.2 0 0 0 21.5 11 9.9 9.9 0 0 0 12 2Z"/><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none"/><circle cx="16.5" cy="10.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
  debate:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10h.01M12 10h.01M16 10h.01"/><path d="M4 6h16v9H9l-4 4v-4H4z"/></svg>',
  teacher:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5"/></svg>',
  hand:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12V6a1.5 1.5 0 0 1 3 0v5"/><path d="M11 11V4a1.5 1.5 0 0 1 3 0v7"/><path d="M14 11V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M17 8.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-7 7s-6-2-7.5-4.5L4 13c-.7-1 .3-2.3 1.5-1.8L8 12"/></svg>',
  medal:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="m9 10-3-7M15 10l3-7M9 3h6"/></svg>',
  poll:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M12 20V4M20 20v-7"/></svg>',
};

function esc(s){ return String(s ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function initialsOf(name){ return (name||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function avatarInner(p){
  if (p?.avatar_url) return `<img src="${esc(p.avatar_url)}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
  return initialsOf(p?.name || p?.username);
}
function roleBadge(p){
  if (p?.role === 'admin') return ` <span title="Host" style="color:var(--amber);font-weight:700;">✦</span>`;
  if (p?.role === 'premium') return ` <span title="Premium" style="color:var(--amber);font-weight:700;">✧</span>`;
  return '';
}
// Resize images before upload — this is the main "speed" fix: raw phone photos can be
// 5-10MB, which makes every avatar across the app slow to load. We shrink to a small,
// fast-loading JPEG on the user's device before it ever reaches storage.
function resizeImage(file, maxSize = 480, quality = 0.82){
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = e => { img.src = e.target.result; };
    reader.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize){ height = Math.round(height * (maxSize / width)); width = maxSize; }
      else if (height > maxSize){ width = Math.round(width * (maxSize / height)); height = maxSize; }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process image')), 'image/jpeg', quality);
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function uploadAvatar(file){
  const blob = await resizeImage(file);
  const path = `avatars/${state.session.user.id}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('attachments').upload(path, blob, { upsert:true, cacheControl:'3600', contentType:'image/jpeg' });
  if (error) throw error;
  const { data } = supabase.storage.from('attachments').getPublicUrl(path);
  return data.publicUrl;
}
function fmtTime(ts){ const d = new Date(ts); return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}); }
function fmtRelative(ts){
  const s = (Date.now() - new Date(ts).getTime())/1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s/60)+' min ago';
  if (s < 86400) return Math.floor(s/3600)+' hr ago';
  return Math.floor(s/86400)+' d ago';
}
function fmtDateDivider(ts){
  const d = new Date(ts), today = new Date();
  const yest = new Date(); yest.setDate(today.getDate()-1);
  const sameDay = (a,b)=>a.toDateString()===b.toDateString();
  if (sameDay(d,today)) return 'Today';
  if (sameDay(d,yest)) return 'Yesterday';
  return d.toLocaleDateString([], { day:'numeric', month:'short', year: d.getFullYear()!==today.getFullYear() ? 'numeric' : undefined });
}
// Shared renderer for live chat + study room chat (both carry a `profiles`
// join). Adds day dividers and a "Sending…" state for optimistic messages
// that haven't been confirmed by the server yet.
function chatBubblesHTML(messages, myId, { idKey }){
  let html = '', lastDate = null;
  messages.forEach(m=>{
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDate){
      html += `<div class="date-divider"><span>${fmtDateDivider(m.created_at)}</span></div>`;
      lastDate = day;
    }
    const self = m[idKey] === myId;
    const name = m.profiles?.name || m.profiles?.username || 'Someone';
    html += `<div class="bubble-row ${self?'self':''} ${m.pending?'pending':''}">
      <div class="avatar sm" ${self?'':`data-viewprofile="${m[idKey]}" style="cursor:pointer;background:none;"`} style="${self?'background:var(--amber);color:#241C05;':'cursor:pointer;'}">${avatarInner(m.profiles)}</div>
      <div>${!self?`<p class="bubble-name" data-viewprofile="${m[idKey]}" style="cursor:pointer;">${esc(name)}${roleBadge(m.profiles)}</p>`:''}<div class="bubble">${linkifyMessage(m.content)}<span class="bubble-time">${m.pending?'Sending…':fmtTime(m.created_at)}</span></div></div>
    </div>`;
  });
  return html;
}
function linkifyMessage(content){
  const escaped = esc(content);
  return escaped.replace(/(https?:\/\/[^\s]+)/g, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="rd-file-link">🔗 Open attachment</a>`);
}
async function sha256(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* ============ STATE ============ */
const state = {
  theme: localStorage.getItem('ten_theme') || 'light',
  view: 'home',
  chatTab: 'doubts',
  session: null,
  profile: null,
  subjects: [],
  subject: null,
  notes: [],
  myNotes: [],
  tests: [],
  activeTest: null,
  rooms: [],
  activeRoomId: null,
  roomMessages: [],
  roomChannel: null,
  roomAccessRequests: [],
  nowPlaying: null,
  nowPlayingChannel: null,
  noise: { ctx:null, source:null, gain:null, playing:false, type:'white' },
  call: { active:false, roomId:null, roomType:null, jitsi:null, fullscreen:false },
  roomTab: 'notes',
  whiteboard: { color:'#33E0FF', size:3, erasing:false },
  whiteboardChannel: null,
  notesChannel: null,
  tasksChannel: null,
  boardChannel: null,
  roomTasks: [],
  discussionRooms: [],
  activeDiscussionRoomId: null,
  discussionTab: 'discussion',
  discussionMessages: [],
  discussionChannel: null,
  discussionActiveTopic: null,
  discussionRounds: [],
  discussionActiveRound: null,
  discussionAnswers: [],
  discussionPolls: [],
  discussionLeaderboard: [],
  discussionHandQueue: [],
  roomMembersFull: [],
  bookmarkIds: new Set(),
  openNote: null,
  questions: [],
  liveMessages: [],
  conversations: [],
  openConvoId: null,
  threadMessages: [],
  privateHidden: false,
  privateLocked: false,
  pinInput: '',
  pinMode: null, // 'set' | 'unlock'
  stopConfirm: null,
  reports: [],
  liveChannel: null,
  threadChannel: null,
  loading: true,
};

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(()=>t.classList.remove('show'), 2400);
}
function openModal(html){
  document.getElementById('modalRoot').innerHTML = `<div class="modal-overlay" id="ov">${html}</div>`;
  document.getElementById('ov').addEventListener('click', e=>{ if(e.target.id==='ov') closeModal(); });
}
function closeModal(){ document.getElementById('modalRoot').innerHTML = ''; }

/* ============ AUTH ============ */
async function refreshSession(){
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  if (state.session){
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', state.session.user.id).single();
    state.profile = prof;
    state.privateHidden = prof?.settings?.private_hidden || false;
  } else {
    state.profile = null;
  }
}

async function signUp(email, password, username, name){
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, name } }
  });
  if (error) throw error;
  return data;
}
async function signIn(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}
async function signOut(){
  await supabase.auth.signOut();
}
async function sendPasswordReset(email){
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.href });
  if (error) throw error;
}
async function updatePassword(newPassword){
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/* ============ DATA LAYER ============ */
async function generateRoomCode(){
  const { data: taken } = await supabase.from('study_room_vip_codes').select('code');
  const reserved = new Set((taken||[]).map(v=>v.code));
  for (let attempt=0; attempt<8; attempt++){
    const code = String(Math.floor(100000 + Math.random()*900000));
    if (reserved.has(code)) continue;
    const { data } = await supabase.from('study_rooms').select('id').eq('room_code', code).maybeSingle();
    if (!data) return code;
  }
  return String(Date.now()).slice(-6);
}
async function fetchAvailableRoomCodes(){
  const { data } = await supabase.from('study_room_vip_codes').select('*').is('claimed_by', null).order('is_admin_reserved', { ascending:false }).order('code');
  return data || [];
}
// VIP numbers an admin has assigned to the current user (after payment) that
// aren't already in use as a room number.
async function fetchMyAssignedRoomCodes(){
  if (!state.session) return [];
  const { data: mine } = await supabase.from('study_room_vip_codes').select('*').eq('claimed_by', state.session.user.id).order('code');
  if (!mine?.length) return [];
  const { data: used } = await supabase.from('study_rooms').select('room_code').in('room_code', mine.map(c=>c.code));
  const usedSet = new Set((used||[]).map(r=>r.room_code));
  return mine.filter(c=>!usedSet.has(c.code));
}
async function createStudyRoom(name, isPremium, price, vipCode){
  const isAdmin = state.profile?.role === 'admin';
  // Admins can create a room free or VIP, however they like. Anyone else
  // creating their own room must attach a monthly price — they can still
  // invite specific friends in for free afterwards from "Manage room", but
  // a stranger joining by code has to request access (and, in effect, pay).
  const premium = isAdmin ? !!isPremium : true;
  const finalPrice = isAdmin ? (premium ? Math.max(0, Number(price) || 0) : 0) : Math.max(1, Number(price) || 0);

  let code;
  if (vipCode){
    const { data: codeRow } = await supabase.from('study_room_vip_codes').select('*').eq('code', vipCode).maybeSingle();
    if (!codeRow) throw new Error('That room number is not available');
    if (codeRow.is_admin_reserved && !isAdmin) throw new Error('That number is reserved for the host/admin');
    if (codeRow.claimed_by === state.session.user.id){
      // Already assigned to this user (by an admin after payment) — nothing to claim.
    } else if (codeRow.is_admin_reserved){
      await supabase.from('study_room_vip_codes').update({ claimed_by: state.session.user.id, claimed_at: new Date().toISOString() }).eq('code', vipCode);
    } else {
      if (codeRow.claimed_by) throw new Error('That number was just taken — pick another');
      if (!isAdmin && Number(codeRow.price) > 0){
        throw new Error(`${vipCode} is a paid VIP number (₹${codeRow.price} one-time). Once your payment is confirmed, an admin will assign it to your account and it'll show up as yours here. Until then, pick a random number.`);
      }
      const { data: claimed, error: claimErr } = await supabase.from('study_room_vip_codes')
        .update({ claimed_by: state.session.user.id, claimed_at: new Date().toISOString() })
        .eq('code', vipCode).is('claimed_by', null).select();
      if (claimErr) throw claimErr;
      if (!claimed || !claimed.length) throw new Error('That number was just taken — pick another');
    }
    code = vipCode;
  } else {
    code = await generateRoomCode();
  }

  const { data, error } = await supabase.from('study_rooms').insert({ room_code: code, name, created_by: state.session.user.id, is_premium: premium, price: finalPrice }).select().single();
  if (error) throw error;
  if (vipCode) await supabase.from('study_room_vip_codes').update({ room_id: data.id }).eq('code', vipCode);
  await supabase.from('study_room_members').insert({ room_id: data.id, user_id: state.session.user.id });
  return data;
}
async function loadMyRooms(){
  if (!state.session){ state.rooms = []; return; }
  const { data: memberships } = await supabase.from('study_room_members').select('room_id').eq('user_id', state.session.user.id);
  const ids = (memberships||[]).map(m=>m.room_id);
  if (!ids.length){ state.rooms = []; return; }
  const { data } = await supabase.from('study_rooms').select('*').in('id', ids).order('created_at', { ascending:false });
  state.rooms = data || [];
}
// Host/admin always join their own (or any) room for free. Everyone else
// needs an approved (and unexpired) access request before they can join a
// VIP room — price is monthly and is just informational here since there's
// no backend to charge a recurring amount; the host approves once payment
// is settled outside the app, and the approval carries a 30-day expiry.
async function joinRoomByCode(code){
  const { data: room } = await supabase.from('study_rooms').select('*').eq('room_code', code.trim()).maybeSingle();
  if (!room) throw new Error('No room found with that code');
  const isAdmin = state.profile.role === 'admin';
  const isHost = room.created_by === state.session.user.id;
  if (!isAdmin && !isHost){
    const { data: ban } = await supabase.from('study_room_bans').select('*').eq('room_id', room.id).eq('user_id', state.session.user.id).maybeSingle();
    if (ban) throw new Error('You were removed from this room by the host and can no longer rejoin.');
    if (room.locked) throw new Error('This room is locked by the host right now — ask them to open it.');
  }
  if (room.is_premium && !isAdmin && !isHost){
    const { data: access } = await supabase.from('study_room_access_requests').select('*').eq('room_id', room.id).eq('user_id', state.session.user.id).maybeSingle();
    if (access?.status === 'pending'){
      const err = new Error('Your access request is still waiting on the host.');
      err.pending = true;
      throw err;
    }
    const expired = access?.expires_at && new Date(access.expires_at) < new Date();
    if (access?.status !== 'approved' || expired){
      const err = new Error(`This is a VIP room${room.price>0?` (₹${room.price}/month)`:''}. ${expired ? 'Your subscription has expired — ask the host to renew you.' : 'Ask the host to approve your access.'}`);
      err.needsAccess = true;
      err.room = room;
      throw err;
    }
  }
  const { error } = await supabase.from('study_room_members').upsert({ room_id: room.id, user_id: state.session.user.id });
  if (error) throw error;
  return room;
}
async function requestRoomAccess(roomId){
  const { error } = await supabase.from('study_room_access_requests').upsert({ room_id: roomId, user_id: state.session.user.id, status:'pending', resolved_at: null }, { onConflict:'room_id,user_id' });
  if (error) throw error;
}
async function loadRoomAccessRequests(roomId){
  const { data } = await supabase.from('study_room_access_requests').select('*, profiles(username,name,avatar_url)').eq('room_id', roomId).eq('status','pending').order('created_at', { ascending:true });
  state.roomAccessRequests = data || [];
}
// NOTE (#1): despite the old name, this reads subscription/approval status
// from study_room_access_requests — it is NOT the actual member list. The
// real, current member list always comes from loadAllRoomMembers(), which
// reads study_room_members. This is only used to show subscription expiry
// ("Xd left" / "Renew") in the Manage Room modal.
async function loadRoomSubscriptions(roomId){
  const { data } = await supabase.from('study_room_access_requests').select('*, profiles(username,name,avatar_url)').eq('room_id', roomId).eq('status','approved').order('resolved_at', { ascending:false });
  return data || [];
}
async function resolveRoomAccessRequest(request, approve){
  const expiresAt = approve ? new Date(Date.now() + 30*24*60*60*1000).toISOString() : null;
  assertSupabase(await supabase.from('study_room_access_requests').update({ status: approve?'approved':'rejected', resolved_at: new Date().toISOString(), expires_at: expiresAt }).eq('id', request.id), 'Could not update that request');
  if (approve){
    assertSupabase(await supabase.from('study_room_members').upsert({ room_id: request.room_id, user_id: request.user_id }), 'Could not add them to the room');
  }
}
async function renewRoomAccess(requestId){
  assertSupabase(await supabase.from('study_room_access_requests').update({ expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString() }).eq('id', requestId), 'Could not renew access');
}
async function updateRoomSettings(roomId, { isPremium, price, pinnedMessage }){
  assertSupabase(await supabase.from('study_rooms').update({ is_premium: !!isPremium, price: isPremium ? Math.max(0, Number(price)||0) : 0, pinned_message: pinnedMessage || null }).eq('id', roomId), 'Only admins can set a price');
}

/* ---- Member management: co-host, remove, block, lock room ---- */
async function loadAllRoomMembers(roomId){
  const { data } = await supabase.from('study_room_members').select('*, profiles(username,name,avatar_url,role)').eq('room_id', roomId).order('joined_at');
  return data || [];
}
async function setCoHost(roomId, userId, value){
  const data = assertSupabase(await supabase.from('study_room_members').update({ co_host: value }).eq('room_id', roomId).eq('user_id', userId).select(), 'Could not update co-host');
  // With row-level security on, a blocked update returns no error and no
  // rows — which is exactly the silent failure this used to have. Surface
  // it instead of pretending it worked.
  if (!data || !data.length) throw new Error('Could not update co-host — make sure the latest schema.sql has been run (co-host RLS policy).');
}
async function removeMember(roomId, userId){
  assertSupabase(await supabase.from('study_room_members').delete().eq('room_id', roomId).eq('user_id', userId), 'Could not remove that member');
}
async function banMember(roomId, userId){
  // upsert instead of insert: banning someone already on the ban list (e.g.
  // clicking twice, or a stale UI) must not throw a duplicate-key error.
  assertSupabase(await supabase.from('study_room_bans').upsert({ room_id: roomId, user_id: userId }), 'Could not block that member');
  await removeMember(roomId, userId);
}
async function unbanMember(roomId, userId){
  assertSupabase(await supabase.from('study_room_bans').delete().eq('room_id', roomId).eq('user_id', userId), 'Could not unblock that member');
}
// Fire-and-forget notification helper — failing to notify someone should
// never block the actual action (appointing a teacher, scoring an answer,
// etc.), so callers just call this without awaiting/catching it themselves.
async function createNotification(userId, type, content){
  try{
    await supabase.from('notifications').insert({ user_id: userId, created_by: state.session.user.id, type, content });
  }catch(e){ console.error('[notify] failed to create notification:', e); }
}
async function loadRoomBans(roomId){
  const { data } = await supabase.from('study_room_bans').select('*, profiles(username,name,avatar_url)').eq('room_id', roomId).order('banned_at', { ascending:false });
  return data || [];
}
async function toggleRoomLock(roomId, locked){
  assertSupabase(await supabase.from('study_rooms').update({ locked }).eq('id', roomId), 'Could not update the room lock');
}

/* ---- Shared room video call (Jitsi) ----
   The call is deliberately namespaced by room TYPE + room id.  This prevents
   a Study Room and a Discussion Room from ever landing in the same meeting.
   It also cleans up an old Jitsi instance before a route/tab changes. */
const JITSI_DOMAIN = 'meet.jit.si';
let jitsiScriptPromise = null;

function loadJitsiScript(){
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (jitsiScriptPromise) return jitsiScriptPromise;
  jitsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('jitsi-external-api');
    if (existing){
      existing.addEventListener('load', resolve, {once:true});
      existing.addEventListener('error', ()=>reject(new Error('Video call service could not be loaded. Check your internet connection.')), {once:true});
      return;
    }
    const s = document.createElement('script');
    s.id = 'jitsi-external-api';
    s.src = `https://${JITSI_DOMAIN}/external_api.js`;
    s.async = true;
    s.onload = resolve;
    s.onerror = ()=>reject(new Error('Video call service could not be loaded. Check your internet connection.'));
    document.head.appendChild(s);
  });
  return jitsiScriptPromise;
}

async function startCall(roomId, room, roomType='study'){
  const container = document.getElementById('jitsiContainer');
  if (!container) { toast('Video area is not available. Re-open the Call tab.'); return; }

  // If another room/type is active, dispose it first.
  if (state.call.jitsi && (state.call.roomId !== roomId || state.call.roomType !== roomType)){
    endCall();
  }
  try{
    await loadJitsiScript();
  }catch(err){ toast(err.message); return; }

  if (state.call.jitsi){ try{ state.call.jitsi.dispose(); }catch(e){} }
  container.innerHTML = '<div style="height:100%;display:grid;place-items:center;color:var(--rd-muted);">Connecting to video call…</div>';

  const safeCode = String(room.room_code || roomId).replace(/[^a-zA-Z0-9_-]/g,'-');
  const roomName = `TEN-${roomType}-${safeCode}-${String(roomId).slice(0,8)}`;

  try{
    state.call.jitsi = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
      roomName,
      parentNode: container,
      width: '100%',
      height: '100%',
      userInfo: { displayName: state.profile?.name || state.profile?.username || 'Student' },
      configOverwrite: {
        prejoinPageEnabled: false,
        prejoinConfig: { enabled: false },
        requireDisplayName: false,
        disableDeepLinking: true,
        startWithVideoMuted: false,
        startWithAudioMuted: false,
        enableWelcomePage: false,
        hideLobbyButton: true,
        disableAP: false
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        MOBILE_APP_PROMO: false
      }
    });
    state.call.active = true;
    state.call.roomId = roomId;
    state.call.roomType = roomType;
    state.call.jitsi.addEventListener('videoConferenceLeft', () => {
      if (state.call.roomId === roomId) endCall();
    });
    state.call.jitsi.addEventListener('readyToClose', () => {
      if (state.call.roomId === roomId) endCall();
    });
    renderCallButtons();
  }catch(err){
    state.call.jitsi = null;
    state.call.active = false;
    state.call.roomId = null;
    state.call.roomType = null;
    container.innerHTML = '';
    renderCallButtons();
    toast('Could not start the video call. Please try again.');
    console.error('[video-call]', err);
  }
}

function endCall(){
  const old = state.call.jitsi;
  state.call.jitsi = null;
  state.call.active = false;
  state.call.roomId = null;
  state.call.roomType = null;
  if (old){ try{ old.dispose(); }catch(e){} }
  const container = document.getElementById('jitsiContainer');
  if (container) container.innerHTML = container.closest('.call-panel-inline') ? `<div class="call-placeholder">📹<span>Class ki video call yahan dikhegi.<br>"Start / join" dabao.</span></div>` : '';
  renderCallButtons();
}

function renderCallButtons(){
  const startBtn = document.getElementById('startCallBtn');
  const leaveBtn = document.getElementById('leaveCallBtn');
  if (startBtn) startBtn.style.display = state.call.active ? 'none' : 'inline-flex';
  if (leaveBtn) leaveBtn.style.display = state.call.active ? 'inline-flex' : 'none';
  const fsBtn = document.getElementById('callFsBtn');
  if (fsBtn) fsBtn.style.display = state.call.active ? 'inline-flex' : 'none';
}

async function loadWhiteboardStrokes(roomId){
  const { data } = await supabase.from('study_room_whiteboard_strokes').select('*').eq('room_id', roomId).order('created_at');
  return data || [];
}
async function addWhiteboardStroke(roomId, points, color, size){
  const { error } = await supabase.from('study_room_whiteboard_strokes').insert({ room_id: roomId, points, color, size, created_by: state.session.user.id });
  if (error) throw error;
}
async function clearWhiteboardDB(roomId){
  await supabase.from('study_room_whiteboard_strokes').delete().eq('room_id', roomId);
}
function drawStrokeOnCanvas(canvas, stroke){
  if (!canvas || !stroke.points || stroke.points.length < 2) return;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x * canvas.width, stroke.points[0].y * canvas.height);
  for (let i=1;i<stroke.points.length;i++) ctx.lineTo(stroke.points[i].x * canvas.width, stroke.points[i].y * canvas.height);
  ctx.stroke();
}
function subscribeWhiteboard(roomId, canvas){
  if (state.whiteboardChannel) supabase.removeChannel(state.whiteboardChannel);
  state.whiteboardChannel = supabase.channel('wb-'+roomId)
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'study_room_whiteboard_strokes', filter:`room_id=eq.${roomId}` }, payload => {
      if (payload.new.created_by === state.session.user.id) return;
      drawStrokeOnCanvas(document.getElementById('whiteboardCanvas'), payload.new);
    })
    .on('broadcast', { event:'wb-clear' }, async () => {
      // Anyone on the channel can send a broadcast, so don't trust it blindly —
      // redraw from the database, which only board controllers can clear.
      const c = document.getElementById('whiteboardCanvas');
      if (!c) return;
      const strokes = await loadWhiteboardStrokes(roomId);
      c.getContext('2d').clearRect(0,0,c.width,c.height);
      strokes.forEach(s=>drawStrokeOnCanvas(c, s));
    })
    .subscribe();
}
function setupWhiteboardCanvas(canvas, roomId){
  let drawing = false, points = [];
  function relPos(e){
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - rect.left) / rect.width, y: (t.clientY - rect.top) / rect.height };
  }
  function currentColor(){ return state.whiteboard.erasing ? '#0B0F1A' : state.whiteboard.color; }
  function currentSize(){ return state.whiteboard.erasing ? state.whiteboard.size * 6 : state.whiteboard.size; }
  function start(e){ drawing = true; points = [relPos(e)]; e.preventDefault(); }
  function move(e){
    if (!drawing) return;
    const p = relPos(e);
    drawStrokeOnCanvas(canvas, { points:[points[points.length-1], p], color: currentColor(), size: currentSize() });
    points.push(p);
    e.preventDefault();
  }
  async function end(){
    if (!drawing) return;
    drawing = false;
    if (points.length > 1){
      // Intentionally best-effort: a dropped stroke mid-drawing is a minor,
      // self-correcting visual sync gap (not a critical mutation like a
      // score or a payment), and toasting on every failed segment during
      // rapid drawing would be constant noise. Left silent on purpose.
      try{ await addWhiteboardStroke(roomId, points, currentColor(), currentSize()); }catch(e){}
    }
    points = [];
  }
  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive:false });
  canvas.addEventListener('touchmove', move, { passive:false });
  canvas.addEventListener('touchend', end);
}
async function clearWhiteboard(roomId){
  await clearWhiteboardDB(roomId);
  state.whiteboardChannel?.send({ type:'broadcast', event:'wb-clear', payload:{} });
  const c = document.getElementById('whiteboardCanvas');
  if (c) c.getContext('2d').clearRect(0,0,c.width,c.height);
}

/* ---- Shared notes scratchpad ---- */
async function loadRoomNotesText(roomId){
  const { data } = await supabase.from('study_room_notes').select('*').eq('room_id', roomId).maybeSingle();
  return data?.content || '';
}
let notesSaveTimer = null;
async function saveRoomNotesText(roomId, content){
  await supabase.from('study_room_notes').upsert({ room_id: roomId, content, updated_by: state.session.user.id, updated_at: new Date().toISOString() });
}
function subscribeRoomNotes(roomId, textarea){
  if (state.notesChannel) supabase.removeChannel(state.notesChannel);
  state.notesChannel = supabase.channel('notes-'+roomId)
    .on('postgres_changes', { event:'*', schema:'public', table:'study_room_notes', filter:`room_id=eq.${roomId}` }, payload => {
      if (payload.new?.updated_by === state.session.user.id) return;
      if (document.activeElement !== textarea) textarea.value = payload.new?.content || '';
    })
    .subscribe();
}

/* ---- Shared tasks checklist ---- */
async function loadRoomTasks(roomId){
  const { data } = await supabase.from('study_room_tasks').select('*').eq('room_id', roomId).order('created_at');
  return data || [];
}
async function addRoomTask(roomId, content){
  const { error } = await supabase.from('study_room_tasks').insert({ room_id: roomId, content, created_by: state.session.user.id });
  if (error) throw error;
}
async function toggleRoomTask(taskId, isDone){
  await supabase.from('study_room_tasks').update({ is_done: isDone }).eq('id', taskId);
}
async function deleteRoomTask(taskId){
  await supabase.from('study_room_tasks').delete().eq('id', taskId);
}
function subscribeRoomTasks(roomId, onChange){
  if (state.tasksChannel) supabase.removeChannel(state.tasksChannel);
  state.tasksChannel = supabase.channel('tasks-'+roomId)
    .on('postgres_changes', { event:'*', schema:'public', table:'study_room_tasks', filter:`room_id=eq.${roomId}` }, async () => {
      state.roomTasks = await loadRoomTasks(roomId);
      onChange();
    })
    .subscribe();
}

/* ---- Digital board: host / teacher / admin drive it, students follow ---- */
const BOARD_TABS = ['whiteboard','notes','music','tasks','teacher'];
function canControlBoard(room){
  const me = state.session?.user?.id;
  return state.profile?.role === 'admin' || room.created_by === me || (!!room.teacher_id && room.teacher_id === me);
}
async function loadRoomBoard(roomId){
  const { data } = await supabase.from('study_room_board').select('*').eq('room_id', roomId).maybeSingle();
  return data || null;
}
async function setRoomBoardTab(roomId, tab){
  const { error } = await supabase.from('study_room_board').upsert({ room_id: roomId, active_tab: tab, updated_by: state.session.user.id, updated_at: new Date().toISOString() });
  if (error) throw error;
}
function subscribeRoomBoard(roomId, onTab){
  if (state.boardChannel) supabase.removeChannel(state.boardChannel);
  state.boardChannel = supabase.channel('board-'+roomId)
    .on('postgres_changes', { event:'*', schema:'public', table:'study_room_board', filter:`room_id=eq.${roomId}` }, payload => {
      const tab = payload.new?.active_tab;
      if (BOARD_TABS.includes(tab) && tab !== state.roomTab) onTab(tab);
    })
    .subscribe();
}

async function loadRoomMessages(roomId){
  const { data } = await supabase.from('study_room_messages').select('*, profiles(username,name,avatar_url,role)').eq('room_id', roomId).order('created_at', { ascending:true }).limit(100);
  state.roomMessages = data || [];
}
async function sendRoomMessage(roomId, content){
  const { data, error } = await supabase.from('study_room_messages').insert({ room_id: roomId, sender_id: state.session.user.id, content }).select('*, profiles(username,name,avatar_url,role)').single();
  if (error) throw error;
  return data;
}
function subscribeRoomChannel(roomId){
  if (state.roomChannel) supabase.removeChannel(state.roomChannel);
  state.roomChannel = supabase.channel('room-'+roomId)
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'study_room_messages', filter:`room_id=eq.${roomId}` }, async payload => {
      if (state.roomMessages.some(m=>m.id===payload.new.id)) return; // already added optimistically
      const { data: prof } = await supabase.from('profiles').select('username,name,avatar_url,role').eq('id', payload.new.sender_id).single();
      state.roomMessages.push({ ...payload.new, profiles: prof });
      if (state.view === 'rooms' && state.activeRoomId === roomId) drawRoomMessages();
    })
    .subscribe();
}

/* -- room jukebox: any member can queue a YouTube song for the whole room -- */
function extractYouTubeId(url){
  const m = String(url||'').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}
async function fetchYouTubeTitle(videoId){
  try{
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v='+videoId)}&format=json`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.title || null;
  }catch{ return null; }
}
async function setNowPlaying(roomId, url){
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Paste a valid YouTube song link');
  const title = (await fetchYouTubeTitle(videoId)) || 'Shared song';
  const { error } = await supabase.from('study_room_now_playing')
    .upsert({ room_id: roomId, video_id: videoId, title, started_at: new Date().toISOString(), set_by: state.session.user.id, updated_at: new Date().toISOString() });
  if (error) throw error;
}
async function loadNowPlaying(roomId){
  const { data } = await supabase.from('study_room_now_playing').select('*, profiles(username,name)').eq('room_id', roomId).maybeSingle();
  state.nowPlaying = data || null;
}
function subscribeNowPlaying(roomId){
  if (state.nowPlayingChannel) supabase.removeChannel(state.nowPlayingChannel);
  state.nowPlayingChannel = supabase.channel('nowplaying-'+roomId)
    .on('postgres_changes', { event:'*', schema:'public', table:'study_room_now_playing', filter:`room_id=eq.${roomId}` }, async payload => {
      if (!payload.new){ state.nowPlaying = null; }
      else {
        const { data: prof } = payload.new.set_by ? await supabase.from('profiles').select('username,name').eq('id', payload.new.set_by).single() : { data:null };
        state.nowPlaying = { ...payload.new, profiles: prof };
      }
      if (state.view === 'rooms' && state.activeRoomId === roomId) drawNowPlaying();
    })
    .subscribe();
}

async function loadTests(){
  const { data } = await supabase.from('tests').select('*, subjects(name), test_questions(count)').order('created_at', { ascending:false });
  state.tests = (data || []).map(t => ({ ...t, questionCount: t.test_questions?.[0]?.count || 0 }));
}
async function createTest({ title, subjectId, isLive }){
  const { data, error } = await supabase.from('tests').insert({ title, subject_id: subjectId || null, is_live: isLive, created_by: state.session.user.id }).select().single();
  if (error) throw error;
  return data;
}
async function deleteTest(testId){
  const { error } = await supabase.from('tests').delete().eq('id', testId);
  if (error) throw error;
}
async function addTestQuestion(testId, { question, options, correctIndex }){
  const { error } = await supabase.from('test_questions').insert({ test_id: testId, question, options, correct_index: correctIndex });
  if (error) throw error;
}
async function fetchTestQuestions(testId){
  const { data } = await supabase.from('test_questions').select('*').eq('test_id', testId).order('created_at');
  return data || [];
}
async function submitTestAttempt(testId, answers){
  // The server now recomputes score/total itself (see verify_test_attempt_score
  // trigger in schema.sql) — whatever we send for score/total is ignored and
  // overwritten, so we don't even bother computing it client-side anymore.
  // We ask for the row back so the UI shows the *verified* score, not a
  // client-guessed one.
  const { data, error } = await supabase.from('test_attempts')
    .insert({ test_id: testId, user_id: state.session.user.id, answers })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function loadSubjects(){
  const { data } = await supabase.from('subjects').select('*, topics(*)').order('id');
  state.subjects = data || [];
}

async function loadNotes(){
  const { data } = await supabase.from('notes').select('*, subjects(name), topics(name)').eq('is_public', true).order('created_at', { ascending:false });
  state.notes = data || [];
  if (state.session){
    const { data: bms } = await supabase.from('bookmarks').select('note_id').eq('user_id', state.session.user.id);
    state.bookmarkIds = new Set((bms||[]).map(b=>b.note_id));
  }
}
async function loadMyNotes(){
  if (!state.session) { state.myNotes = []; return; }
  const { data } = await supabase.from('notes').select('*, subjects(name), topics(name)').eq('author_id', state.session.user.id).eq('is_public', false).order('created_at', { ascending:false });
  state.myNotes = data || [];
}
async function createNote({title, excerpt, content, subjectId, topicId, tags, isPremium, fileUrl}){
  const { error } = await supabase.from('notes').insert({
    author_id: state.session.user.id, title, excerpt, content,
    subject_id: subjectId || null, topic_id: topicId || null, tags: tags || [],
    is_public: true, is_premium: !!isPremium, file_url: fileUrl || null
  });
  if (error) throw error;
}
async function deleteNote(noteId){
  const { error } = await supabase.from('notes').delete().eq('id', noteId);
  if (error) throw error;
}
// SECURITY/UX (#10): reject unsupported file types and oversized files
// client-side before ever uploading them. This is a first line of defense
// for a better error message — the real security boundary is still the
// storage bucket's own policies (see schema.sql), since client-side checks
// alone can always be bypassed by a determined user calling the API directly.
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20 MB
function validateUpload(file, allowedExtensions){
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!allowedExtensions.includes(ext)){
    throw new Error(`That file type isn't supported. Allowed: ${allowedExtensions.join(', ').toUpperCase()}`);
  }
  if (file.size > MAX_UPLOAD_BYTES){
    throw new Error('That file is too large — the maximum size is 20 MB.');
  }
}
async function uploadNoteFile(file){
  validateUpload(file, ['pdf','png','jpg','jpeg','webp']);
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `notes/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert:true });
  if (error) throw error;
  const { data } = supabase.storage.from('attachments').getPublicUrl(path);
  return data.publicUrl;
}
async function createPersonalNote({title, excerpt, content, subjectId, tags}){
  const { error } = await supabase.from('notes').insert({
    author_id: state.session.user.id, title, excerpt, content,
    subject_id: subjectId || null, tags: tags || [],
    is_public: false
  });
  if (error) throw error;
}
async function toggleBookmark(noteId){
  if (state.bookmarkIds.has(noteId)){
    await supabase.from('bookmarks').delete().eq('user_id', state.session.user.id).eq('note_id', noteId);
    state.bookmarkIds.delete(noteId);
  } else {
    await supabase.from('bookmarks').insert({ user_id: state.session.user.id, note_id: noteId });
    state.bookmarkIds.add(noteId);
  }
}

async function loadQuestions(){
  const { data: qs } = await supabase.from('questions').select('*, profiles(username,name,avatar_url,role), subjects(name)').order('created_at', { ascending:false }).limit(50);
  const ids = (qs||[]).map(q=>q.id);
  let answersByQ = {}, likesByQ = {};
  if (ids.length){
    const { data: ans } = await supabase.from('answers').select('*, profiles(username,name,avatar_url,role)').in('question_id', ids).order('created_at');
    (ans||[]).forEach(a=>{ (answersByQ[a.question_id] ||= []).push(a); });
    const { data: likes } = await supabase.from('question_likes').select('*').in('question_id', ids);
    (likes||[]).forEach(l=>{ (likesByQ[l.question_id] ||= []).push(l.user_id); });
  }
  state.questions = (qs||[]).map(q=>({ ...q, answers: answersByQ[q.id]||[], likeUserIds: likesByQ[q.id]||[] }));
}
async function postQuestion(content, subjectId){
  const { error } = await supabase.from('questions').insert({ author_id: state.session.user.id, content, subject_id: subjectId || null });
  if (error) throw error;
}
async function postAnswer(questionId, content){
  const { error } = await supabase.from('answers').insert({ question_id: questionId, author_id: state.session.user.id, content });
  if (error) throw error;
}
async function toggleLike(questionId, liked){
  if (liked){
    await supabase.from('question_likes').delete().eq('question_id', questionId).eq('user_id', state.session.user.id);
  } else {
    await supabase.from('question_likes').insert({ question_id: questionId, user_id: state.session.user.id });
  }
}
async function fileReport(targetType, targetId, reason){
  const { error } = await supabase.from('reports').insert({ reporter_id: state.session.user.id, target_type: targetType, target_id: String(targetId), reason: reason || 'reported from app' });
  if (error) throw error;
}

/* -- live chat -- */
async function loadLiveMessages(){
  const { data } = await supabase.from('live_messages').select('*, profiles(username,name,avatar_url,role)').order('created_at', { ascending:true }).limit(60);
  state.liveMessages = data || [];
}
async function sendLiveMessage(content){
  const { data, error } = await supabase.from('live_messages').insert({ user_id: state.session.user.id, content }).select('*, profiles(username,name,avatar_url,role)').single();
  if (error) throw error;
  return data;
}
function subscribeLive(){
  if (state.liveChannel) supabase.removeChannel(state.liveChannel);
  state.liveChannel = supabase.channel('live-room')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'live_messages' }, async payload => {
      if (state.liveMessages.some(m=>m.id===payload.new.id)) return; // already shown optimistically
      const { data: prof } = await supabase.from('profiles').select('username,name,avatar_url,role').eq('id', payload.new.user_id).single();
      state.liveMessages.push({ ...payload.new, profiles: prof });
      if (state.view === 'live') drawLiveMessages();
    })
    .subscribe();
}

/* -- private chat -- */
async function loadConversations(){
  const uid = state.session.user.id;
  const { data: convos } = await supabase.from('conversations').select('*').or(`user_a.eq.${uid},user_b.eq.${uid}`);
  const otherIds = [...new Set((convos||[]).map(c => c.user_a===uid ? c.user_b : c.user_a))];
  let profs = [];
  if (otherIds.length){
    const { data } = await supabase.from('profiles').select('id,username,name,avatar_url,role').in('id', otherIds);
    profs = data || [];
  }
  const enriched = [];
  for (const c of (convos||[])){
    const otherId = c.user_a===uid ? c.user_b : c.user_a;
    const other = profs.find(p=>p.id===otherId) || { username:'unknown', name:'Unknown user' };
    const { data: lastMsgs } = await supabase.from('private_messages').select('*').eq('conversation_id', c.id).order('created_at', { ascending:false }).limit(1);
    enriched.push({ ...c, other, last: lastMsgs?.[0] || null });
  }
  enriched.sort((a,b)=> new Date(b.last?.created_at || b.created_at) - new Date(a.last?.created_at || a.created_at));
  state.conversations = enriched;
}
async function sendFriendRequest(toId){
  const { error } = await supabase.from('friend_requests').insert({ from_id: state.session.user.id, to_id: toId, status:'pending' });
  if (error) throw error;
}
async function respondFriendRequest(requestId, accept){
  await supabase.from('friend_requests').update({ status: accept?'accepted':'rejected', resolved_at: new Date().toISOString() }).eq('id', requestId);
}
async function loadIncomingFriendRequests(){
  if (!state.session) return [];
  const { data } = await supabase.from('friend_requests').select('*, profiles!friend_requests_from_id_fkey(username,name,avatar_url)').eq('to_id', state.session.user.id).eq('status','pending').order('created_at',{ ascending:false });
  return data || [];
}
// Messaging someone new now goes through a friend request first (like a
// social app) — once accepted, the private conversation opens as normal.
async function startConversationWithUsername(username){
  const { data: target } = await supabase.from('profiles').select('id,username,name,avatar_url,role').eq('username', username).single();
  if (!target) throw new Error('No user found with that username');
  if (target.id === state.session.user.id) throw new Error("You can't message yourself");
  const myId = state.session.user.id;
  const isAdmin = state.profile.role === 'admin';

  if (!isAdmin){
    const { data: existingReq } = await supabase.from('friend_requests').select('*')
      .or(`and(from_id.eq.${myId},to_id.eq.${target.id}),and(from_id.eq.${target.id},to_id.eq.${myId})`)
      .maybeSingle();

    if (!existingReq){
      await sendFriendRequest(target.id);
      const err = new Error(`Friend request sent to ${target.name||target.username}. You'll be able to chat once they accept.`);
      err.friendRequestSent = true;
      throw err;
    }
    if (existingReq.status === 'pending'){
      if (existingReq.from_id === target.id){
        await respondFriendRequest(existingReq.id, true);
      } else {
        const err = new Error('Friend request already sent — waiting for them to accept.');
        err.friendRequestPending = true;
        throw err;
      }
    } else if (existingReq.status === 'rejected'){
      await supabase.from('friend_requests').delete().eq('id', existingReq.id);
      await sendFriendRequest(target.id);
      const err = new Error(`Friend request sent to ${target.name||target.username}.`);
      err.friendRequestSent = true;
      throw err;
    }
  }

  const [a,b] = [myId, target.id].sort();
  const { data: existing } = await supabase.from('conversations').select('*').eq('user_a', a).eq('user_b', b).maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase.from('conversations').insert({ user_a:a, user_b:b }).select().single();
  if (error) throw error;
  return created.id;
}
async function loadThreadMessages(conversationId){
  const { data } = await supabase.from('private_messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending:true });
  state.threadMessages = data || [];
}
async function sendPrivateMessage(conversationId, content){
  const { data, error } = await supabase.from('private_messages').insert({ conversation_id: conversationId, sender_id: state.session.user.id, content }).select().single();
  if (error) throw error;
  return data;
}
function subscribeThread(conversationId){
  if (state.threadChannel) supabase.removeChannel(state.threadChannel);
  state.threadChannel = supabase.channel('conv-'+conversationId)
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'private_messages', filter:`conversation_id=eq.${conversationId}` }, payload => {
      if (state.threadMessages.some(m=>m.id===payload.new.id)) return; // already shown optimistically
      state.threadMessages.push(payload.new);
      if (state.view === 'private' && state.openConvoId === conversationId) drawThreadMessages();
    })
    .subscribe();
}
async function clearConversation(conversationId){
  await supabase.from('private_messages').delete().eq('conversation_id', conversationId);
}

/* -- star hide / pin lock --
   SECURITY NOTE (#18): this PIN is a local "re-enter to unhide" UX gate on
   an already-authenticated session/device, not a network security boundary
   — the actual access control for private messages is enforced by Supabase
   RLS (participants-only), verified in schema.sql. Because of that, an
   unsalted SHA-256 of a 4-digit PIN is an acceptable trade-off here: even a
   full hash collision attempt gains an attacker nothing beyond what they'd
   already see on an unlocked device, since it never gates a database call. */
async function setPrivateHidden(hidden){
  state.privateHidden = hidden;
  const { error } = await supabase.from('profiles').update({ settings: { ...(state.profile.settings||{}), private_hidden: hidden } }).eq('id', state.session.user.id);
  if (error){ state.privateHidden = !hidden; throw error; } // restore prior state on failure (#24)
}
async function setPin(pin){
  const hash = await sha256(pin);
  const { error } = await supabase.from('profiles').update({ pin_hash: hash }).eq('id', state.session.user.id);
  if (error) throw error;
  state.profile.pin_hash = hash;
}
async function verifyPin(pin){
  const hash = await sha256(pin);
  return hash === state.profile.pin_hash;
}

/* -- admin -- */
async function loadReports(){
  const { data } = await supabase.from('reports').select('*').order('created_at', { ascending:false });
  state.reports = data || [];
}
async function resolveReport(id){
  await supabase.from('reports').update({ resolved:true }).eq('id', id);
}
async function banUser(userId, ban){
  await supabase.from('profiles').update({ is_banned: ban }).eq('id', userId);
}

/* ============ NAV ============ */
const SIDE_LINKS = [
  { id:'home', label:'Home', icon:'home' },
  { id:'study', label:'Study', icon:'study' },
  { id:'notes', label:'Notes', icon:'notes' },
  { id:'test', label:'Test', icon:'clipboard' },
  { id:'livetest', label:'Live Test', icon:'timer' },
  { id:'rooms', label:'Study Rooms', icon:'rooms' },
  { id:'discussion', label:'Discussion Rooms', icon:'debate' },
  { id:'doubts', label:'Public chat', icon:'doubts' },
  { id:'live', label:'Live chat', icon:'live' },
  { id:'private', label:'Chats', icon:'plane' },
  { id:'bookmarks', label:'Bookmarks', icon:'bookmark' },
  { id:'dashboard', label:'Dashboard', icon:'dashboard' },
];
const BOTTOM_LINKS = [
  { id:'home', label:'Home', icon:'home' },
  { id:'study', label:'Study', icon:'study' },
  { id:'notes', label:'Notes', icon:'notes' },
  { id:'chat', label:'Chat', icon:'doubts' },
  { id:'profile', label:'Profile', icon:'profile' },
];

async function go(view){
  if (['doubts','live','private'].includes(view)) state.chatTab = view;
  state.view = view;
  state.subject = null;
  state.openNote = null;
  state.openConvoId = null;
  window.scrollTo({ top:0, behavior:'instant' });
  await renderRoute();
}
function toggleTheme(){
  state.theme = state.theme==='light' ? 'dark' : 'light';
  localStorage.setItem('ten_theme', state.theme);
  document.documentElement.setAttribute('data-theme', state.theme);
  renderChrome();
}

/* ============ CHROME (sidebar / topbar / bottom nav) ============ */
function renderChrome(){
  const sb = document.getElementById('sidebar');
  const isAdmin = state.profile?.role === 'admin';
  sb.innerHTML = `
    <div class="brand">${ICONS.logo}<div class="brand-name">The Extreme<br>Notebook<small>STUDY · ASK · CONNECT</small></div></div>
    ${SIDE_LINKS.map(l=>`<button class="side-link ${state.view===l.id?'active':''}" data-nav="${l.id}">${ICONS[l.icon]}${l.label}</button>`).join('')}
    <div class="side-divider"></div>
    <button class="side-link ${state.view==='profile'?'active':''}" data-nav="profile">${ICONS.profile}Profile</button>
    ${isAdmin ? `<button class="side-link ${state.view==='admin'?'active':''}" data-nav="admin">${ICONS.admin}Admin</button>` : ''}
    <div class="side-foot">
      <button class="side-link" id="themeToggleDesktop">${state.theme==='light'?ICONS.moon:ICONS.sun}${state.theme==='light'?'Dark mode':'Light mode'}</button>
      <button class="side-link" id="logoutDesktop">Log out</button>
    </div>
  `;
  sb.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav)));
  document.getElementById('themeToggleDesktop').addEventListener('click', toggleTheme);
  document.getElementById('logoutDesktop').addEventListener('click', async ()=>{ await signOut(); });

  document.getElementById('topbarBrand').innerHTML = `${ICONS.logo}<span>Extreme Notebook</span>`;
  const bell = document.getElementById('bellMobile');
  bell.innerHTML = ICONS.bell + '<span class="badge-dot"></span>';
  bell.onclick = ()=> toast('Notifications coming from the notifications table');
  const themeBtn = document.getElementById('themeToggleMobile');
  themeBtn.innerHTML = state.theme==='light' ? ICONS.moon : ICONS.sun;
  themeBtn.onclick = toggleTheme;

  const bn = document.getElementById('bottomNav');
  bn.innerHTML = BOTTOM_LINKS.map(l=>{
    const active = l.id==='chat' ? ['doubts','live','private'].includes(state.view) : state.view===l.id;
    return `<button class="bn-item ${active?'active':''}" data-nav="${l.id}">${ICONS[l.icon]}${l.label}</button>`;
  }).join('');
  bn.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>{
    go(b.dataset.nav==='chat' ? state.chatTab : b.dataset.nav);
  }));

  document.getElementById('rightRail').innerHTML = `
    <p class="rail-title">Your account</p>
    <div class="rail-card">
      <p class="rail-topic">${esc(state.profile?.name || 'Student')}</p>
      <p class="rail-meta">@${esc(state.profile?.username || '')} ${state.profile?.role==='premium'?'· Premium':''}</p>
    </div>
    <p class="rail-title" style="margin-top:20px;">Upgrade</p>
    <div class="rail-card">
      <p class="rail-topic">Unlock premium notes</p>
      <p class="rail-meta">One-time or subscription, via Stripe</p>
      <button class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;justify-content:center;" id="railUpgrade">${ICONS.crown} Upgrade</button>
    </div>
  `;
  document.getElementById('railUpgrade')?.addEventListener('click', openUpgradeModal);
}

/* ============ VIEWS ============ */
function noteCardHTML(n){
  const bookmarked = state.bookmarkIds.has(n.id);
  const isAdmin = state.profile?.role === 'admin';
  return `<div class="card note-card" data-note="${n.id}">
    <div class="note-tags">${(n.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}${n.is_premium?'<span class="tag" style="background:var(--amber-soft);color:#7A5410;">Premium</span>':''}${n.file_url?'<span class="tag">📎 File</span>':''}<span class="tag" style="background:var(--hair);color:var(--ink-soft);">${esc(n.subjects?.name||'General')}</span></div>
    <p class="note-title">${esc(n.title)}</p>
    <p class="note-excerpt">${esc(n.excerpt||'')}</p>
    <div class="note-foot">
      <span>${esc(n.topics?.name||'')}</span>
      <div class="note-actions">
        <button class="icon-btn small" data-bookmark="${n.id}" aria-label="Bookmark" style="${bookmarked?'color:var(--amber);border-color:var(--amber);':''}">${ICONS.bookmark}</button>
        ${isAdmin && n.is_public ? `<button class="icon-btn small danger" data-delete-note="${n.id}" aria-label="Delete">${ICONS.stop}</button>` : ''}
      </div>
    </div>
  </div>`;
}
function bindNoteCards(scope){
  scope.querySelectorAll('[data-note]').forEach(c=>c.addEventListener('click', e=>{
    if (e.target.closest('[data-bookmark]') || e.target.closest('[data-delete-note]')) return;
    state.openNote = c.dataset.note; go('notes');
  }));
  scope.querySelectorAll('[data-delete-note]').forEach(b=>b.addEventListener('click', async e=>{
    e.stopPropagation();
    if (!confirm('Delete this note for everyone? This cannot be undone.')) return;
    await deleteNote(b.dataset.deleteNote);
    await loadNotes();
    renderRoute();
    toast('Note deleted');
  }));
  scope.querySelectorAll('[data-bookmark]').forEach(b=>b.addEventListener('click', async e=>{
    e.stopPropagation();
    if (!requireAuth()) return;
    await toggleBookmark(b.dataset.bookmark);
    toast(state.bookmarkIds.has(b.dataset.bookmark) ? 'Note bookmarked' : 'Bookmark removed');
    renderRoute();
  }));
}

function questionCardHTML(q){
  const liked = state.session && q.likeUserIds.includes(state.session.user.id);
  return `<div class="card q-card" data-q="${q.id}">
    <div class="q-head"><div class="avatar" data-viewprofile="${q.author_id}" style="cursor:pointer;overflow:hidden;">${avatarInner(q.profiles)}</div>
      <div><p class="q-user" data-viewprofile="${q.author_id}" style="cursor:pointer;">${esc(q.profiles?.name||q.profiles?.username||'Unknown')}${roleBadge(q.profiles)}</p><p class="q-meta">${esc(q.subjects?.name||'General')} · ${fmtRelative(q.created_at)}</p></div>
    </div>
    <p class="q-text">${esc(q.content)}</p>
    <div class="q-foot">
      <button data-like="${q.id}" class="${liked?'liked':''}">${ICONS.heart} ${q.likeUserIds.length}</button>
      <button data-toggle-answers="${q.id}">${ICONS.reply} ${q.answers.length} ${q.answers.length===1?'answer':'answers'}</button>
      <button data-report="question:${q.id}">${ICONS.flag} Report</button>
    </div>
    <div id="answers-${q.id}">
      ${q.answers.map(a=>`
        <div class="answer">
          <div class="answer-head"><div class="avatar sm" data-viewprofile="${a.author_id}" style="cursor:pointer;overflow:hidden;">${avatarInner(a.profiles)}</div><span class="answer-user" data-viewprofile="${a.author_id}" style="cursor:pointer;">${esc(a.profiles?.name||a.profiles?.username)}${roleBadge(a.profiles)}</span>${a.is_helpful?'<span class="helpful-badge">Helpful</span>':''}</div>
          <p style="margin:0 0 0 36px;color:var(--ink-soft);">${esc(a.content)}</p>
        </div>`).join('')}
      <div style="display:flex;gap:8px;padding:10px 0 0 0;">
        <input type="text" placeholder="Write an answer..." data-answer-input="${q.id}" style="flex:1;border:1px solid var(--hair-strong);border-radius:9px;padding:8px 10px;font-size:13px;background:var(--paper);color:var(--ink);">
        <button class="btn btn-secondary btn-sm" data-answer-send="${q.id}">Reply</button>
      </div>
    </div>
  </div>`;
}
function bindQuestionCards(scope){
  scope.querySelectorAll('[data-viewprofile]').forEach(el=>el.addEventListener('click', e=>{
    e.stopPropagation();
    openUserProfileModal(el.dataset.viewprofile);
  }));
  scope.querySelectorAll('[data-like]').forEach(b=>b.addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    const q = state.questions.find(x=>x.id===b.dataset.like);
    const liked = q.likeUserIds.includes(state.session.user.id);
    // Update locally first for instant feedback, sync to the server in the background.
    if (liked) q.likeUserIds = q.likeUserIds.filter(id=>id!==state.session.user.id);
    else q.likeUserIds = [...q.likeUserIds, state.session.user.id];
    renderRoute();
    toggleLike(q.id, liked).catch(()=>{ toast('Could not save like, try again'); });
  }));
  scope.querySelectorAll('[data-report]').forEach(b=>b.addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    const [type,id] = b.dataset.report.split(':');
    await fileReport(type, id, 'flagged from public chat');
    toast('Reported to moderators');
  }));
  scope.querySelectorAll('[data-answer-send]').forEach(b=>b.addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    const input = scope.querySelector(`[data-answer-input="${b.dataset.answerSend}"]`);
    const val = input.value.trim();
    if (!val) { toast('Write an answer first'); return; }
    input.value = '';
    const q = state.questions.find(x=>x.id===b.dataset.answerSend);
    // Show it instantly using the current user's own profile, then confirm with the server.
    q.answers.push({ question_id: q.id, author_id: state.session.user.id, content: val, is_helpful:false, created_at: new Date().toISOString(), profiles: { username: state.profile.username, name: state.profile.name } });
    renderRoute();
    postAnswer(q.id, val).catch(()=>{ toast('Could not send answer, try again'); });
  }));
}

async function renderHome(){
  const el = document.getElementById('view-home');
  el.innerHTML = `
    <div class="hero">
      <div class="hero-inner">
        <p class="hero-eyebrow">The Extreme Notebook</p>
        <h1>Your knowledge.<br>Your notebook.<br>Your community.</h1>
        <p>Study subject-wise or exam-wise, keep notes in one place, ask doubts in public, and message the community — all from a single notebook.</p>
        <div class="hero-ctas">
          <button class="btn btn-primary" data-nav="study">${ICONS.study} Start studying</button>
          <button class="btn btn-ghost-light" data-nav="doubts">${ICONS.doubts} Join community</button>
        </div>
      </div>
    </div>
    <div class="grid-4" style="margin-bottom:20px;">
      <div class="tile subject-card" data-nav="test"><div class="tile-icon" style="background:var(--paper);font-size:20px;">${ICONS.clipboard}</div><div class="subject-info"><p class="tile-name">Test</p><p class="tile-meta">Practice</p></div></div>
      <div class="tile subject-card" data-nav="livetest"><div class="tile-icon" style="background:var(--paper);font-size:20px;">${ICONS.timer}</div><div class="subject-info"><p class="tile-name">Live Test</p><p class="tile-meta">Hosted by admin</p></div></div>
      <div class="tile subject-card" data-nav="rooms"><div class="tile-icon" style="background:var(--paper);font-size:20px;">${ICONS.rooms}</div><div class="subject-info"><p class="tile-name">Study Rooms</p><p class="tile-meta">Study with friends</p></div></div>
      <div class="tile subject-card" data-nav="discussion"><div class="tile-icon" style="background:var(--paper);font-size:20px;">${ICONS.debate}</div><div class="subject-info"><p class="tile-name">Discussion Rooms</p><p class="tile-meta">Debate &amp; compete</p></div></div>
    </div>
    <div class="section-head"><h2>Subjects</h2><a href="#" data-nav="study">View all</a></div>
    <div class="grid-4" id="homeSubjects"></div>
    <div class="section-head"><h2>Recent notes</h2><a href="#" data-nav="notes">View all</a></div>
    <div id="homeNotes"></div>
    <div class="section-head"><h2>Latest doubts</h2><a href="#" data-nav="doubts">View all</a></div>
    <div id="homeDoubts"></div>
  `;
  el.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav)));
  el.querySelector('#homeSubjects').innerHTML = state.subjects.slice(0,4).map(s=>`
    <div class="tile subject-card" data-subj="${s.id}">
      <div class="tile-icon" style="background:var(--paper);font-size:20px;">${s.icon||'📘'}</div>
      <div class="subject-info"><p class="tile-name">${esc(s.name)}</p><p class="tile-meta">${(s.topics||[]).length} topics</p></div>
    </div>`).join('') || `<div class="empty"><p>No subjects yet — an admin can add some from Supabase.</p></div>`;
  el.querySelectorAll('[data-subj]').forEach(c=>c.addEventListener('click',()=>{ state.subject=c.dataset.subj; go('study'); }));
  el.querySelector('#homeNotes').innerHTML = state.notes.slice(0,2).map(noteCardHTML).join('') || `<div class="empty"><p>No notes yet.</p></div>`;
  bindNoteCards(el.querySelector('#homeNotes'));
  el.querySelector('#homeDoubts').innerHTML = state.questions.slice(0,1).map(questionCardHTML).join('') || `<div class="empty"><p>No doubts yet.</p></div>`;
  bindQuestionCards(el.querySelector('#homeDoubts'));
}

function renderStudy(){
  const el = document.getElementById('view-study');
  if (!state.subject){
    el.innerHTML = `<div class="section-head"><h2>Study</h2></div><div id="subjList"></div>`;
    el.querySelector('#subjList').innerHTML = state.subjects.map(s=>`
      <div class="card subject-card" data-subj="${s.id}">
        <div class="tile-icon" style="background:var(--paper);font-size:20px;">${s.icon||'📘'}</div>
        <div class="subject-info"><p class="tile-name">${esc(s.name)}</p><p class="tile-meta">${(s.topics||[]).length} topics</p></div>
        <span class="chev">${ICONS.chev}</span>
      </div>`).join('') || `<div class="empty"><p>No subjects yet.</p></div>`;
    el.querySelectorAll('[data-subj]').forEach(c=>c.addEventListener('click',()=>{ state.subject=c.dataset.subj; renderStudy(); }));
  } else {
    const s = state.subjects.find(x=>String(x.id)===String(state.subject));
    el.innerHTML = `
      <div class="crumb"><button id="backToSubjects">Study</button> / <span>${esc(s.name)}</span></div>
      <div class="section-head"><h2>${s.icon||''} ${esc(s.name)}</h2></div>
      <div class="card" style="padding:6px 16px;">
        ${(s.topics||[]).map(t=>`<div class="topic-row"><div><p class="topic-name">${esc(t.name)}</p></div><span class="chev">${ICONS.chev}</span></div>`).join('') || '<p class="topic-meta" style="padding:14px 0;">No topics added yet.</p>'}
      </div>
    `;
    document.getElementById('backToSubjects').addEventListener('click',()=>{ state.subject=null; renderStudy(); });
  }
}

function renderNotes(){
  const el = document.getElementById('view-notes');
  if (state.openNote){
    const n = state.notes.find(x=>x.id===state.openNote);
    if (!n){ state.openNote = null; return renderNotes(); }
    const canRead = !n.is_premium || state.profile?.role === 'premium' || state.profile?.role === 'admin';
    el.innerHTML = `
      <div class="crumb"><button id="backToNotes">Notes</button> / <span>${esc(n.subjects?.name||'')}</span></div>
      ${canRead ? `
      <div class="reader-page">
        <h3>${esc(n.title)}</h3>
        <p>${esc(n.excerpt||'')}</p>
        <p>${esc(n.content || 'No further content added for this note yet.')}</p>
        ${n.file_url ? `<a href="${esc(n.file_url)}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm" style="margin-top:6px;">📎 Open attached file</a>` : ''}
      </div>` : `
      <div class="hidden-panel"><h3>Premium note</h3><p>Upgrade to premium to read this note.</p><button class="btn btn-primary btn-sm" id="unlockBtn" style="margin-top:10px;">Upgrade</button></div>`}
      <div style="display:flex;gap:8px;margin-top:14px;">
        <button class="btn btn-secondary btn-sm" data-bookmark="${n.id}">${state.bookmarkIds.has(n.id)?'Bookmarked':'Bookmark'}</button>
      </div>
    `;
    document.getElementById('backToNotes').addEventListener('click',()=>{ state.openNote=null; renderNotes(); });
    document.getElementById('unlockBtn')?.addEventListener('click', openUpgradeModal);
    bindNoteCards(el);
    return;
  }
  el.innerHTML = `
    <div class="section-head"><h2>Notes</h2>${state.profile?.role==='admin'?`<a href="#" id="newNoteLink">+ New note</a>`:''}</div>
    <div class="search-bar">${ICONS.search}<input placeholder="Search notes by title, subject or topic" id="noteSearch"></div>
    <div id="notesList"></div>
  `;
  el.querySelector('#newNoteLink')?.addEventListener('click', openNewNoteModal);
  const listEl = el.querySelector('#notesList');
  function draw(ft){
    ft = (ft||'').toLowerCase();
    const items = state.notes.filter(n => n.title.toLowerCase().includes(ft) || (n.subjects?.name||'').toLowerCase().includes(ft) || (n.topics?.name||'').toLowerCase().includes(ft));
    listEl.innerHTML = items.length ? items.map(noteCardHTML).join('') : `<div class="empty"><p>No notes match your search.</p></div>`;
    bindNoteCards(listEl);
  }
  draw('');
  el.querySelector('#noteSearch').addEventListener('input', e=>draw(e.target.value));
}

function openNewNoteModal(){
  if (!requireAuth()) return;
  if (state.profile?.role !== 'admin'){ toast('Only admins can create notes'); return; }
  openModal(`
    <div class="modal">
      <h3>Create a note</h3>
      <label>Title</label><input id="mTitle" placeholder="e.g. Newton's Three Laws">
      <label>Subject</label>
      <select id="mSubject">${state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
      <label>Short summary</label><textarea id="mExcerpt" rows="2" placeholder="One or two sentences"></textarea>
      <label>Full content</label><textarea id="mContent" rows="4" placeholder="Write your notes here"></textarea>
      <label>Attach a file (PDF or image, optional)</label><input type="file" id="mFile" accept=".pdf,image/*">
      <label style="display:flex;align-items:center;gap:8px;margin-top:4px;"><input type="checkbox" id="mPremium" style="width:auto;margin:0;"> Mark as Premium (only paid users can read it)</label>
      <div id="noteUploadStatus" style="font-size:12px;color:var(--ink-faint);margin:8px 0;"></div>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelNote">Cancel</button>
        <button class="btn btn-primary" id="saveNote">Save note</button>
      </div>
    </div>
  `);
  document.getElementById('cancelNote').addEventListener('click', closeModal);
  document.getElementById('saveNote').addEventListener('click', async ()=>{
    const title = document.getElementById('mTitle').value.trim();
    if (!title){ toast('Give your note a title'); return; }
    const saveBtn = document.getElementById('saveNote');
    saveBtn.disabled = true; saveBtn.textContent = 'Saving...';
    try{
      let fileUrl = null;
      const file = document.getElementById('mFile').files[0];
      if (file){
        document.getElementById('noteUploadStatus').textContent = 'Uploading file...';
        fileUrl = await uploadNoteFile(file);
      }
      await createNote({
        title,
        excerpt: document.getElementById('mExcerpt').value.trim(),
        content: document.getElementById('mContent').value.trim(),
        subjectId: document.getElementById('mSubject').value,
        isPremium: document.getElementById('mPremium').checked,
        fileUrl,
      });
      closeModal();
      toast('Note created');
      await loadNotes();
      go('notes');
    }catch(err){
      saveBtn.disabled = false; saveBtn.textContent = 'Save note';
      toast(err.message || 'Could not save note — make sure the "attachments" storage bucket exists');
    }
  });
}

function chatTabsHTML(){
  const tabs = [{id:'doubts',label:'Public'},{id:'live',label:'Live'},{id:'private',label:'Chats'}];
  return `<div class="chat-tabs">${tabs.map(t=>`<button class="chat-tab ${state.chatTab===t.id?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('')}</div>`;
}
function bindChatTabs(scope){ scope.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.tab))); }

function renderDoubts(){
  const el = document.getElementById('view-doubts');
  const isAdmin = state.profile?.role === 'admin';
  el.innerHTML = `
    ${chatTabsHTML()}
    <div class="private-toolbar">
      <p class="hint">${state.questions.length} open doubts from the community</p>
      <button class="icon-btn" id="doubtAppearanceBtn" title="Chat appearance">${ICONS.palette}</button>
    </div>
    <div id="qList" class="chat-appearance-scope"></div>
    <div class="composer">
      <select id="askSubject" style="border:none;background:var(--paper);border-radius:9px;font-size:12.5px;padding:6px;">${state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
      <textarea rows="1" id="askInput" placeholder="Ask your doubt..."></textarea>
      <button class="send-btn" id="askSend">${ICONS.send}</button>
    </div>
  `;
  bindChatTabs(el);
  loadAppSetting('doubt_chat_appearance').then(v => applyChatAppearanceTo(el.querySelector('#qList'), v));
  el.querySelector('#doubtAppearanceBtn').addEventListener('click', async ()=>{
    const current = await loadAppSetting('doubt_chat_appearance');
    openChatAppearanceModal({
      title: 'Doubt Chat appearance',
      lockNote: 'Only host can change theme',
      canEdit: isAdmin,
      current,
      onSave: async (value)=>{ await saveAppSetting('doubt_chat_appearance', value); applyChatAppearanceTo(el.querySelector('#qList'), value); }
    });
  });
  el.querySelector('#qList').innerHTML += state.questions.length ? state.questions.map(questionCardHTML).join('') : `<div class="empty"><p>No doubts yet. Be the first to ask one.</p></div>`;
  bindQuestionCards(el.querySelector('#qList'));
  el.querySelector('#askSend').addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    const input = el.querySelector('#askInput');
    const val = input.value.trim();
    if (!val){ toast('Write your question first'); return; }
    const subjectId = el.querySelector('#askSubject').value;
    input.value = '';
    const subj = state.subjects.find(s=>String(s.id)===String(subjectId));
    state.questions.unshift({ id:'temp-'+Date.now(), author_id: state.session.user.id, content: val, created_at: new Date().toISOString(), profiles:{ username: state.profile.username, name: state.profile.name }, subjects: subj ? { name: subj.name } : null, answers:[], likeUserIds:[] });
    renderRoute();
    postQuestion(val, subjectId).then(async ()=>{ await loadQuestions(); if (state.view==='doubts'||state.view==='home'||state.view==='dashboard') renderRoute(); }).catch(()=>{ toast('Could not post question, try again'); });
  });
}

async function renderLive(){
  const el = document.getElementById('view-live');
  const isAdmin = state.profile?.role === 'admin';
  el.innerHTML = `
    ${chatTabsHTML()}
    <div class="thread-header">
      <div class="avatar" style="background:var(--green);">SR</div>
      <div class="info"><p class="name">Study room · Everyone</p><p class="status">Live · realtime</p></div>
      <button class="icon-btn" id="liveAppearanceBtn" title="Chat appearance">${ICONS.palette}</button>
      ${isAdmin ? `<button class="icon-btn danger" id="clearLiveBtn" aria-label="Clear all live chat messages">${ICONS.stop}</button>` : ''}
    </div>
    <div id="liveMessages" class="chat-appearance-scope"></div>
    <div class="composer">
      <textarea rows="1" id="liveInput" placeholder="${state.session? 'Message the room...' : 'Log in to send a message'}" ${state.session?'':'disabled'}></textarea>
      <button class="send-btn" id="liveSend">${ICONS.send}</button>
    </div>
  `;
  bindChatTabs(el);
  drawLiveMessages();
  loadAppSetting('live_chat_appearance').then(v => applyChatAppearanceTo(el.querySelector('#liveMessages'), v));
  el.querySelector('#liveAppearanceBtn').addEventListener('click', async ()=>{
    const current = await loadAppSetting('live_chat_appearance');
    openChatAppearanceModal({
      title: 'Live Chat appearance',
      lockNote: 'Only host can change theme',
      canEdit: isAdmin,
      current,
      onSave: async (value)=>{ await saveAppSetting('live_chat_appearance', value); applyChatAppearanceTo(el.querySelector('#liveMessages'), value); }
    });
  });
  el.querySelector('#clearLiveBtn')?.addEventListener('click', ()=>{
    openModal(`
      <div class="modal">
        <h3>Clear all live chat messages?</h3>
        <p>This deletes every message in Live chat for everyone. This action cannot be undone.</p>
        <div class="modal-actions"><button class="btn btn-secondary" id="cancelClearLive">Cancel</button><button class="btn btn-danger" id="confirmClearLive">Delete all</button></div>
      </div>
    `);
    document.getElementById('cancelClearLive').addEventListener('click', closeModal);
    document.getElementById('confirmClearLive').addEventListener('click', async ()=>{
      await supabase.from('live_messages').delete().not('id','is', null);
      state.liveMessages = [];
      closeModal();
      toast('Live chat cleared');
      renderRoute();
    });
  });
  el.querySelector('#liveSend').addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    const inp = el.querySelector('#liveInput');
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    // Optimistic UI: show the message immediately, don't wait for the network
    // round-trip or the realtime event — this is what removes the "reload to
    // see your own message" delay.
    const tempId = 'temp-'+Date.now();
    const temp = { id: tempId, user_id: state.session.user.id, content: val, created_at: new Date().toISOString(), profiles: state.profile, pending: true };
    state.liveMessages.push(temp);
    drawLiveMessages();
    try{
      const real = await sendLiveMessage(val);
      const i = state.liveMessages.findIndex(m=>m.id===tempId);
      if (i>-1) state.liveMessages[i] = real;
      drawLiveMessages();
    }catch(err){
      state.liveMessages = state.liveMessages.filter(m=>m.id!==tempId);
      drawLiveMessages();
      inp.value = val;
      toast('Message failed to send — try again');
    }
  });
}
function drawLiveMessages(){
  const wrap = document.getElementById('liveMessages');
  if (!wrap) return;
  if (state.liveMessages.length===0){ wrap.innerHTML = `<div class="empty"><p>No messages yet. Say hello!</p></div>`; return; }
  const myId = state.session?.user?.id;
  wrap.innerHTML = chatBubblesHTML(state.liveMessages, myId, { idKey:'user_id' });
  wrap.querySelectorAll('[data-viewprofile]').forEach(el=>el.addEventListener('click',()=>openUserProfileModal(el.dataset.viewprofile)));
  wrap.scrollTop = wrap.scrollHeight;
}

/* ---- private chat ---- */
async function renderPrivate(){
  const el = document.getElementById('view-private');
  if (!state.session){
    el.innerHTML = `${chatTabsHTML()}<div class="empty"><p>Log in to use chats.</p></div>`;
    bindChatTabs(el);
    return;
  }
  if (state.privateLocked){ renderPinScreen(el); return; }
  if (state.openConvoId){ await renderThread(el); return; }

  el.innerHTML = `
    ${chatTabsHTML()}
    <div class="private-toolbar">
      <p class="hint">${state.privateHidden ? 'No conversations yet. Tap + to start one.' : 'Just between you two'}</p>
      <div style="display:flex;gap:8px;">
        ${state.privateHidden ? '' : `<button class="icon-btn" id="newConvoBtn" aria-label="New chat">${ICONS.plus}</button>
        <button class="icon-btn" id="lockToggle" aria-label="Lock chats">${ICONS.lock}</button>`}
        <button class="star-btn ${state.privateHidden?'hidden-state':''}" id="starBtn" aria-label="Star">${ICONS.star}</button>
      </div>
    </div>
    <div id="privateBody"></div>
  `;
  bindChatTabs(el);
  const body = el.querySelector('#privateBody');
  if (!state.privateHidden){
    const incoming = await loadIncomingFriendRequests();
    if (incoming.length){
      const banner = document.createElement('div');
      banner.className = 'card';
      banner.innerHTML = `
        <p style="font-size:12.5px;font-weight:600;margin:0 0 8px;">Friend requests</p>
        ${incoming.map(r=>`
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--hair);">
            <span style="font-size:13px;">${esc(r.profiles?.name || r.profiles?.username || 'Someone')}</span>
            <span style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" data-decline-fr="${r.id}">Decline</button>
              <button class="btn btn-primary btn-sm" data-accept-fr="${r.id}">Accept</button>
            </span>
          </div>`).join('')}
      `;
      body.before(banner);
      banner.querySelectorAll('[data-accept-fr]').forEach(b=>b.addEventListener('click', async ()=>{
        await respondFriendRequest(b.dataset.acceptFr, true);
        toast('Friend request accepted — you can chat now');
        renderRoute();
      }));
      banner.querySelectorAll('[data-decline-fr]').forEach(b=>b.addEventListener('click', async ()=>{
        await respondFriendRequest(b.dataset.declineFr, false);
        renderRoute();
      }));
    }
  }
  if (state.privateHidden){
    // Deliberately indistinguishable from a genuinely empty inbox — no hint that anything is hidden.
    body.innerHTML = `<div class="empty"><p>No conversations yet. Tap + to start one.</p></div>`;
  } else {
    body.innerHTML = state.conversations.length ? state.conversations.map(c=>`
      <div class="convo-row" data-convo="${c.id}">
        <div class="avatar-wrap"><div class="avatar" style="overflow:hidden;">${avatarInner(c.other)}</div></div>
        <div class="convo-body">
          <div class="convo-name-row"><span class="convo-name">${esc(c.other.name||c.other.username)}${roleBadge(c.other)}</span><span class="convo-time">${c.last?fmtRelative(c.last.created_at):''}</span></div>
          <p class="convo-last">${esc(c.last?.content || 'No messages yet')}</p>
        </div>
      </div>`).join('') : `<div class="empty"><p>No conversations yet. Tap + to start one.</p></div>`;
    body.querySelectorAll('[data-convo]').forEach(row=>row.addEventListener('click', async ()=>{
      state.openConvoId = row.dataset.convo;
      await loadThreadMessages(state.openConvoId);
      subscribeThread(state.openConvoId);
      renderRoute();
    }));
  }
  el.querySelector('#newConvoBtn')?.addEventListener('click', openNewConvoModal);
  el.querySelector('#lockToggle')?.addEventListener('click', ()=>{
    state.pinMode = state.profile.pin_hash ? 'unlock' : 'set';
    state.privateLocked = true;
    state.pinInput = '';
    renderRoute();
  });

  // Star tap pattern: double-tap hides, triple-tap (within the same burst) unhides.
  // No toast, no label, no hint anywhere — this is intentionally silent.
  let tapTimes = [];
  el.querySelector('#starBtn').addEventListener('click', async ()=>{
    const now = Date.now();
    tapTimes = tapTimes.filter(t => now - t < 700);
    tapTimes.push(now);
    if (tapTimes.length === 2 && !state.privateHidden){
      try{ await setPrivateHidden(true); }catch(e){ /* stays silent by design; state already reverted internally */ }
      tapTimes = [];
      renderRoute();
    } else if (tapTimes.length === 3 && state.privateHidden){
      try{ await setPrivateHidden(false); }catch(e){ /* stays silent by design; state already reverted internally */ }
      tapTimes = [];
      renderRoute();
    } else if (tapTimes.length >= 3){
      tapTimes = [];
    }
  });
}
function openNewConvoModal(){
  openModal(`
    <div class="modal">
      <h3>Start a chat</h3>
      <label>Their username</label><input id="mUsername" placeholder="e.g. priya_s">
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelConvo">Cancel</button>
        <button class="btn btn-primary" id="startConvo">Start chat</button>
      </div>
    </div>
  `);
  document.getElementById('cancelConvo').addEventListener('click', closeModal);
  document.getElementById('startConvo').addEventListener('click', async ()=>{
    const username = document.getElementById('mUsername').value.trim();
    if (!username) return;
    try{
      const convoId = await startConversationWithUsername(username);
      closeModal();
      await loadConversations();
      state.openConvoId = convoId;
      await loadThreadMessages(convoId);
      subscribeThread(convoId);
      renderRoute();
    }catch(err){ toast(err.message); }
  });
}
async function renderThread(el){
  const c = state.conversations.find(x=>x.id===state.openConvoId);
  if (!c){ state.openConvoId = null; return renderPrivate(); }
  const myId = state.session.user.id;
  const isAdmin = state.profile?.role === 'admin';
  const myRooms = state.rooms.filter(r => isAdmin || r.created_by === myId);
  el.innerHTML = `
    <div class="thread-header">
      <button class="back" id="backToConvos">${ICONS.back}</button>
      <div class="avatar-wrap" data-viewprofile="${c.other.id}" style="cursor:pointer;"><div class="avatar sm" style="overflow:hidden;">${avatarInner(c.other)}</div></div>
      <div class="info" data-viewprofile="${c.other.id}" style="cursor:pointer;"><p class="name">${esc(c.other.name||c.other.username)}${roleBadge(c.other)}</p></div>
      <div class="thread-actions">
        <button class="icon-btn small" id="privAppearanceBtn" aria-label="Chat appearance">${ICONS.palette}</button>
        ${myRooms.length ? `<button class="icon-btn small" id="inviteToRoomBtn" aria-label="Invite to a study room">${ICONS.rooms}</button>` : ''}
        <button class="icon-btn small danger" id="stopPrivate" aria-label="Delete conversation">${ICONS.stop}</button>
      </div>
    </div>
    <div id="threadMessages" class="chat-appearance-scope"></div>
    <div class="composer">
      <textarea rows="1" id="privInput" placeholder="Message ${esc((c.other.name||c.other.username).split(' ')[0])}..."></textarea>
      <button class="send-btn" id="privSend">${ICONS.send}</button>
    </div>
  `;
  drawThreadMessages();
  loadConversationAppearance(c.id).then(v => applyChatAppearanceTo(el.querySelector('#threadMessages'), v));
  el.querySelector('#privAppearanceBtn').addEventListener('click', async ()=>{
    const current = await loadConversationAppearance(c.id);
    openChatAppearanceModal({
      title: `Chat with ${c.other.name||c.other.username}`,
      lockNote: 'Both of you can customize this chat',
      canEdit: true,
      current,
      onSave: async (value)=>{ await saveConversationAppearance(c.id, value); applyChatAppearanceTo(el.querySelector('#threadMessages'), value); }
    });
  });
  el.querySelector('#backToConvos').addEventListener('click', ()=>{ state.openConvoId=null; renderRoute(); });
  el.querySelectorAll('[data-viewprofile]').forEach(node=>node.addEventListener('click', ()=>openUserProfileModal(c.other.id)));
  el.querySelector('#inviteToRoomBtn')?.addEventListener('click', ()=>{
    openModal(`
      <div class="modal">
        <h3>Invite ${esc(c.other.name||c.other.username)} to a room</h3>
        <p>Pick one of your study rooms — they'll be added for free right away.</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${myRooms.map(r=>`<button class="btn btn-secondary" data-invite-room="${r.id}" style="justify-content:space-between;">${esc(r.name)} <span style="color:var(--ink-faint);">#${r.room_code}</span></button>`).join('')}
        </div>
        <div class="modal-actions"><button class="btn btn-secondary" id="cancelInviteRoom" style="width:100%;justify-content:center;">Close</button></div>
      </div>
    `);
    document.getElementById('cancelInviteRoom').addEventListener('click', closeModal);
    document.querySelectorAll('[data-invite-room]').forEach(b=>b.addEventListener('click', async ()=>{
      try{ await inviteUserToRoom(b.dataset.inviteRoom, c.other.username); toast('Invited to the room for free'); closeModal(); }
      catch(err){ toast(err.message); }
    }));
  });
  el.querySelector('#stopPrivate').addEventListener('click', ()=>{ state.stopConfirm = { type:'private', convoId:c.id }; renderStopModal(); });
  el.querySelector('#privSend').addEventListener('click', async ()=>{
    const inp = el.querySelector('#privInput');
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    const tempId = 'temp-'+Date.now();
    const temp = { id: tempId, conversation_id: c.id, sender_id: state.session.user.id, content: val, created_at: new Date().toISOString(), pending: true };
    state.threadMessages.push(temp);
    drawThreadMessages();
    try{
      const real = await sendPrivateMessage(c.id, val);
      const i = state.threadMessages.findIndex(m=>m.id===tempId);
      if (i>-1) state.threadMessages[i] = real;
      drawThreadMessages();
      loadConversations(); // refresh the "last message" preview in the inbox list
    }catch(err){
      state.threadMessages = state.threadMessages.filter(m=>m.id!==tempId);
      drawThreadMessages();
      inp.value = val;
      toast('Message failed to send — try again');
    }
  });
}
function drawThreadMessages(){
  const wrap = document.getElementById('threadMessages');
  if (!wrap) return;
  if (state.threadMessages.length===0){ wrap.innerHTML = `<div class="empty"><p>Conversation cleared.</p></div>`; return; }
  const myId = state.session.user.id;
  let html = '', lastDate = null;
  state.threadMessages.forEach(m=>{
    const day = new Date(m.created_at).toDateString();
    if (day !== lastDate){ html += `<div class="date-divider"><span>${fmtDateDivider(m.created_at)}</span></div>`; lastDate = day; }
    html += `<div class="bubble-row ${m.sender_id===myId?'self':''} ${m.pending?'pending':''}"><div class="bubble">${esc(m.content)}<span class="bubble-time">${m.pending?'Sending…':fmtTime(m.created_at)}</span></div></div>`;
  });
  wrap.innerHTML = html;
  wrap.scrollTop = wrap.scrollHeight;
}
function renderPinScreen(el){
  const isSet = state.pinMode === 'set';
  el.innerHTML = `
    <div class="lock-screen">
      <div class="lock-icon">${ICONS.lock.replace('width="19" height="19"','width="40" height="40"')}</div>
      <h3 style="font-family:var(--font-display);font-size:18px;margin:0 0 6px;">${isSet ? 'Set a PIN to lock this' : 'Enter your PIN'}</h3>
      <p style="font-size:13px;color:var(--ink-soft);margin:0 0 6px;">${isSet ? 'Choose a 4-digit PIN. You will need it to reopen this.' : 'Enter your 4-digit PIN to continue.'}</p>
      <div class="pin-dots">${[0,1,2,3].map(i=>`<div class="pin-dot ${state.pinInput.length>i?'filled':''}"></div>`).join('')}</div>
      <div class="pin-error" id="pinError"></div>
      <div class="keypad">
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="key" data-key="${n}">${n}</button>`).join('')}
        <button class="key" data-key="clear">Clear</button><button class="key" data-key="0">0</button><button class="key" data-key="back">⌫</button>
      </div>
      <button class="btn btn-secondary btn-sm" id="skipLock" style="margin-top:16px;">Cancel</button>
    </div>
  `;
  document.getElementById('skipLock').addEventListener('click', ()=>{ state.privateLocked=false; renderRoute(); });
  el.querySelectorAll('[data-key]').forEach(k=>k.addEventListener('click', async ()=>{
    const key = k.dataset.key;
    if (key==='clear') state.pinInput = '';
    else if (key==='back') state.pinInput = state.pinInput.slice(0,-1);
    else if (state.pinInput.length<4) state.pinInput += key;
    if (state.pinInput.length===4){
      if (isSet){
        try{
          await setPin(state.pinInput);
          state.privateLocked = false;
          toast('PIN set. Chats are now lockable.');
          renderRoute();
        }catch(err){
          document.getElementById('pinError').textContent = err.message || 'Could not save PIN — try again.';
          setTimeout(()=>{ state.pinInput=''; renderPinScreen(el); }, 800);
        }
        return;
      } else {
        const ok = await verifyPin(state.pinInput);
        if (ok){ state.privateLocked = false; renderRoute(); return; }
        document.getElementById('pinError').textContent = 'Incorrect PIN, try again.';
        setTimeout(()=>{ state.pinInput=''; renderPinScreen(el); }, 500);
        return;
      }
    }
    renderPinScreen(el);
  }));
}
function renderStopModal(){
  const { type, convoId } = state.stopConfirm;
  openModal(`
    <div class="modal">
      <h3>Delete this conversation?</h3>
      <p>Are you sure you want to delete this conversation? This action cannot be undone. Only this conversation will be removed — public and live chats are not affected.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelStop">Cancel</button>
        <button class="btn btn-danger" id="confirmStop">Delete</button>
      </div>
    </div>
  `);
  document.getElementById('cancelStop').addEventListener('click', closeModal);
  document.getElementById('confirmStop').addEventListener('click', async ()=>{
    await clearConversation(convoId);
    state.threadMessages = [];
    closeModal();
    toast('Conversation deleted');
    renderRoute();
  });
}

function renderDashboard(){
  const el = document.getElementById('view-dashboard');
  const myQ = state.questions.filter(q=>q.author_id===state.session?.user?.id).length;
  const myA = state.questions.reduce((n,q)=> n + q.answers.filter(a=>a.author_id===state.session?.user?.id).length, 0);
  const myNotes = state.myNotes.length + state.notes.filter(n=>n.author_id===state.session?.user?.id).length;
  el.innerHTML = `
    <div class="section-head"><h2>Welcome back, ${esc(state.profile?.name || 'there')}</h2></div>
    <div class="stat-grid">
      <div class="stat-card"><p class="stat-num">${myQ}</p><p class="stat-label">Questions asked</p></div>
      <div class="stat-card"><p class="stat-num">${myA}</p><p class="stat-label">Answers given</p></div>
      <div class="stat-card"><p class="stat-num">${myNotes}</p><p class="stat-label">Notes created</p></div>
      <div class="stat-card"><p class="stat-num">${state.bookmarkIds.size}</p><p class="stat-label">Bookmarks</p></div>
    </div>
    <div class="section-head"><h2>Recent doubts</h2></div>
    <div id="dashDoubts"></div>
  `;
  el.querySelector('#dashDoubts').innerHTML = state.questions.slice(0,2).map(questionCardHTML).join('') || `<div class="empty"><p>Nothing yet — ask your first question.</p></div>`;
  bindQuestionCards(el.querySelector('#dashDoubts'));
}

async function openUserProfileModal(userId){
  if (!userId) return;
  openModal(`<div class="modal"><p style="text-align:center;color:var(--ink-faint);font-size:13px;">Loading profile...</p></div>`);
  const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (!p){ closeModal(); toast('Could not load that profile'); return; }
  const isMe = state.session && state.session.user.id === userId;
  openModal(`
    <div class="modal">
      <div class="profile-head" style="margin-bottom:14px;">
        <div class="avatar" style="width:52px;height:52px;font-size:18px;overflow:hidden;">${avatarInner(p)}</div>
        <div><h2 style="font-size:17px;">${esc(p.name||p.username)} ${p.role==='premium'?'<span class="tag" style="background:var(--amber-soft);color:#7A5410;">Premium</span>':''}${p.role==='admin'?'<span class="tag" style="background:var(--green-soft);color:var(--green);">Admin</span>':''}</h2>
        <p>@${esc(p.username)} ${p.education?'· '+esc(p.education):''}</p></div>
      </div>
      <p style="font-size:13.5px;color:var(--ink-soft);line-height:1.6;">${esc(p.bio || 'No bio added yet.')}</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="closeProfileModal">Close</button>
        ${isMe ? '' : `<button class="btn btn-primary" id="messageFromProfile">Message</button>`}
      </div>
    </div>
  `);
  document.getElementById('closeProfileModal').addEventListener('click', closeModal);
  document.getElementById('messageFromProfile')?.addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    closeModal();
    try{
      const convoId = await startConversationWithUsername(p.username);
      await loadConversations();
      state.openConvoId = convoId;
      await loadThreadMessages(convoId);
      subscribeThread(convoId);
      go('private');
    }catch(err){ toast(err.message); }
  });
}

async function renderProfile(){
  const el = document.getElementById('view-profile');
  if (!state.session){ return renderAuthGate(el); }
  const p = state.profile;
  const achievements = await loadMyAchievements();
  const medalCounts = {};
  achievements.forEach(a=>{ medalCounts[a.medal_level] = (medalCounts[a.medal_level]||0)+1; });
  const totalPoints = achievements.reduce((sum,a)=>sum+(a.score||0),0);
  el.innerHTML = `
    <div class="section-head"><h2>Profile</h2></div>
    <div class="profile-head">
      <div class="avatar" style="overflow:hidden;">${avatarInner(p)}</div>
      <div><h2>${esc(p.name||p.username)} ${p.role==='premium'?'<span class="tag" style="background:var(--amber-soft);color:#7A5410;">Premium</span>':''}</h2>
      <p>@${esc(p.username)} ${p.education?'· '+esc(p.education):''}</p></div>
    </div>
    <div class="card"><p style="font-size:13.5px;line-height:1.6;color:var(--ink-soft);margin:0;">${esc(p.bio || 'No bio yet — tap Edit profile to add one.')}</p></div>

    <div class="section-head"><h2>My Achievements</h2></div>
    <div class="stat-grid">
      <div class="stat-card"><p class="stat-num">${achievements.length}</p><p class="stat-label">Total medals</p></div>
      <div class="stat-card"><p class="stat-num">${totalPoints}</p><p class="stat-label">Discussion points</p></div>
      <div class="stat-card"><p class="stat-num">${medalCounts.gold||0}</p><p class="stat-label">Gold medals</p></div>
      <div class="stat-card"><p class="stat-num">${medalCounts.champion||0}</p><p class="stat-label">Champion wins</p></div>
    </div>
    <div id="achievementsList">${achievements.length ? achievements.slice(0,8).map(a=>`
      <div class="card" style="display:flex;align-items:center;gap:10px;">
        <span style="font-size:24px;">${MEDAL_EMOJI[a.medal_level]||'🏅'}</span>
        <div style="flex:1;min-width:0;"><p style="font-weight:600;font-size:13.5px;margin:0;">${AWARD_LABELS[a.award_type]?.label||a.award_type}</p><p style="font-size:11.5px;color:var(--ink-faint);margin:0;">${esc(a.topic_title||a.room_code||'')} · ${a.score} pts</p></div>
      </div>`).join('') : `<div class="empty"><p>No medals yet — join a Discussion Room to start earning them.</p></div>`}</div>

    <div class="section-head"><h2>My notes</h2><a href="#" id="newPersonalNoteLink">+ New note</a></div>
    <p style="font-size:12px;color:var(--ink-faint);margin:-10px 0 12px;">Personal notes only you can see. Share them into Live chat or a chat with a friend.</p>
    <div id="myNotesList"></div>

    <div class="section-head"><h2>Account</h2></div>
    <div class="card" style="padding:4px 16px;">
      <div class="topic-row" id="editProfileRow" style="cursor:pointer;"><span class="topic-name">Edit profile</span><span class="chev">${ICONS.chev}</span></div>
      <div class="topic-row" id="changePwRow" style="cursor:pointer;"><span class="topic-name">Change password</span><span class="chev">${ICONS.chev}</span></div>
      <div class="topic-row" id="upgradeRow" style="cursor:pointer;"><span class="topic-name">Subscription &amp; billing</span><span class="chev">${ICONS.chev}</span></div>
      <div class="topic-row" id="appearanceRow" style="cursor:pointer;"><span class="topic-name">Fonts &amp; chat theme</span><span class="chev">${ICONS.chev}</span></div>
      <a class="topic-row" href="mailto:theextremenotebookofficial@gmail.com" style="cursor:pointer;text-decoration:none;"><span class="topic-name">Contact support</span><span class="chev">${ICONS.chev}</span></a>
      <div class="topic-row" id="logoutRow" style="cursor:pointer;"><span class="topic-name" style="color:var(--red);">Log out</span><span class="chev">${ICONS.chev}</span></div>
    </div>
  `;
  el.querySelector('#editProfileRow').addEventListener('click', openEditProfileModal);
  el.querySelector('#changePwRow').addEventListener('click', openChangePasswordModal);
  el.querySelector('#upgradeRow').addEventListener('click', openUpgradeModal);
  el.querySelector('#appearanceRow').addEventListener('click', openAppearanceModal);
  el.querySelector('#logoutRow').addEventListener('click', async ()=>{ await signOut(); });
  el.querySelector('#newPersonalNoteLink').addEventListener('click', e=>{ e.preventDefault(); openNewPersonalNoteModal(); });

  const listEl = el.querySelector('#myNotesList');
  listEl.innerHTML = state.myNotes.length ? state.myNotes.map(n=>`
    <div class="card">
      <p class="note-title">${esc(n.title)}</p>
      <p class="note-excerpt">${esc(n.excerpt||'')}</p>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <button class="btn btn-secondary btn-sm" data-share="${n.id}">Share</button>
      </div>
    </div>`).join('') : `<div class="empty"><p>No personal notes yet. Tap + New note to create one.</p></div>`;
  listEl.querySelectorAll('[data-share]').forEach(b=>b.addEventListener('click', ()=>{
    const note = state.myNotes.find(x=>x.id===b.dataset.share);
    openShareNoteModal(note);
  }));
}
function openNewPersonalNoteModal(){
  if (!requireAuth()) return;
  openModal(`
    <div class="modal">
      <h3>New personal note</h3>
      <p>Only you can see this. You can share it into Live chat or a chat later.</p>
      <label>Title</label><input id="mpTitle" placeholder="e.g. My exam revision points">
      <label>Subject</label>
      <select id="mpSubject"><option value="">General</option>${state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
      <label>Short summary</label><textarea id="mpExcerpt" rows="2"></textarea>
      <label>Full content</label><textarea id="mpContent" rows="4"></textarea>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelPNote">Cancel</button>
        <button class="btn btn-primary" id="savePNote">Save</button>
      </div>
    </div>
  `);
  document.getElementById('cancelPNote').addEventListener('click', closeModal);
  document.getElementById('savePNote').addEventListener('click', async ()=>{
    const title = document.getElementById('mpTitle').value.trim();
    if (!title){ toast('Give your note a title'); return; }
    await createPersonalNote({
      title,
      excerpt: document.getElementById('mpExcerpt').value.trim(),
      content: document.getElementById('mpContent').value.trim(),
      subjectId: document.getElementById('mpSubject').value || null,
    });
    closeModal();
    toast('Note saved to your profile');
    await loadMyNotes();
    renderRoute();
  });
}
function openShareNoteModal(note){
  openModal(`
    <div class="modal">
      <h3>Share "${esc(note.title)}"</h3>
      <p>Choose where to share this note.</p>
      <div class="modal-actions" style="flex-direction:column;">
        <button class="btn btn-secondary" id="shareToLive" style="width:100%;justify-content:center;margin-bottom:8px;">Share to Live chat</button>
        <label>Or send to a username</label>
        <input id="shareUsername" placeholder="e.g. priya_s" style="margin-bottom:12px;">
        <button class="btn btn-primary" id="shareToUser" style="width:100%;justify-content:center;">Send</button>
      </div>
    </div>
  `);
  const text = `📝 Shared a note: ${note.title}\n${note.excerpt || ''}`.trim();
  document.getElementById('shareToLive').addEventListener('click', async ()=>{
    try{ await sendLiveMessage(text); closeModal(); toast('Shared to Live chat'); }
    catch(err){ toast('Could not share'); }
  });
  document.getElementById('shareToUser').addEventListener('click', async ()=>{
    const username = document.getElementById('shareUsername').value.trim();
    if (!username) return;
    try{
      const convoId = await startConversationWithUsername(username);
      await sendPrivateMessage(convoId, text);
      closeModal();
      toast('Note shared');
    }catch(err){ toast(err.message); }
  });
}
function openEditProfileModal(){
  const p = state.profile;
  openModal(`
    <div class="modal">
      <h3>Edit profile</h3>
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
        <div class="avatar" id="avatarPreview" style="width:56px;height:56px;font-size:19px;overflow:hidden;">${avatarInner(p)}</div>
        <div>
          <label style="margin-bottom:4px;">Profile photo</label>
          <input type="file" id="mAvatarFile" accept="image/*">
        </div>
      </div>
      <label>Name</label><input id="mName" value="${esc(p.name||'')}">
      <label>Education / class</label><input id="mEducation" value="${esc(p.education||'')}">
      <label>Bio</label><textarea id="mBio" rows="3">${esc(p.bio||'')}</textarea>
      <div id="avatarStatus" style="font-size:12px;color:var(--ink-faint);margin:-6px 0 12px;"></div>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelEdit">Cancel</button><button class="btn btn-primary" id="saveEdit">Save</button></div>
    </div>
  `);
  document.getElementById('cancelEdit').addEventListener('click', closeModal);
  document.getElementById('mAvatarFile').addEventListener('change', e=>{
    const file = e.target.files[0];
    if (!file) return;
    document.getElementById('avatarPreview').innerHTML = `<img src="${URL.createObjectURL(file)}" style="width:100%;height:100%;object-fit:cover;">`;
  });
  document.getElementById('saveEdit').addEventListener('click', async ()=>{
    const saveBtn = document.getElementById('saveEdit');
    saveBtn.textContent = 'Saving...'; saveBtn.disabled = true;
    const updates = { name: document.getElementById('mName').value.trim(), education: document.getElementById('mEducation').value.trim(), bio: document.getElementById('mBio').value.trim() };
    const file = document.getElementById('mAvatarFile').files[0];
    try{
      if (file){
        document.getElementById('avatarStatus').textContent = 'Uploading photo...';
        updates.avatar_url = await uploadAvatar(file);
      }
      await supabase.from('profiles').update(updates).eq('id', state.session.user.id);
      Object.assign(state.profile, updates);
      closeModal(); toast('Profile updated'); renderRoute();
    } catch(err){
      saveBtn.textContent = 'Save'; saveBtn.disabled = false;
      document.getElementById('avatarStatus').textContent = '';
      toast('Could not upload photo — make sure the "attachments" storage bucket exists (see SETUP_GUIDE.md)');
    }
  });
}
function openChangePasswordModal(){
  openModal(`
    <div class="modal">
      <h3>Change password</h3>
      <label>New password</label><input id="mNewPw" type="password" placeholder="At least 6 characters">
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelPw">Cancel</button><button class="btn btn-primary" id="savePw">Update</button></div>
    </div>
  `);
  document.getElementById('cancelPw').addEventListener('click', closeModal);
  document.getElementById('savePw').addEventListener('click', async ()=>{
    const pw = document.getElementById('mNewPw').value;
    if (pw.length < 6){ toast('Password must be at least 6 characters'); return; }
    try{ await updatePassword(pw); closeModal(); toast('Password updated'); }
    catch(err){ toast(err.message); }
  });
}
const FONT_OPTIONS = {
  classic: { label:'Classic (Fraunces + Inter)', display:"'Fraunces', Georgia, serif", sans:"'Inter', sans-serif" },
  clean: { label:'Clean Sans', display:"'Inter', sans-serif", sans:"'Inter', sans-serif" },
  storybook: { label:'Storybook Serif', display:"Georgia, 'Times New Roman', serif", sans:"Georgia, serif" },
  rounded: { label:'Rounded', display:"'Trebuchet MS', sans-serif", sans:"'Trebuchet MS', sans-serif" },
};
const CHAT_THEMES = {
  default: { label:'Default Indigo', bubble:'#332E7C' },
  ocean: { label:'Ocean', bubble:'#1D6FA5' },
  forest: { label:'Forest', bubble:'#2C8F63' },
  sunset: { label:'Sunset', bubble:'#C6493F' },
  grape: { label:'Grape', bubble:'#7A3E9D' },
};
function applyAppearance(){
  const s = state.profile?.settings || {};
  const font = FONT_OPTIONS[s.font] || FONT_OPTIONS.classic;
  const theme = CHAT_THEMES[s.chatTheme] || CHAT_THEMES.default;
  document.documentElement.style.setProperty('--font-display', font.display);
  document.documentElement.style.setProperty('--font-sans', font.sans);
  document.documentElement.style.setProperty('--indigo', theme.bubble);
}
function openAppearanceModal(){
  const s = state.profile?.settings || {};
  openModal(`
    <div class="modal">
      <h3>Fonts &amp; chat theme</h3>
      <label>Font style</label>
      <select id="mFont">${Object.entries(FONT_OPTIONS).map(([k,v])=>`<option value="${k}" ${s.font===k?'selected':''}>${v.label}</option>`).join('')}</select>
      <label>Chat bubble theme</label>
      <select id="mTheme">${Object.entries(CHAT_THEMES).map(([k,v])=>`<option value="${k}" ${s.chatTheme===k?'selected':''}>${v.label}</option>`).join('')}</select>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelAppearance">Cancel</button><button class="btn btn-primary" id="saveAppearance">Save</button></div>
    </div>
  `);
  document.getElementById('cancelAppearance').addEventListener('click', closeModal);
  document.getElementById('saveAppearance').addEventListener('click', async ()=>{
    const newSettings = { ...(state.profile.settings||{}), font: document.getElementById('mFont').value, chatTheme: document.getElementById('mTheme').value };
    await supabase.from('profiles').update({ settings: newSettings }).eq('id', state.session.user.id);
    state.profile.settings = newSettings;
    applyAppearance();
    closeModal();
    toast('Appearance updated');
  });
}
/* ============ CHAT APPEARANCE (per-surface: Live / Doubt / Private) ============
   Live Chat & Doubt (Public) Chat: ONE shared look for everyone in that
   chat, editable only by admins ("host-controlled" per the design spec).
   Private Chat: one shared look per conversation, editable by EITHER
   participant — saving updates it for both people in that chat. */
const CHAT_THEME_PRESETS = {
  midnight: { label:'Midnight', accent:'#4C6FFF', bg:'#0B1020' },
  ocean:    { label:'Ocean',    accent:'#1EA7C9', bg:'#0A1E26' },
  aurora:   { label:'Aurora',   accent:'#2FD5A4', bg:'#0B1F1A' },
  lavender: { label:'Lavender', accent:'#9B7BE0', bg:'#1A1630' },
  sunset:   { label:'Sunset',   accent:'#F0765A', bg:'#241212' },
  forest:   { label:'Forest',   accent:'#3FAF7C', bg:'#0F1F16' },
  rose:     { label:'Rose',     accent:'#E85D8A', bg:'#230F17' },
  galaxy:   { label:'Galaxy',   accent:'#8B5CF6', bg:'#120B26' },
  minimal:  { label:'Minimal',  accent:'#5A5A72', bg:'#F2F3F8' },
  darkpremium: { label:'Dark Premium', accent:'#D4AF6A', bg:'#0A0A0A' },
};
const CHAT_FONT_PRESETS = {
  modernsans: { label:'Modern Sans', stack:"'Inter', sans-serif" },
  cleanrounded: { label:'Clean Rounded', stack:"'Trebuchet MS', 'Segoe UI Rounded', sans-serif" },
  elegant: { label:'Elegant', stack:"Georgia, 'Times New Roman', serif" },
  friendly: { label:'Friendly', stack:"'Comic Sans MS', 'Segoe UI', sans-serif" },
  study: { label:'Study', stack:"'Fraunces', Georgia, serif" },
  classic: { label:'Classic', stack:"'Times New Roman', serif" },
};
const CHAT_BUBBLE_STYLES = {
  modern: { label:'Modern', radius:'16px' },
  compact: { label:'Compact', radius:'8px' },
  soft: { label:'Soft', radius:'22px' },
};
const CHAT_DENSITIES = {
  comfortable: { label:'Comfortable', gap:'12px' },
  compact: { label:'Compact', gap:'6px' },
  spacious: { label:'Spacious', gap:'18px' },
};
const DEFAULT_CHAT_APPEARANCE = { theme:'midnight', font:'modernsans', bubble:'modern', density:'comfortable' };

async function loadAppSetting(key){
  const { data } = await supabase.from('app_settings').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}
async function saveAppSetting(key, value){
  const { error } = await supabase.from('app_settings').upsert({ key, value, updated_by: state.session.user.id, updated_at: new Date().toISOString() });
  if (error) throw error;
}
async function loadConversationAppearance(conversationId){
  const { data } = await supabase.from('conversation_appearance').select('value').eq('conversation_id', conversationId).maybeSingle();
  return data?.value || null;
}
async function saveConversationAppearance(conversationId, value){
  const { error } = await supabase.from('conversation_appearance').upsert({ conversation_id: conversationId, value, updated_by: state.session.user.id, updated_at: new Date().toISOString() });
  if (error) throw error;
}
// Applies a chat-appearance value onto ONE container (not the whole app) via
// scoped CSS variables — the bubble/composer CSS falls back to the normal
// site theme when these aren't set, so this never leaks outside that chat.
function applyChatAppearanceTo(containerEl, value){
  if (!containerEl) return;
  const v = { ...DEFAULT_CHAT_APPEARANCE, ...(value||{}) };
  const theme = CHAT_THEME_PRESETS[v.theme] || CHAT_THEME_PRESETS.midnight;
  const font = CHAT_FONT_PRESETS[v.font] || CHAT_FONT_PRESETS.modernsans;
  const bubble = CHAT_BUBBLE_STYLES[v.bubble] || CHAT_BUBBLE_STYLES.modern;
  const density = CHAT_DENSITIES[v.density] || CHAT_DENSITIES.comfortable;
  containerEl.style.setProperty('--scoped-accent', theme.accent);
  containerEl.style.setProperty('--scoped-chat-bg', theme.bg);
  containerEl.style.setProperty('--scoped-font', font.stack);
  containerEl.style.setProperty('--scoped-bubble-radius', bubble.radius);
  containerEl.style.setProperty('--scoped-msg-gap', density.gap);
  containerEl.classList.add('chat-appearance-scope');
}
function chatAppearanceSwatchesHTML(current){
  return Object.entries(CHAT_THEME_PRESETS).map(([k,v])=>`
    <button type="button" class="ca-swatch ${current===k?'active':''}" data-theme-swatch="${k}" style="background:${v.bg};">
      <span class="ca-swatch-dot" style="background:${v.accent};"></span>
      <span class="ca-swatch-label">${v.label}</span>
    </button>`).join('');
}
// canEdit=false renders the read-only "🔒 Only host can change appearance"
// state from the spec; canEdit=true (private chat, or admin in a
// public/live chat) shows the full editable panel with an Apply button.
function openChatAppearanceModal({ title, lockNote, canEdit, current, onSave }){
  const v = { ...DEFAULT_CHAT_APPEARANCE, ...(current||{}) };
  openModal(`
    <div class="modal" style="max-width:480px;">
      <h3>${esc(title)}</h3>
      ${!canEdit ? `<p style="display:flex;align-items:center;gap:6px;background:var(--paper);border:1px solid var(--hair);border-radius:10px;padding:8px 12px;font-size:12.5px;color:var(--ink-soft);">🔒 ${esc(lockNote||'Only the host can change appearance')}</p>` : `<p style="font-size:12px;color:var(--ink-faint);margin-top:-6px;">${esc(lockNote||'')}</p>`}
      <label style="margin-top:12px;">Theme</label>
      <div class="ca-swatch-grid">${chatAppearanceSwatchesHTML(v.theme)}</div>
      <label style="margin-top:12px;">Font</label>
      <select id="caFont" ${canEdit?'':'disabled'}>${Object.entries(CHAT_FONT_PRESETS).map(([k,f])=>`<option value="${k}" ${v.font===k?'selected':''}>${f.label}</option>`).join('')}</select>
      <label style="margin-top:12px;">Bubble style</label>
      <select id="caBubble" ${canEdit?'':'disabled'}>${Object.entries(CHAT_BUBBLE_STYLES).map(([k,b])=>`<option value="${k}" ${v.bubble===k?'selected':''}>${b.label}</option>`).join('')}</select>
      <label style="margin-top:12px;">Message density</label>
      <select id="caDensity" ${canEdit?'':'disabled'}>${Object.entries(CHAT_DENSITIES).map(([k,d])=>`<option value="${k}" ${v.density===k?'selected':''}>${d.label}</option>`).join('')}</select>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelCa">${canEdit?'Cancel':'Close'}</button>
        ${canEdit ? `<button class="btn btn-primary" id="applyCa">Apply Theme</button>` : ''}
      </div>
    </div>
  `);
  let selectedTheme = v.theme;
  document.getElementById('cancelCa').addEventListener('click', closeModal);
  if (canEdit){
    document.querySelectorAll('[data-theme-swatch]').forEach(b=>b.addEventListener('click', ()=>{
      selectedTheme = b.dataset.themeSwatch;
      document.querySelectorAll('[data-theme-swatch]').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    }));
    document.getElementById('applyCa').addEventListener('click', async e=>{
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = 'Saving...';
      const newValue = {
        theme: selectedTheme,
        font: document.getElementById('caFont').value,
        bubble: document.getElementById('caBubble').value,
        density: document.getElementById('caDensity').value,
      };
      try{ await onSave(newValue); closeModal(); toast('Chat appearance updated'); }
      catch(err){ btn.disabled = false; btn.textContent = 'Apply Theme'; toast(err.message || 'Could not save — try again'); }
    });
  }
}

function openUpgradeModal(){
  if (!requireAuth()) return;
  openModal(`
    <div class="modal">
      <h3>Upgrade to premium</h3>
      <p>Unlock premium notes and support the platform.</p>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelUpgrade">Not now</button>
        <button class="btn btn-primary" id="goStripe">${ICONS.crown} Continue to payment</button>
      </div>
    </div>
  `);
  document.getElementById('cancelUpgrade').addEventListener('click', closeModal);
  document.getElementById('goStripe').addEventListener('click', async ()=>{
    if (!PAYMENT_LINK){
      toast('Payments are not set up yet — see SETUP_GUIDE.md, step 8');
      return;
    }
    await supabase.from('subscriptions').insert({ user_id: state.session.user.id, plan:'premium', status:'pending' });
    // client_reference_id is only understood by Stripe Payment Links — most
    // other providers just ignore an unknown query param, so this is safe to
    // leave in either way. It's the one part of this flow that ties the
    // payment back to this specific user without a server.
    const url = `${PAYMENT_LINK}?client_reference_id=${state.session.user.id}`;
    window.open(url, '_blank');
    closeModal();
  });
}

function renderTestList(isLive){
  const el = document.getElementById(isLive ? 'view-livetest' : 'view-test');
  if (state.activeTest && state.activeTest.isLive === isLive){ renderTestTaking(el); return; }
  const isAdmin = state.profile?.role === 'admin';
  const items = state.tests.filter(t => t.is_live === isLive);
  el.innerHTML = `
    <div class="section-head"><h2>${isLive ? 'Live Test' : 'Test'}</h2>${isAdmin ? `<a href="#" id="newTestLink">+ New test</a>` : ''}</div>
    ${isLive ? `<p style="font-size:12px;color:var(--ink-faint);margin:-10px 0 16px;">Tests the host has marked as live.</p>` : ''}
    <div id="testListBody"></div>
  `;
  el.querySelector('#newTestLink')?.addEventListener('click', e=>{ e.preventDefault(); openNewTestModal(isLive); });
  const body = el.querySelector('#testListBody');
  body.innerHTML = items.length ? items.map(t=>`
    <div class="card">
      <p class="note-title">${esc(t.title)}</p>
      <p class="note-excerpt">${esc(t.subjects?.name || 'General')} · ${t.questionCount} question${t.questionCount===1?'':'s'}</p>
      <div style="display:flex;gap:8px;margin-top:10px;">
        ${t.questionCount > 0 ? `<button class="btn btn-primary btn-sm" data-start-test="${t.id}">Start</button>` : `<span style="font-size:12px;color:var(--ink-faint);">No questions added yet</span>`}
        ${isAdmin ? `<button class="btn btn-secondary btn-sm" data-add-q="${t.id}">Add question</button><button class="btn btn-secondary btn-sm" data-del-test="${t.id}" style="color:var(--red);">Delete</button>` : ''}
      </div>
    </div>`).join('') : `<div class="empty"><p>No ${isLive ? 'live tests' : 'tests'} yet.</p></div>`;

  body.querySelectorAll('[data-start-test]').forEach(b=>b.addEventListener('click', async ()=>{
    if (!requireAuth()) return;
    const t = items.find(x=>x.id===b.dataset.startTest);
    const questions = await fetchTestQuestions(t.id);
    state.activeTest = { test:t, questions, answers:{}, isLive };
    renderRoute();
  }));
  body.querySelectorAll('[data-add-q]').forEach(b=>b.addEventListener('click', ()=>openAddQuestionModal(b.dataset.addQ, isLive)));
  body.querySelectorAll('[data-del-test]').forEach(b=>b.addEventListener('click', async ()=>{
    await deleteTest(b.dataset.delTest);
    await loadTests();
    renderRoute();
  }));
}
function openNewTestModal(isLive){
  openModal(`
    <div class="modal">
      <h3>New ${isLive ? 'live test' : 'test'}</h3>
      <label>Title</label><input id="mtTitle" placeholder="e.g. Physics Mock Test 1">
      <label>Subject</label>
      <select id="mtSubject"><option value="">General</option>${state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelTest">Cancel</button><button class="btn btn-primary" id="saveTest">Create</button></div>
    </div>
  `);
  document.getElementById('cancelTest').addEventListener('click', closeModal);
  document.getElementById('saveTest').addEventListener('click', async ()=>{
    const title = document.getElementById('mtTitle').value.trim();
    if (!title){ toast('Give the test a title'); return; }
    const t = await createTest({ title, subjectId: document.getElementById('mtSubject').value || null, isLive });
    closeModal();
    toast('Test created — now add questions to it');
    await loadTests();
    renderRoute();
    openAddQuestionModal(t.id, isLive);
  });
}
function openAddQuestionModal(testId, isLive){
  openModal(`
    <div class="modal">
      <h3>Add a question</h3>
      <label>Question</label><textarea id="mqQuestion" rows="2"></textarea>
      <label>Option A</label><input id="mqA">
      <label>Option B</label><input id="mqB">
      <label>Option C</label><input id="mqC">
      <label>Option D</label><input id="mqD">
      <label>Correct option</label>
      <select id="mqCorrect"><option value="0">A</option><option value="1">B</option><option value="2">C</option><option value="3">D</option></select>
      <div class="modal-actions">
        <button class="btn btn-secondary" id="cancelQ">Done</button>
        <button class="btn btn-primary" id="saveQ">Add &amp; add another</button>
      </div>
    </div>
  `);
  document.getElementById('cancelQ').addEventListener('click', async ()=>{ closeModal(); await loadTests(); renderRoute(); });
  document.getElementById('saveQ').addEventListener('click', async ()=>{
    const question = document.getElementById('mqQuestion').value.trim();
    const options = ['mqA','mqB','mqC','mqD'].map(id=>document.getElementById(id).value.trim());
    if (!question || options.some(o=>!o)){ toast('Fill in the question and all 4 options'); return; }
    await addTestQuestion(testId, { question, options, correctIndex: Number(document.getElementById('mqCorrect').value) });
    toast('Question added');
    openAddQuestionModal(testId, isLive);
  });
}
function renderTestTaking(el){
  const { test, questions, answers } = state.activeTest;
  el.innerHTML = `
    <div class="crumb"><button id="backFromTest">${state.activeTest.isLive ? 'Live Test' : 'Test'}</button> / <span>${esc(test.title)}</span></div>
    <div id="testForm"></div>
    <button class="btn btn-primary" id="submitTest" style="margin-top:10px;">Submit</button>
  `;
  document.getElementById('backFromTest').addEventListener('click', ()=>{ state.activeTest = null; renderRoute(); });
  const form = el.querySelector('#testForm');
  form.innerHTML = questions.map((q,i)=>`
    <div class="card">
      <p style="font-weight:600;font-size:14px;margin:0 0 10px;">${i+1}. ${esc(q.question)}</p>
      ${q.options.map((opt,oi)=>`
        <label style="display:flex;align-items:center;gap:8px;padding:8px 0;font-size:13.5px;cursor:pointer;">
          <input type="radio" name="q-${q.id}" value="${oi}" ${answers[q.id]===oi?'checked':''}>
          ${esc(opt)}
        </label>`).join('')}
    </div>`).join('');
  form.querySelectorAll('input[type="radio"]').forEach(r=>r.addEventListener('change', e=>{
    const qid = e.target.name.replace('q-','');
    state.activeTest.answers[qid] = Number(e.target.value);
  }));
  el.querySelector('#submitTest').addEventListener('click', async ()=>{
    const submitBtn = el.querySelector('#submitTest');
    submitBtn.disabled = true; submitBtn.textContent = 'Submitting...';
    const total = questions.length;
    // We still show a quick local estimate while waiting, but the number
    // that actually gets stored and displayed comes back from the server
    // (see submitTestAttempt) — the database recomputes it independently
    // so a tampered client-side score can never be what's saved.
    try{
      const saved = await submitTestAttempt(test.id, state.activeTest.answers);
      const wasLive = state.activeTest.isLive;
      state.activeTest = null;
      openModal(`
        <div class="modal">
          <h3>Result</h3>
          <p style="font-size:22px;font-weight:700;color:var(--ink);text-align:center;margin:10px 0;">${saved.score} / ${saved.total}</p>
          <div class="modal-actions"><button class="btn btn-primary" id="closeResult" style="width:100%;justify-content:center;">Done</button></div>
        </div>
      `);
      document.getElementById('closeResult').addEventListener('click', ()=>{ closeModal(); go(wasLive?'livetest':'test'); });
    }catch(err){
      submitBtn.disabled = false; submitBtn.textContent = 'Submit';
      toast(err.message || 'Could not submit your test — try again');
    }
  });
}

/* ---- noise / focus sound generator (Web Audio API — no external files, no copyright issues) ---- */
function ensureNoiseContext(){
  if (!state.noise.ctx) state.noise.ctx = new (window.AudioContext || window.webkitAudioContext)();
  return state.noise.ctx;
}
function makeNoiseBuffer(ctx, type){
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if (type === 'brown'){
    let lastOut = 0;
    for (let i=0;i<bufferSize;i++){ const white = Math.random()*2-1; data[i] = (lastOut + 0.02*white) / 1.02; lastOut = data[i]; data[i] *= 3.5; }
  } else if (type === 'pink'){
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for (let i=0;i<bufferSize;i++){
      const white = Math.random()*2-1;
      b0=0.99886*b0+white*0.0555179; b1=0.99332*b1+white*0.0750759; b2=0.96900*b2+white*0.1538520;
      b3=0.86650*b3+white*0.3104856; b4=0.55000*b4+white*0.5329522; b5=-0.7616*b5-white*0.0168980;
      data[i]=(b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11; b6=white*0.115926;
    }
  } else {
    for (let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
  }
  return buffer;
}
function playNoise(type){
  stopNoise();
  const ctx = ensureNoiseContext();
  const source = ctx.createBufferSource();
  source.buffer = makeNoiseBuffer(ctx, type);
  source.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0.25;
  source.connect(gain).connect(ctx.destination);
  source.start(0);
  state.noise.source = source; state.noise.gain = gain; state.noise.playing = true; state.noise.type = type;
}
function stopNoise(){
  if (state.noise.source){ try{ state.noise.source.stop(); }catch(e){} try{ state.noise.source.disconnect(); }catch(e){} state.noise.source = null; }
  state.noise.playing = false;
}


/* ---- Study Rooms ---- */
/* ============================================================
   DISCUSSION ROOMS — study room + classroom + debate + leaderboard.
   Data layer first (this block), UI further below.
   ============================================================ */
async function generateDiscussionRoomCode(){
  const year = new Date().getFullYear();
  for (let attempt=0; attempt<8; attempt++){
    const seq = String(Math.floor(1 + Math.random()*9998)).padStart(4,'0');
    const code = `DR-${year}-${seq}`;
    const { data } = await supabase.from('discussion_rooms').select('id').eq('room_code', code).maybeSingle();
    if (!data) return code;
  }
  return `DR-${year}-${Date.now().toString().slice(-4)}`;
}
async function createDiscussionRoom(fields){
  const room_code = await generateDiscussionRoomCode();
  const { data, error } = await supabase.from('discussion_rooms').insert({
    room_code, name: fields.name, description: fields.description || null,
    subject_id: fields.subjectId || null, host_id: state.session.user.id,
    max_members: fields.maxMembers || 30, privacy: fields.privacy || 'public',
    scoring_enabled: fields.scoringEnabled !== false, leaderboard_enabled: fields.leaderboardEnabled !== false,
    medals_enabled: fields.medalsEnabled !== false,
  }).select().single();
  if (error) throw error;
  await supabase.from('discussion_room_members').insert({ room_id: data.id, user_id: state.session.user.id });
  return data;
}
async function loadMyDiscussionRooms(){
  if (!state.session){ state.discussionRooms = []; return; }
  const { data: memberships } = await supabase.from('discussion_room_members').select('room_id').eq('user_id', state.session.user.id);
  const memberIds = (memberships||[]).map(m=>m.room_id);
  const { data: publicRooms } = await supabase.from('discussion_rooms').select('*').eq('privacy','public').order('created_at',{ ascending:false }).limit(30);
  const ids = new Set([...(memberIds||[]), ...(publicRooms||[]).map(r=>r.id)]);
  const { data } = await supabase.from('discussion_rooms').select('*').in('id', [...ids]).order('created_at',{ ascending:false });
  state.discussionRooms = data || [];
}
async function joinDiscussionRoomByCode(code){
  const { data: room } = await supabase.from('discussion_rooms').select('*').eq('room_code', code.trim().toUpperCase()).maybeSingle();
  if (!room) throw new Error('No discussion room found with that ID');
  const { error } = await supabase.from('discussion_room_members').upsert({ room_id: room.id, user_id: state.session.user.id });
  if (error) throw error;
  return room;
}
async function loadDiscussionRoomMembers(roomId){
  const { data } = await supabase.from('discussion_room_members').select('*, profiles(username,name,avatar_url,role)').eq('room_id', roomId).order('joined_at');
  return data || [];
}
async function toggleRaiseHand(roomId, raised){
  const { error } = await supabase.from('discussion_room_members').update({ hand_raised: raised, hand_raised_at: raised ? new Date().toISOString() : null }).eq('room_id', roomId).eq('user_id', state.session.user.id);
  if (error) throw error;
}
async function loadHandQueue(roomId){
  const { data } = await supabase.from('discussion_room_members').select('*, profiles(username,name,avatar_url)').eq('room_id', roomId).eq('hand_raised', true).order('hand_raised_at');
  return data || [];
}

/* -- teacher management -- */
async function appointTeacher(roomId, userId){
  const { error } = await supabase.from('discussion_rooms').update({ teacher_id: userId }).eq('id', roomId);
  if (error) throw error;
  // make sure the newly-appointed teacher is also a room member
  await supabase.from('discussion_room_members').upsert({ room_id: roomId, user_id: userId });
  createNotification(userId, 'teacher_appointed', '👨‍🏫 You have been appointed as teacher of a discussion room.');
}
async function removeTeacher(roomId){
  const { error } = await supabase.from('discussion_rooms').update({ teacher_id: null }).eq('id', roomId);
  if (error) throw error;
}
async function searchUsersByName(query){
  if (!query || query.length < 2) return [];
  const { data } = await supabase.from('profiles').select('id,username,name,avatar_url').or(`username.ilike.%${query}%,name.ilike.%${query}%`).limit(8);
  return data || [];
}

/* -- topics -- */
async function createDiscussionTopic(roomId, fields){
  // A new topic replaces the old "active" one so there's always exactly one
  // topic on the board at a time, matching the single big Topic Board in the UI.
  await supabase.from('discussion_topics').update({ is_active:false }).eq('room_id', roomId).eq('is_active', true);
  const { error } = await supabase.from('discussion_topics').insert({
    room_id: roomId, title: fields.title, description: fields.description || null,
    subject_id: fields.subjectId || null, difficulty: fields.difficulty || 'medium',
    discussion_minutes: fields.minutes || 20, image_url: fields.imageUrl || null,
    file_url: fields.fileUrl || null, created_by: state.session.user.id,
  });
  if (error) throw error;
}
async function loadActiveTopic(roomId){
  const { data } = await supabase.from('discussion_topics').select('*').eq('room_id', roomId).eq('is_active', true).order('created_at',{ ascending:false }).limit(1).maybeSingle();
  return data || null;
}

/* -- rounds -- */
const ROUND_TYPE_QUESTIONS = {
  knowledge: 'What do you already know about this topic?',
  thinking: 'What do you think is the biggest problem related to this topic?',
  advice: 'What solution or advice would you give?',
  challenge: 'Harder follow-up — explain your reasoning, not just your answer.',
  final: 'What did you learn from this discussion?',
};
async function createDiscussionRound(roomId, topicId, roundType, customQuestion, timerSeconds){
  const { count } = await supabase.from('discussion_rounds').select('id', { count:'exact', head:true }).eq('room_id', roomId);
  const { data, error } = await supabase.from('discussion_rounds').insert({
    room_id: roomId, topic_id: topicId, round_number: (count||0)+1, round_type: roundType,
    question: customQuestion || ROUND_TYPE_QUESTIONS[roundType] || 'Share your thoughts.',
    timer_seconds: timerSeconds || 60, created_by: state.session.user.id,
  }).select().single();
  if (error) throw error;
  return data;
}
async function startDiscussionRound(roundId, participantId){
  const { error } = await supabase.from('discussion_rounds').update({ status:'active', started_at:new Date().toISOString(), current_participant_id: participantId || null }).eq('id', roundId);
  if (error) throw error;
}
async function selectRoundParticipant(roundId, participantId){
  const { error } = await supabase.from('discussion_rounds').update({ current_participant_id: participantId }).eq('id', roundId);
  if (error) throw error;
  if (participantId) createNotification(participantId, 'your_turn', "✋ It's your turn — you have been selected to answer.");
}
async function endDiscussionRound(roundId){
  const { error } = await supabase.from('discussion_rounds').update({ status:'ended', ended_at:new Date().toISOString() }).eq('id', roundId);
  if (error) throw error;
}
async function loadDiscussionRounds(roomId){
  const { data } = await supabase.from('discussion_rounds').select('*').eq('room_id', roomId).order('round_number');
  return data || [];
}

/* -- answers & scoring -- */
async function submitDiscussionAnswer(roundId, content, timeTakenSeconds){
  const { data, error } = await supabase.from('discussion_answers').insert({
    round_id: roundId, user_id: state.session.user.id, content, time_taken_seconds: timeTakenSeconds || null,
  }).select().single();
  if (error) throw error;
  return data;
}
async function scoreDiscussionAnswer(answerId, scores){
  // Server-side trigger clamps every value to 0-10 (0-20 for bonus) and
  // stamps evaluated_by/at — whatever we send here is a *request*, not the
  // final truth (see protect_discussion_answer_scores in schema.sql).
  const { data, error } = await supabase.from('discussion_answers').update({
    knowledge_score: scores.knowledge, reasoning_score: scores.reasoning, creativity_score: scores.creativity,
    relevance_score: scores.relevance, communication_score: scores.communication, bonus_points: scores.bonus || 0,
    feedback: scores.feedback || null,
  }).eq('id', answerId).select().single();
  if (error) throw error;
  createNotification(data.user_id, 'answer_scored', `🧠 Your answer received ${data.total_score} points.`);
  return data;
}
async function loadAnswersForRound(roundId){
  const { data } = await supabase.from('discussion_answers').select('*, profiles(username,name,avatar_url)').eq('round_id', roundId).order('submitted_at');
  return data || [];
}

/* -- leaderboard (always computed live from real answers, never stored) -- */
async function loadDiscussionLeaderboard(roomId){
  const { data } = await supabase.from('discussion_answers').select('user_id, total_score, content, profiles(username,name,avatar_url), discussion_rounds!inner(room_id)').eq('discussion_rounds.room_id', roomId);
  const byUser = {};
  (data||[]).forEach(a=>{
    const u = byUser[a.user_id] ||= { user_id:a.user_id, profile:a.profiles, total:0, count:0, best:0 };
    u.total += a.total_score || 0; u.count += 1; u.best = Math.max(u.best, a.total_score||0);
  });
  return Object.values(byUser).sort((a,b)=>b.total-a.total);
}

/* -- polls -- */
async function createDiscussionPoll(roomId, question, options){
  const { data: poll, error } = await supabase.from('discussion_polls').insert({ room_id: roomId, question, created_by: state.session.user.id }).select().single();
  if (error) throw error;
  const rows = options.map((label,i)=>({ poll_id: poll.id, label, position:i }));
  const { error: optErr } = await supabase.from('discussion_poll_options').insert(rows);
  if (optErr) throw optErr;
  return poll;
}
async function voteOnPoll(pollId, optionId){
  const { error } = await supabase.from('discussion_poll_votes').upsert({ poll_id: pollId, option_id: optionId, user_id: state.session.user.id });
  if (error) throw error;
}
async function loadActivePolls(roomId){
  const { data: polls } = await supabase.from('discussion_polls').select('*, discussion_poll_options(*)').eq('room_id', roomId).eq('is_active', true).order('created_at',{ ascending:false });
  const withVotes = [];
  for (const poll of (polls||[])){
    const { data: votes } = await supabase.from('discussion_poll_votes').select('option_id, user_id').eq('poll_id', poll.id);
    withVotes.push({ ...poll, votes: votes || [] });
  }
  return withVotes;
}

/* -- discussion chat (same shape as study-room chat) -- */
async function loadDiscussionMessages(roomId){
  const { data } = await supabase.from('discussion_messages').select('*, profiles(username,name,avatar_url,role)').eq('room_id', roomId).order('created_at',{ ascending:true }).limit(150);
  state.discussionMessages = data || [];
}
async function sendDiscussionMessage(roomId, content){
  const { data, error } = await supabase.from('discussion_messages').insert({ room_id: roomId, sender_id: state.session.user.id, content }).select('*, profiles(username,name,avatar_url,role)').single();
  if (error) throw error;
  return data;
}
async function pinDiscussionMessage(messageId, pinned){
  const { error } = await supabase.from('discussion_messages').update({ pinned }).eq('id', messageId);
  if (error) throw error;
}
function subscribeDiscussionChannel(roomId){
  if (state.discussionChannel) supabase.removeChannel(state.discussionChannel);
  state.discussionChannel = supabase.channel('discussion-'+roomId)
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'discussion_messages', filter:`room_id=eq.${roomId}` }, async payload => {
      if (state.discussionMessages.some(m=>m.id===payload.new.id)) return;
      const { data: prof } = await supabase.from('profiles').select('username,name,avatar_url,role').eq('id', payload.new.sender_id).single();
      state.discussionMessages.push({ ...payload.new, profiles: prof });
      if (state.view==='discussion' && state.activeDiscussionRoomId===roomId && state.discussionTab==='discussion') drawDiscussionMessages();
    })
    .on('postgres_changes', { event:'*', schema:'public', table:'discussion_rounds', filter:`room_id=eq.${roomId}` }, async () => {
      state.discussionRounds = await loadDiscussionRounds(roomId);
      if (state.view==='discussion' && state.activeDiscussionRoomId===roomId && state.discussionTab==='rounds') switchDiscussionTab('rounds');
    })
    .subscribe();
}

/* -- achievements -- */
async function awardDiscussionWinners(roomId){
  const { error } = await supabase.rpc('award_discussion_winners', { p_room_id: roomId });
  if (error) throw error;
  const achievements = await loadRoomAchievements(roomId);
  achievements.forEach(a=>{
    createNotification(a.user_id, 'discussion_award', `🏆 You won ${AWARD_LABELS[a.award_type]?.label || a.award_type} in a discussion room!`);
  });
}
async function loadRoomAchievements(roomId){
  const { data } = await supabase.from('discussion_achievements').select('*, profiles(username,name,avatar_url)').eq('room_id', roomId).order('awarded_at',{ ascending:false });
  return data || [];
}
async function loadMyAchievements(){
  if (!state.session) return [];
  const { data } = await supabase.from('discussion_achievements').select('*').eq('user_id', state.session.user.id).order('awarded_at',{ ascending:false });
  return data || [];
}
const AWARD_LABELS = {
  champion:{ label:'Discussion Champion', emoji:'🏆' }, best_thinker:{ label:'Best Thinker', emoji:'🧠' },
  most_creative:{ label:'Most Creative', emoji:'💡' }, knowledge_master:{ label:'Knowledge Master', emoji:'📚' },
  best_communicator:{ label:'Best Communicator', emoji:'🗣' }, helpful_student:{ label:'Helpful Student', emoji:'🤝' },
};
const MEDAL_EMOJI = { bronze:'🥉', silver:'🥈', gold:'🥇', champion:'🏆', master_thinker:'🌟' };

async function renderRooms(){
  const el = document.getElementById('view-rooms');
  if (!state.session){ el.innerHTML = `<div class="empty"><p>Log in to use Study Rooms.</p></div>`; return; }
  if (state.activeRoomId){ await renderRoomChat(el); return; }
  el.innerHTML = `
    <div class="section-head"><h2>Study Rooms</h2></div>
    <p style="font-size:12px;color:var(--ink-faint);margin:-10px 0 16px;">Study together in real time, video call, and play music together. Every room has its own 6-digit number — share it with friends.</p>
    <div class="room-join-bar">
      <button class="btn btn-primary btn-sm" id="createRoomBtn">${ICONS.plus} Create a room</button>
      <div class="room-join-input">
        <span>#</span>
        <input id="joinCodeInput" placeholder="Enter room number" maxlength="6" inputmode="numeric">
      </div>
      <button class="btn btn-secondary btn-sm" id="joinCodeBtn">Join</button>
    </div>
    <div id="roomsList" class="room-grid"></div>
  `;
  document.getElementById('createRoomBtn').addEventListener('click', openCreateRoomModal);
  document.getElementById('joinCodeBtn').addEventListener('click', async ()=>{
    const code = document.getElementById('joinCodeInput').value.trim();
    if (code.length !== 6){ toast('Enter the 6-digit room number'); return; }
    try{
      await joinRoomByCode(code);
      await loadMyRooms();
      renderRoute();
      toast('Joined the room');
    }catch(err){
      if (err.needsAccess) openRequestAccessModal(err.room);
      else toast(err.message);
    }
  });
  const list = el.querySelector('#roomsList');
  const isAdmin = state.profile?.role === 'admin';
  const banners = ['rb-indigo','rb-amber','rb-green','rb-coral','rb-grape'];
  list.innerHTML = state.rooms.length ? state.rooms.map((r,i)=>{
    const isHost = r.created_by === state.session.user.id;
    const banner = banners[i % banners.length];
    return `
    <div class="room-card ${r.is_premium?'room-card-vip':''}" data-room="${r.id}">
      <div class="room-card-banner ${banner}">
        ${r.is_premium ? `<span class="room-vip-badge">${ICONS.crown} VIP</span>` : ''}
        ${r.locked ? `<span class="room-vip-badge" style="color:var(--red);">🔒 Locked</span>` : ''}
        <span class="room-card-emoji">📚</span>
      </div>
      <div class="room-card-body">
        <p class="room-card-title">${esc(r.name)}</p>
        <div class="room-card-code">#${r.room_code}</div>
        <p class="room-card-meta">${isHost ? 'You host this room' : (r.is_premium ? `₹${r.price}/month` : 'Free room')}</p>
        <div class="room-card-actions">
          <button class="btn btn-primary btn-sm" data-enter-room="${r.id}" style="flex:1;justify-content:center;">Enter</button>
          ${(isAdmin||isHost) ? `<button class="btn btn-secondary btn-sm" data-manage-room="${r.id}">Manage</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('') : `<div class="empty"><p>No rooms yet. Create one or join with a number.</p></div>`;
  list.querySelectorAll('[data-enter-room]').forEach(b=>b.addEventListener('click', async ()=>{
    state.activeRoomId = b.dataset.enterRoom;
    await loadRoomMessages(state.activeRoomId);
    subscribeRoomChannel(state.activeRoomId);
    await loadNowPlaying(state.activeRoomId);
    subscribeNowPlaying(state.activeRoomId);
    renderRoute();
  }));
  list.querySelectorAll('[data-manage-room]').forEach(b=>b.addEventListener('click', async e=>{
    e.stopPropagation();
    const room = state.rooms.find(r=>r.id===b.dataset.manageRoom);
    await openManageRoomModal(room);
  }));
}
async function openCreateRoomModal(){
  const isAdmin = state.profile?.role === 'admin';
  let codes = [];
  let mine = [];
  try{ codes = await fetchAvailableRoomCodes(); }catch(e){ codes = []; }
  try{ mine = await fetchMyAssignedRoomCodes(); }catch(e){ mine = []; }
  const reserved = codes.filter(c=>c.is_admin_reserved);
  const vip = codes.filter(c=>!c.is_admin_reserved);
  const vipLabel = c => (!isAdmin && Number(c.price) > 0) ? `₹${c.price} one-time · paid, assigned by admin` : `+₹${c.price} one-time`;
  openModal(`
    <div class="modal">
      <h3>Create a study room</h3>
      <label>Room name</label><input id="mrName" placeholder="e.g. NEET Biology Group">
      <label style="margin-top:10px;">Room number</label>
      <select id="mrCode">
        <option value="">🎲 Random 6-digit number (free)</option>
        ${isAdmin ? reserved.map(c=>`<option value="${c.code}">👑 ${c.code} — Admin reserved</option>`).join('') : ''}
        ${mine.map(c=>`<option value="${esc(c.code)}">✅ ${esc(c.code)} — Your VIP number</option>`).join('')}
        ${vip.map(c=>`<option value="${c.code}">✨ ${c.code} — VIP number (${vipLabel(c)})</option>`).join('')}
      </select>
      ${isAdmin ? `
        <label style="display:flex;align-items:center;gap:8px;margin-top:10px;"><input type="checkbox" id="mrPremium" style="width:auto;margin:0;"> VIP room (you set the monthly price, subscribers only)</label>
        <div id="mrPriceWrap" style="display:none;margin-top:8px;"><label>Price (₹ / month)</label><input id="mrPrice" type="number" min="0" step="1" placeholder="e.g. 99"></div>
        <p style="font-size:11.5px;color:var(--ink-faint);margin-top:6px;">As the host, you and other admins always join for free. You can also invite specific people in for free afterwards from "Manage room" — the price only applies to strangers joining by code.</p>
      ` : `
        <label style="margin-top:10px;">Monthly price for joiners (₹)</label>
        <input id="mrPrice" type="number" min="1" step="1" placeholder="e.g. 49" value="49">
        <p style="font-size:11.5px;color:var(--ink-faint);margin-top:6px;">You (the host) always join free, and you can invite specific friends in for free too — this monthly price only applies to strangers who join using your room's code.</p>
      `}
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelRoom">Cancel</button><button class="btn btn-primary" id="saveRoom">Create</button></div>
    </div>
  `);
  document.getElementById('cancelRoom').addEventListener('click', closeModal);
  document.getElementById('mrPremium')?.addEventListener('change', e=>{
    document.getElementById('mrPriceWrap').style.display = e.target.checked ? 'block' : 'none';
  });
  document.getElementById('saveRoom').addEventListener('click', async ()=>{
    const name = document.getElementById('mrName').value.trim();
    if (!name){ toast('Give the room a name'); return; }
    const isPremium = document.getElementById('mrPremium')?.checked || false;
    const price = document.getElementById('mrPrice')?.value || 0;
    const vipCode = document.getElementById('mrCode').value || null;
    if (!isAdmin && Number(price) <= 0){ toast('Set a price of at least ₹1 for your room'); return; }
    try{
      const room = await createStudyRoom(name, isPremium, price, vipCode);
      closeModal();
      toast(`Room created — number: ${room.room_code}`);
      await loadMyRooms();
      renderRoute();
    }catch(err){ toast(err.message || 'Could not create room'); }
  });
}
function openRequestAccessModal(room){
  openModal(`
    <div class="modal">
      <h3>${ICONS.crown} VIP room</h3>
      <p style="font-size:13.5px;color:var(--ink-soft);">"${esc(room.name)}" is a paid room${room.price>0?` (₹${room.price}/month)`:''}. Send a request and the host will approve you once things are sorted.</p>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelReq">Cancel</button><button class="btn btn-primary" id="sendReq">Request access</button></div>
    </div>
  `);
  document.getElementById('cancelReq').addEventListener('click', closeModal);
  document.getElementById('sendReq').addEventListener('click', async ()=>{
    try{
      await requestRoomAccess(room.id);
      closeModal();
      toast('Request sent — you\'ll be able to join once the host approves');
    }catch(err){ toast(err.message || 'Could not send request'); }
  });
}
async function inviteUserToRoom(roomId, username){
  const { data: target } = await supabase.from('profiles').select('id').eq('username', username.trim()).maybeSingle();
  if (!target) throw new Error('No user found with that username');
  const { error } = await supabase.from('study_room_members').upsert({ room_id: roomId, user_id: target.id });
  if (error) throw error;
}
async function openManageRoomModal(room){
  await loadRoomAccessRequests(room.id);
  const reqs = state.roomAccessRequests;
  const subscriptions = await loadRoomSubscriptions(room.id);
  const allMembers = await loadAllRoomMembers(room.id);
  const bans = await loadRoomBans(room.id);
  const myId = state.session.user.id;
  openModal(`
    <div class="modal">
      <h3>Manage "${esc(room.name)}"</h3>
      <p style="font-size:12px;color:var(--ink-faint);margin:-4px 0 12px;">Room number: <strong style="color:var(--ink);">#${room.room_code}</strong></p>
      <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="mgLocked" style="width:auto;margin:0;" ${room.locked?'checked':''}> 🔒 Lock room (no new joins right now)</label>
      <label style="display:flex;align-items:center;gap:8px;margin-top:8px;"><input type="checkbox" id="mgPremium" style="width:auto;margin:0;" ${room.is_premium?'checked':''}> VIP room</label>
      <div id="mgPriceWrap" style="display:${room.is_premium?'block':'none'};margin-top:8px;"><label>Price (₹ / month)</label><input id="mgPrice" type="number" min="0" step="1" value="${room.price||0}"></div>
      <label style="margin-top:10px;">Pinned message (shown at the top of the chat)</label>
      <input id="mgPinned" placeholder="e.g. Today's syllabus: Chapter 4" value="${esc(room.pinned_message||'')}">
      <div style="height:1px;background:var(--hair);margin:14px 0;"></div>
      <p style="font-size:12px;font-weight:600;margin:0 0 6px;">Invite someone directly (always free, even in a VIP room)</p>
      <div style="display:flex;gap:8px;">
        <input id="mgInviteUsername" placeholder="Their username">
        <button class="btn btn-secondary btn-sm" id="mgInviteBtn">Invite</button>
      </div>
      <p style="font-size:12px;font-weight:600;margin:14px 0 6px;">Members (${allMembers.length})</p>
      <div style="max-height:200px;overflow-y:auto;">
        ${allMembers.map(m=>{
          const isMe = m.user_id === myId;
          const isRoomHost = m.user_id === room.created_by;
          return `<div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:6px 0;border-bottom:1px solid var(--hair);flex-wrap:wrap;">
            <span style="font-size:13px;min-width:0;word-break:break-word;">${esc(m.profiles?.name || m.profiles?.username || 'Student')} ${isRoomHost?'<span class="tag" style="background:var(--amber-soft);color:#7A5410;">Host</span>':m.co_host?'<span class="tag">Co-Host</span>':''}</span>
            ${(!isMe && !isRoomHost) ? `<span style="display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" data-cohost="${m.user_id}" data-current="${m.co_host}">${m.co_host?'Remove co-host':'Make co-host'}</button>
              <button class="btn btn-secondary btn-sm" data-remove="${m.user_id}">Remove</button>
              <button class="btn btn-danger btn-sm" data-block="${m.user_id}">Block</button>
            </span>` : ''}
          </div>`;
        }).join('')}
      </div>
      ${reqs.length ? `
        <p style="font-size:12px;font-weight:600;margin:14px 0 6px;">Pending access requests</p>
        <div style="max-height:160px;overflow-y:auto;">
          ${reqs.map(r=>`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--hair);flex-wrap:wrap;">
              <span style="font-size:13px;min-width:0;word-break:break-word;">${esc(r.profiles?.name || r.profiles?.username || 'Student')}</span>
              <span style="display:flex;gap:6px;flex-shrink:0;">
                <button class="btn btn-secondary btn-sm" data-reject="${r.id}">Reject</button>
                <button class="btn btn-primary btn-sm" data-approve="${r.id}">Approve</button>
              </span>
            </div>`).join('')}
        </div>
      ` : ''}
      ${room.is_premium && subscriptions.length ? `
        <p style="font-size:12px;font-weight:600;margin:14px 0 6px;">Subscribers</p>
        <div style="max-height:160px;overflow-y:auto;">
          ${subscriptions.map(m=>{
            const expired = m.expires_at && new Date(m.expires_at) < new Date();
            const daysLeft = m.expires_at ? Math.ceil((new Date(m.expires_at) - new Date())/86400000) : null;
            return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--hair);flex-wrap:wrap;">
              <span style="font-size:13px;min-width:0;word-break:break-word;">${esc(m.profiles?.name || m.profiles?.username || 'Student')}</span>
              <span style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <span style="font-size:11px;color:${expired?'var(--red)':'var(--ink-faint)'};">${expired ? 'Expired' : `${daysLeft}d left`}</span>
                <button class="btn btn-secondary btn-sm" data-renew="${m.id}">Renew 30d</button>
              </span>
            </div>`;
          }).join('')}
        </div>
      ` : ''}
      ${bans.length ? `
        <p style="font-size:12px;font-weight:600;margin:14px 0 6px;">Blocked users</p>
        <div style="max-height:160px;overflow-y:auto;">
          ${bans.map(b=>`
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--hair);flex-wrap:wrap;">
              <span style="font-size:13px;min-width:0;word-break:break-word;">${esc(b.profiles?.name || b.profiles?.username || 'Student')}</span>
              <button class="btn btn-secondary btn-sm" data-unban="${b.user_id}">Unblock</button>
            </div>`).join('')}
        </div>
      ` : ''}
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelMg">Close</button><button class="btn btn-primary" id="saveMg">Save changes</button></div>
    </div>
  `);
  document.getElementById('cancelMg').addEventListener('click', closeModal);
  document.getElementById('mgPremium').addEventListener('change', e=>{
    document.getElementById('mgPriceWrap').style.display = e.target.checked ? 'block' : 'none';
  });
  document.getElementById('mgLocked').addEventListener('change', async e=>{
    const wantLocked = e.target.checked;
    e.target.disabled = true;
    try{
      await toggleRoomLock(room.id, wantLocked);
      toast(wantLocked ? 'Room locked — no new joins' : 'Room unlocked');
    }catch(err){
      e.target.checked = !wantLocked; // restore correct UI state on failure
      toast(err.message || 'Could not update the lock — try again');
    }
    e.target.disabled = false;
  });
  document.querySelectorAll('[data-cohost]').forEach(b=>b.addEventListener('click', async ()=>{
    try{
      await setCoHost(room.id, b.dataset.cohost, b.dataset.current !== 'true');
      toast(b.dataset.current !== 'true' ? 'Made co-host' : 'Co-host removed');
    }catch(err){ toast(err.message || 'Could not update co-host'); }
    await openManageRoomModal(room);
  }));
  document.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click', async ()=>{
    if (!confirm('Remove this person from the room?')) return;
    try{
      await removeMember(room.id, b.dataset.remove);
      toast('Removed from room');
    }catch(err){ toast(err.message || 'Could not remove that member'); }
    await openManageRoomModal(room);
  }));
  document.querySelectorAll('[data-block]').forEach(b=>b.addEventListener('click', async ()=>{
    if (!confirm('Block this person? They will not be able to rejoin with the room code.')) return;
    try{
      await banMember(room.id, b.dataset.block);
      toast('Blocked from room');
    }catch(err){ toast(err.message || 'Could not block that member'); }
    await openManageRoomModal(room);
  }));
  document.querySelectorAll('[data-approve],[data-reject]').forEach(b=>b.addEventListener('click', async ()=>{
    const req = reqs.find(r=>r.id === (b.dataset.approve || b.dataset.reject));
    try{
      await resolveRoomAccessRequest(req, !!b.dataset.approve);
      toast(b.dataset.approve ? 'Access approved for 30 days' : 'Request rejected');
    }catch(err){ toast(err.message || 'Could not process that request'); }
    await openManageRoomModal(room);
  }));
  document.querySelectorAll('[data-renew]').forEach(b=>b.addEventListener('click', async ()=>{
    try{
      await renewRoomAccess(b.dataset.renew);
      toast('Subscription renewed for 30 days');
    }catch(err){ toast(err.message || 'Could not renew — try again'); }
    await openManageRoomModal(room);
  }));
  document.querySelectorAll('[data-unban]').forEach(b=>b.addEventListener('click', async ()=>{
    try{
      await unbanMember(room.id, b.dataset.unban);
      toast('Unblocked — they can request access again');
    }catch(err){ toast(err.message || 'Could not unblock that user'); }
    await openManageRoomModal(room);
  }));
  document.getElementById('mgInviteBtn').addEventListener('click', async ()=>{
    const username = document.getElementById('mgInviteUsername').value.trim();
    if (!username) return;
    try{ await inviteUserToRoom(room.id, username); toast(`${username} added to the room for free`); document.getElementById('mgInviteUsername').value=''; }
    catch(err){ toast(err.message); }
  });
  document.getElementById('saveMg').addEventListener('click', async e=>{
    const btn = e.target;
    const isPremium = document.getElementById('mgPremium').checked;
    const price = document.getElementById('mgPrice')?.value || 0;
    const pinnedMessage = document.getElementById('mgPinned').value.trim();
    btn.disabled = true; btn.textContent = 'Saving...';
    try{
      await updateRoomSettings(room.id, { isPremium, price, pinnedMessage });
      closeModal();
      await loadMyRooms();
      renderRoute();
      toast('Room updated');
    }catch(err){
      btn.disabled = false; btn.textContent = 'Save changes';
      toast(err.message || 'Only admins can set a price');
    }
  });
}
async function renderRoomChat(el){
  const room = state.rooms.find(r=>r.id===state.activeRoomId);
  if (!room){ state.activeRoomId = null; return renderRooms(); }
  const isAdmin = state.profile?.role === 'admin';
  const isHost = room.created_by === state.session.user.id;
  const members = await loadAllRoomMembers(room.id);
  state.roomMembersFull = members;
  const studyTeacher = await loadStudyRoomTeacher(room.id);
  room.teacher_id = studyTeacher?.teacher_id || null;
  room.teacher_type = studyTeacher?.teacher_type || null;
  room.bot_teacher_id = studyTeacher?.bot_teacher_id || null;
  const canControl = canControlBoard(room);
  const board = await loadRoomBoard(room.id);
  state.roomTab = BOARD_TABS.includes(board?.active_tab) ? board.active_tab : 'whiteboard';
  const controllerName = studyTeacher?.teacher_id ? 'Teacher' : 'Host';

  el.innerHTML = `
    <div class="room-dark">
      <div class="rd-header">
        <button class="rd-icon-btn" id="backToRooms">${ICONS.back}</button>
        <div class="rd-title">
          <p class="rd-name"><span class="rd-live-dot"></span>${esc(room.name)} ${room.is_premium?`<span class="rd-vip-pill">${ICONS.crown} VIP</span>`:''}${room.locked?`<span class="rd-locked-pill">🔒 Locked</span>`:''}</p>
          <p class="rd-sub">Room #${room.room_code} · ${members.length} studying together${studyTeacher?.teacher_type==='bot' && getBotTeacher(studyTeacher.bot_teacher_id) ? ' · 🤖 '+esc(getBotTeacher(studyTeacher.bot_teacher_id).name) : (studyTeacher?.teacher_id ? ' · 👨‍🏫 Teacher' : '')}</p>
        </div>
        <div class="rd-header-actions">
          <span class="rd-timer" id="roomTimer" title="Time in this room">${ICONS.timer} 00:00</span>
          ${(isAdmin||isHost) ? `<button class="rd-icon-btn" id="manageRoomBtn" title="Manage room">${ICONS.admin}</button>` : ''}
          <button class="rd-leave-btn" id="leaveRoomBtn">Leave Room</button>
        </div>
      </div>
      ${room.pinned_message ? `<div class="rd-pinned"><span>📌</span><p>${esc(room.pinned_message)}</p></div>` : ''}
      <div class="rd-body">
        <div class="rd-main">
          <div class="rd-board ${canControl ? 'is-controller' : 'is-viewer'}">
            <div class="rd-board-bar">
              <div class="rd-board-tabs">
                <button class="rd-tab" data-rtab="whiteboard" ${canControl?'':'disabled'}><span class="rd-tab-icon">🖊</span>Whiteboard</button>
                <button class="rd-tab" data-rtab="notes" ${canControl?'':'disabled'}><span class="rd-tab-icon">📝</span>Notes</button>
                <button class="rd-tab" data-rtab="music" ${canControl?'':'disabled'}><span class="rd-tab-icon">🎵</span>Music</button>
                <button class="rd-tab" data-rtab="tasks" ${canControl?'':'disabled'}><span class="rd-tab-icon">✅</span>Tasks</button>
                <button class="rd-tab" data-rtab="teacher" ${canControl?'':'disabled'}><span class="rd-tab-icon">👨‍🏫</span>Teacher</button>
              </div>
              <span class="rd-board-status">${canControl ? '🎓 Aap board chala rahe ho — sabko yahi dikhega' : `👀 ${controllerName} board chala rahe hain`}</span>
            </div>
            <div id="rdTabBody" class="rd-board-screen"></div>
          </div>
        </div>
        <div class="rd-side">
          <div class="rd-call-strip rd-class-video" id="rdCallStrip"></div>
          <div class="rd-chat-block">
            <div class="rd-chat-head">
              <p class="rd-side-title">Room Chat</p>
              <details class="rd-people-toggle">
                <summary>👥 ${members.length}</summary>
                <div class="rd-people-pop">
                  <p class="rd-side-title">Participants (${members.length})</p>
                  <div id="rdParticipants"></div>
                </div>
              </details>
            </div>
            <div id="roomMessages" class="rd-messages"></div>
            <div class="rd-composer">
              <button class="rd-file-btn" id="roomFileBtn" title="Attach a file">${ICONS.plus}</button>
              <input type="file" id="roomFileInput" accept=".pdf,image/*,.doc,.docx,.ppt,.pptx" style="display:none;">
              <textarea rows="1" id="roomInput" placeholder="Message the room..."></textarea>
              <button class="rd-send-btn" id="roomSend">${ICONS.send}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  drawRoomMessages();
  renderCallStrip(document.getElementById('rdCallStrip'), room, 'study', { inline:true });
  renderParticipantsList(members, room);

  const timerEl = document.getElementById('roomTimer');
  const roomEnteredAt = Date.now();
  state.roomTimerInterval = setInterval(()=>{
    if (!timerEl) return;
    const s = Math.floor((Date.now()-roomEnteredAt)/1000);
    const hh = Math.floor(s/3600), mm = Math.floor((s%3600)/60), ss = s%60;
    const pad = n=>String(n).padStart(2,'0');
    timerEl.innerHTML = `${ICONS.timer} ${hh>0 ? pad(hh)+':' : ''}${pad(mm)}:${pad(ss)}`;
  }, 1000);

  el.querySelector('#backToRooms').addEventListener('click', leaveRoomView);
  el.querySelector('#leaveRoomBtn').addEventListener('click', leaveRoomView);
  function leaveRoomView(){ stopNoise(); if (state.call.active) endCall(); if (state.whiteboardChannel) supabase.removeChannel(state.whiteboardChannel); if (state.notesChannel) supabase.removeChannel(state.notesChannel); if (state.tasksChannel) supabase.removeChannel(state.tasksChannel); if (state.boardChannel){ supabase.removeChannel(state.boardChannel); state.boardChannel = null; } if (state.roomTimerInterval) clearInterval(state.roomTimerInterval); state.activeRoomId = null; renderRoute(); }
  el.querySelector('#manageRoomBtn')?.addEventListener('click', ()=>openManageRoomModal(room));

  // Only controllers can change what the board shows; the change is saved
  // so every student's board follows along via subscribeRoomBoard.
  if (canControl){
    el.querySelectorAll('.rd-tab').forEach(b=>b.addEventListener('click', async ()=>{
      const tab = b.dataset.rtab;
      switchRoomTab(tab, room);
      try{ await setRoomBoardTab(room.id, tab); }catch(err){ toast('Board sabke liye switch nahi hua — dobara try karo'); }
    }));
  }
  subscribeRoomBoard(room.id, tab=>switchRoomTab(tab, room));
  switchRoomTab(state.roomTab, room);

  el.querySelector('#roomFileBtn').addEventListener('click', ()=>el.querySelector('#roomFileInput').click());
  el.querySelector('#roomFileInput').addEventListener('change', async e=>{
    const file = e.target.files[0];
    if (!file) return;
    toast('Uploading file...');
    try{
      const url = await uploadRoomFile(file);
      await sendRoomMessage(room.id, `📎 ${file.name}\n${url}`);
    }catch(err){ toast(err.message || 'Could not upload file — check the "attachments" storage bucket'); }
    e.target.value = '';
  });
  el.querySelector('#roomSend').addEventListener('click', async ()=>{
    const inp = el.querySelector('#roomInput');
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    const tempId = 'temp-'+Date.now();
    const temp = { id: tempId, sender_id: state.session.user.id, room_id: room.id, content: val, created_at: new Date().toISOString(), profiles: state.profile, pending: true };
    state.roomMessages.push(temp);
    drawRoomMessages();
    try{
      const real = await sendRoomMessage(room.id, val);
      const i = state.roomMessages.findIndex(m=>m.id===tempId);
      if (i>-1) state.roomMessages[i] = real;
      drawRoomMessages();
    }catch(err){
      state.roomMessages = state.roomMessages.filter(m=>m.id!==tempId);
      drawRoomMessages();
      inp.value = val;
      toast('Message failed to send — try again');
    }
  });
}
function renderParticipantsList(members, room){
  const wrap = document.getElementById('rdParticipants');
  if (!wrap) return;
  wrap.innerHTML = members.map(m=>{
    const prof = m.profiles || {};
    const inCall = m.user_id === state.session.user.id ? state.call.active : false; // presence of others in the Jitsi call isn't tracked in our own state
    const isRoomHost = m.user_id === room.created_by;
    return `<div class="rd-participant-row">
      <div class="avatar" style="width:24px;height:24px;font-size:10px;">${avatarInner(prof)}</div>
      <span>${esc(prof.name || prof.username || 'Member')}${roleBadge(prof)}</span>
      ${inCall ? `<span class="rd-participant-live" title="In the call">${ICONS.live}</span>` : ''}
      <span class="rd-participant-role">${isRoomHost ? 'Host' : ''}</span>
    </div>`;
  }).join('') || `<p style="font-size:12px;color:var(--rd-muted);margin:0;">No one here yet.</p>`;
}

function switchRoomTab(tab, room){
  state.roomTab = tab;
  document.querySelectorAll('.rd-tab').forEach(b=>b.classList.toggle('active', b.dataset.rtab===tab));
  const body = document.getElementById('rdTabBody');
  if (!body) return;
  const canControl = canControlBoard(room);
  if (tab==='music') renderMusicTab(body, room, canControl);
  else if (tab==='notes') renderNotesTab(body, room, canControl);
  else if (tab==='whiteboard') renderWhiteboardTab(body, room, canControl);
  else if (tab==='tasks') renderTasksTab(body, room, canControl);
  else if (tab==='teacher') renderRoomTeacherTab(body, room, state.roomMembersFull || [], { canManage: room.created_by === state.session.user.id || state.profile?.role === 'admin' });
}

// opts.inline: keep the call inside its panel (the study room's class-video
// column) instead of jumping to full screen; a button still offers full screen.
function renderCallStrip(body, room, roomType='study', opts={}){
  const inline = !!opts.inline;
  body.innerHTML = `
    <div class="call-panel ${inline ? 'call-panel-inline' : ''}" id="callPanelWrap">
      <button class="call-fs-close" id="callFsClose" title="Exit full screen">${ICONS.x}</button>
      <div class="call-panel-head">
        <p class="rd-panel-title">🎥 ${inline ? 'Class video' : 'Study call'}</p>
        <div style="display:flex;gap:6px;">
          ${inline ? `<button class="rd-btn btn-sm" id="callFsBtn" title="Full screen" style="display:none;">⛶</button>` : ''}
          <button class="rd-btn rd-btn-primary btn-sm" id="startCallBtn">Start / join</button>
          <button class="rd-btn rd-btn-danger btn-sm" id="leaveCallBtn" style="display:none;">Leave call</button>
        </div>
      </div>
      <div id="jitsiContainer" class="jitsi-container">${inline && !state.call.active ? `<div class="call-placeholder">📹<span>Class ki video call yahan dikhegi.<br>"Start / join" dabao.</span></div>` : ''}</div>
      <p class="rotate-hint">Tip: rotate your phone sideways for a full-screen view.</p>
    </div>
  `;
  renderCallButtons();
  body.querySelector('#startCallBtn').addEventListener('click', ()=>{
    if (!inline) setCallFullscreen(true);
    startCall(room.id, room, roomType);
  });
  body.querySelector('#callFsBtn')?.addEventListener('click', ()=>setCallFullscreen(true));
  body.querySelector('#leaveCallBtn')?.addEventListener('click', ()=>{ endCall(); setCallFullscreen(false); });
  body.querySelector('#callFsClose')?.addEventListener('click', ()=>setCallFullscreen(false));
}
async function setCallFullscreen(on){
  state.call.fullscreen = on;
  document.documentElement.classList.toggle('call-fullscreen', on);
  if (on){
    try{ await document.documentElement.requestFullscreen?.(); }catch(e){}
    try{ if (screen.orientation?.lock) await screen.orientation.lock('landscape'); }catch(e){}
  } else {
    try{ if (document.fullscreenElement) await document.exitFullscreen?.(); }catch(e){}
    try{ screen.orientation?.unlock?.(); }catch(e){}
  }
}
document.addEventListener('fullscreenchange', ()=>{
  if (!document.fullscreenElement && state.call.fullscreen){
    document.documentElement.classList.remove('call-fullscreen');
    state.call.fullscreen = false;
  }
});

function renderMusicTab(body, room, canControl){
  body.innerHTML = `
    <div class="rd-panel">
      <p class="rd-panel-title">Focus sounds</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
        <button class="rd-btn" data-noise="white">White noise</button>
        <button class="rd-btn" data-noise="pink">Rain-like</button>
        <button class="rd-btn" data-noise="brown">Deep hum</button>
        <button class="rd-btn" id="stopNoiseBtn">Stop</button>
      </div>
      <input type="range" id="noiseVolume" min="0" max="1" step="0.05" value="0.25" style="width:100%;">
    </div>
    <div class="rd-panel">
      <p class="rd-panel-title">🎵 Room jukebox</p>
      <div id="nowPlayingBox"></div>
      ${canControl ? `
      <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;">
        <input id="ytLinkInput" class="rd-input" placeholder="Paste a YouTube song link..." style="flex:1;min-width:160px;">
        <button class="rd-btn rd-btn-primary" id="playForRoomBtn">Play for room</button>
      </div>` : ''}
      <p style="font-size:11px;color:var(--rd-muted);margin-top:6px;">${canControl ? 'Aap song lagao — students "Join &amp; listen" dabakar sync ho jayenge.' : 'Song teacher/host lagate hain. "Join &amp; listen" dabakar sath suno.'}</p>
    </div>
  `;
  drawNowPlaying();
  body.querySelectorAll('[data-noise]').forEach(b=>b.addEventListener('click', ()=>playNoise(b.dataset.noise)));
  body.querySelector('#stopNoiseBtn').addEventListener('click', stopNoise);
  body.querySelector('#noiseVolume').addEventListener('input', e=>{ if (state.noise.gain) state.noise.gain.gain.value = Number(e.target.value); });
  body.querySelector('#playForRoomBtn')?.addEventListener('click', async ()=>{
    const inp = body.querySelector('#ytLinkInput');
    const val = inp.value.trim();
    if (!val) return;
    try{ await setNowPlaying(room.id, val); inp.value = ''; toast('Now playing for the room'); }
    catch(err){ toast(err.message || 'Could not queue that song'); }
  });
}

async function renderNotesTab(body, room, canControl){
  body.innerHTML = `
    <div class="rd-panel" style="height:100%;display:flex;flex-direction:column;">
      <p class="rd-panel-title">📝 ${canControl ? 'Board notes — aap jo likhoge, sabko live dikhega' : 'Board notes — teacher/host likh rahe hain'}</p>
      <textarea id="roomNotesArea" class="rd-notes-area" placeholder="${canControl ? 'Class ke notes yahan likho...' : 'Abhi tak kuch nahi likha gaya'}" ${canControl ? '' : 'readonly'}></textarea>
      ${canControl ? `<p id="notesSavedHint" style="font-size:11px;color:var(--rd-muted);margin-top:6px;">Saved automatically</p>` : ''}
    </div>
  `;
  const textarea = body.querySelector('#roomNotesArea');
  textarea.value = await loadRoomNotesText(room.id);
  subscribeRoomNotes(room.id, textarea);
  if (!canControl) return;
  textarea.addEventListener('input', ()=>{
    document.getElementById('notesSavedHint').textContent = 'Saving...';
    clearTimeout(notesSaveTimer);
    notesSaveTimer = setTimeout(async ()=>{
      await saveRoomNotesText(room.id, textarea.value);
      const hint = document.getElementById('notesSavedHint');
      if (hint) hint.textContent = 'Saved';
    }, 700);
  });
}

async function renderWhiteboardTab(body, room, canControl){
  body.innerHTML = `
    <div class="rd-panel rd-wb-panel" style="padding:10px;">
      ${canControl ? '' : '<p class="rd-panel-title" style="margin-bottom:8px;">🖊 Teacher/host board par likh rahe hain</p>'}
      <div class="rd-wb-toolbar" ${canControl ? '' : 'hidden'}>
        ${['#33E0FF','#B084F7','#FF5C8A','#FFD166','#5CFFB0','#FFFFFF'].map(c=>`<button class="rd-wb-color" data-color="${c}" style="background:${c};"></button>`).join('')}
        <input type="range" id="wbSize" min="1" max="12" value="3" style="width:70px;">
        <button class="rd-btn" id="wbEraser">Eraser</button>
        <button class="rd-btn rd-btn-danger" id="wbClear">Clear board</button>
      </div>
      <canvas id="whiteboardCanvas" width="1600" height="853" class="rd-whiteboard ${canControl ? '' : 'readonly'}"></canvas>
    </div>
  `;
  const canvas = body.querySelector('#whiteboardCanvas');
  const strokes = await loadWhiteboardStrokes(room.id);
  strokes.forEach(s=>drawStrokeOnCanvas(canvas, s));
  subscribeWhiteboard(room.id, canvas);
  if (!canControl) return;
  setupWhiteboardCanvas(canvas, room.id);
  body.querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click', ()=>{
    state.whiteboard.color = b.dataset.color;
    state.whiteboard.erasing = false;
    body.querySelectorAll('[data-color]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  }));
  body.querySelector('#wbSize').addEventListener('input', e=>{ state.whiteboard.size = Number(e.target.value); });
  body.querySelector('#wbEraser').addEventListener('click', e=>{ state.whiteboard.erasing = !state.whiteboard.erasing; e.target.classList.toggle('active', state.whiteboard.erasing); });
  body.querySelector('#wbClear').addEventListener('click', async ()=>{ await clearWhiteboard(room.id); });
}

async function renderTasksTab(body, room, canControl){
  state.roomTasks = await loadRoomTasks(room.id);
  subscribeRoomTasks(room.id, ()=>drawTasksList(body, canControl));
  body.innerHTML = `
    <div class="rd-panel">
      <p class="rd-panel-title">✅ ${canControl ? 'Class tasks' : 'Class tasks — teacher/host set karte hain'}</p>
      ${canControl ? `
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <input id="newTaskInput" class="rd-input" placeholder="Add a task, e.g. Finish Chapter 4" style="flex:1;">
        <button class="rd-btn rd-btn-primary" id="addTaskBtn">Add</button>
      </div>` : ''}
      <div id="tasksList"></div>
    </div>
  `;
  drawTasksList(body, canControl);
  if (!canControl) return;
  body.querySelector('#addTaskBtn').addEventListener('click', async ()=>{
    const inp = body.querySelector('#newTaskInput');
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    try{ await addRoomTask(room.id, val); }catch(e){ toast('Could not add task'); }
  });
}
function drawTasksList(body, canControl){
  const wrap = body.querySelector('#tasksList');
  if (!wrap) return;
  wrap.innerHTML = state.roomTasks.length ? state.roomTasks.map(t=>`
    <div class="rd-task-row">
      <label style="display:flex;align-items:center;gap:8px;flex:1;cursor:${canControl?'pointer':'default'};">
        <input type="checkbox" data-toggle-task="${t.id}" ${t.is_done?'checked':''} ${canControl?'':'disabled'}>
        <span style="${t.is_done?'text-decoration:line-through;color:var(--rd-muted);':''}">${esc(t.content)}</span>
      </label>
      ${canControl ? `<button class="rd-icon-btn small" data-del-task="${t.id}">${ICONS.x}</button>` : ''}
    </div>`).join('') : `<p style="font-size:12.5px;color:var(--rd-muted);">${canControl ? 'No tasks yet — add one above.' : 'Abhi koi task nahi diya gaya.'}</p>`;
  if (!canControl) return;
  wrap.querySelectorAll('[data-toggle-task]').forEach(cb=>cb.addEventListener('change', e=>toggleRoomTask(e.target.dataset.toggleTask, e.target.checked)));
  wrap.querySelectorAll('[data-del-task]').forEach(b=>b.addEventListener('click', ()=>deleteRoomTask(b.dataset.delTask)));
}

async function uploadRoomFile(file){
  validateUpload(file, ['pdf','png','jpg','jpeg','webp','doc','docx','ppt','pptx']);
  const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
  const path = `room-files/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
  const { error } = await supabase.storage.from('attachments').upload(path, file, { upsert:true });
  if (error) throw error;
  const { data } = supabase.storage.from('attachments').getPublicUrl(path);
  return data.publicUrl;
}
function drawRoomMessages(){
  const wrap = document.getElementById('roomMessages');
  if (!wrap) return;
  const myId = state.session?.user?.id;
  wrap.innerHTML = state.roomMessages.length ? chatBubblesHTML(state.roomMessages, myId, { idKey:'sender_id' }) : `<div class="empty"><p>No messages yet. Say hello to the room!</p></div>`;
  wrap.querySelectorAll('[data-viewprofile]').forEach(node=>node.addEventListener('click',()=>openUserProfileModal(node.dataset.viewprofile)));
  wrap.scrollTop = wrap.scrollHeight;
}
function drawNowPlaying(){
  const box = document.getElementById('nowPlayingBox');
  if (!box) return;
  const np = state.nowPlaying;
  if (!np){ box.innerHTML = `<p style="font-size:12px;color:var(--ink-faint);">No song playing yet — paste a link below.</p>`; return; }
  const by = np.profiles?.name || np.profiles?.username || 'someone';
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
      <p style="font-size:13px;margin:0;flex:1;min-width:0;word-break:break-word;">${esc(np.title)} <span style="color:var(--ink-faint);font-size:11.5px;">· added by ${esc(by)}</span></p>
      <button class="btn btn-primary btn-sm" id="joinListenBtn" style="flex-shrink:0;">▶ Join &amp; listen</button>
    </div>
    <div id="ytPlayerWrap" style="margin-top:10px;"></div>
  `;
  // Browsers only allow autoplay-with-sound right after a real tap/click, so
  // syncing happens on demand via this button rather than automatically —
  // that's also the moment we calculate how far into the song to jump to.
  box.querySelector('#joinListenBtn').addEventListener('click', ()=>{
    const elapsed = Math.max(0, Math.floor((Date.now() - new Date(np.started_at).getTime())/1000));
    box.querySelector('#ytPlayerWrap').innerHTML = `<iframe width="100%" height="180" style="border-radius:10px;border:none;display:block;" src="https://www.youtube.com/embed/${np.video_id}?start=${elapsed}&autoplay=1" title="${esc(np.title)}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  });
}


/* ---- Room Teachers: human + built-in AI teacher bots ---- */
const BUILTIN_TEACHERS = [
  { id:'atlas', name:'Atlas AI Teacher', subjects:'Science • Biology • Physics', icon:'🔬',
    intro:'I teach step-by-step and explain the reason behind the answer.' },
  { id:'arya', name:'Arya AI Teacher', subjects:'Mathematics • Reasoning', icon:'📐',
    intro:'I break problems into small steps and check the logic.' },
  { id:'nova', name:'Nova AI Teacher', subjects:'English • Languages', icon:'📚',
    intro:'I explain grammar, vocabulary and writing with examples.' },
  { id:'mentor', name:'Mentor AI Teacher', subjects:'General Study • Exams', icon:'🎓',
    intro:'I help with concepts, revision plans and exam-style questions.' }
];

function getBotTeacher(id){ return BUILTIN_TEACHERS.find(t=>t.id===id) || null; }

async function loadStudyRoomTeacher(roomId){
  const { data, error } = await supabase.from('study_rooms')
    .select('teacher_id,teacher_type,bot_teacher_id')
    .eq('id', roomId).maybeSingle();
  if (error) { console.warn('[teacher] study room teacher load failed', error); return null; }
  return data;
}

async function saveRoomTeacher(table, roomId, patch){
  const { error } = await supabase.from(table).update(patch).eq('id', roomId);
  if (error) throw error;
}

async function appointStudyTeacher(roomId, type, id){
  if (type === 'bot'){
    await saveRoomTeacher('study_rooms', roomId, { teacher_id:null, teacher_type:'bot', bot_teacher_id:id });
    return;
  }
  await saveRoomTeacher('study_rooms', roomId, { teacher_id:id, teacher_type:'human', bot_teacher_id:null });
  await supabase.from('study_room_members').upsert({room_id:roomId,user_id:id});
}

async function removeStudyTeacher(roomId){
  await saveRoomTeacher('study_rooms', roomId, { teacher_id:null, teacher_type:null, bot_teacher_id:null });
}

function teacherDisplay(room){
  if (room.teacher_type === 'bot' && getBotTeacher(room.bot_teacher_id)) return getBotTeacher(room.bot_teacher_id);
  if (room.teacher_id){
    const m = (state.roomMembersFull||[]).find(x=>x.user_id===room.teacher_id);
    if (m) return { id:m.user_id, name:m.profiles?.name||m.profiles?.username||'Teacher', subjects:'Appointed teacher', icon:'👨‍🏫', human:true };
  }
  return null;
}

function teacherAnswer(bot, question){
  const q = question.trim();
  if (!q) return 'Question likho — main step-by-step explain karunga.';
  const lower = q.toLowerCase();
  if (/(hello|hi|hey|namaste|नमस्ते)/i.test(lower))
    return `Namaste! Main ${bot.name} hoon. Apna topic ya question bhejo; main concept, example aur short revision point ke saath samjhaunga.`;
  if (/(formula|equation|solve|calculate|numerical|hisab)/i.test(lower))
    return `Chalo isse step-by-step karte hain:\n1) Given values/conditions likho.\n2) Relevant formula ya rule identify karo.\n3) Values substitute karo.\n4) Units/check aur final answer verify karo.\n\nExact numerical bhejoge to main usi question ke steps structure kar dunga.`;
  if (/(define|meaning|what is|kya hai|explain|samjha)/i.test(lower))
    return `Concept ko simple language mein samjho:\n• Definition: ${q}\n• Core idea: pehle basic principle identify karo.\n• Example: real-life/example case se relate karo.\n• Exam point: definition + key property + example revise karo.\n\nAgar tum subject aur class/exam bata do, explanation ko us level par tailor kiya ja sakta hai.`;
  return `Good question. Isko solve karne ke liye pehle question ke key facts identify karo, phir relevant concept/rule apply karo. Agar tum question ka exact text, subject aur class/exam bhej do, main step-by-step explanation aur practice question de sakta hoon.`;
}

function renderRoomTeacherTab(body, room, members, perms){
  const current = teacherDisplay(room);
  body.innerHTML = `
    <div class="rd-panel">
      <p class="rd-panel-title">👨‍🏫 Room Teacher</p>
      ${current ? `
        <div style="display:flex;align-items:center;gap:10px;padding:10px;border:1px solid var(--rd-border);border-radius:10px;">
          <div style="font-size:28px;">${current.icon||'👨‍🏫'}</div>
          <div style="flex:1"><b style="color:var(--rd-text)">${esc(current.name)}</b><div style="font-size:12px;color:var(--rd-muted);">${esc(current.subjects||'Teacher')}</div></div>
          ${perms.canManage ? `<button class="rd-btn rd-btn-danger btn-sm" id="removeRoomTeacher">Remove</button>` : ''}
        </div>` : `<p style="color:var(--rd-muted);font-size:13px;">No teacher appointed yet.</p>`}
    </div>
    ${perms.canManage ? `
    <div class="rd-panel">
      <p class="rd-panel-title">Appoint Human Teacher</p>
      <input id="roomTeacherSearch" class="rd-input" placeholder="Search by name or username..." style="width:100%;">
      <div id="roomTeacherResults" style="margin-top:10px;"></div>
    </div>
    <div class="rd-panel">
      <p class="rd-panel-title">🤖 Appoint AI Teacher Bot</p>
      <div style="display:grid;gap:8px;">
        ${BUILTIN_TEACHERS.map(b=>`<button class="rd-btn" data-bot-teacher="${b.id}" style="text-align:left;">
          ${b.icon} <b>${esc(b.name)}</b><br><small style="color:var(--rd-muted);margin-left:26px;">${esc(b.subjects)}</small>
        </button>`).join('')}
      </div>
    </div>` : ''}
    ${current && !current.human ? `
    <div class="rd-panel">
      <p class="rd-panel-title">💬 Ask ${esc(current.name)}</p>
      <textarea id="botQuestion" rows="3" class="rd-input" style="width:100%;resize:vertical;" placeholder="Apna sawaal likho..."></textarea>
      <button class="rd-btn rd-btn-primary" id="askBotBtn" style="margin-top:8px;">Ask Teacher</button>
      <div id="botAnswer" style="margin-top:12px;white-space:pre-wrap;color:var(--rd-text);font-size:13px;"></div>
    </div>` : ''}
  `;
  body.querySelector('#removeRoomTeacher')?.addEventListener('click', async()=>{
    try{
      if (room.id) {
        const isStudy = state.activeRoomId === room.id;
        if (isStudy) await removeStudyTeacher(room.id); else if (state.activeDiscussionRoomId === room.id) { const {error}=await supabase.from('discussion_rooms').update({teacher_id:null,teacher_type:null,bot_teacher_id:null}).eq('id',room.id); if(error) throw error; }
        room.teacher_id=null; room.teacher_type=null; room.bot_teacher_id=null;
        renderRoomTeacherTab(body, room, members, perms);
        toast('Teacher removed');
      }
    }catch(err){ toast(err.message||'Could not remove teacher'); }
  });
  body.querySelectorAll('[data-bot-teacher]').forEach(btn=>btn.addEventListener('click', async()=>{
    try{
      const botId=btn.dataset.botTeacher;
      if (state.activeRoomId === room.id) await appointStudyTeacher(room.id,'bot',botId);
      else if (state.activeDiscussionRoomId === room.id) { const {error}=await supabase.from('discussion_rooms').update({teacher_id:null,teacher_type:'bot',bot_teacher_id:botId}).eq('id',room.id); if(error) throw error; }
      room.teacher_id=null; room.teacher_type='bot'; room.bot_teacher_id=botId;
      renderRoomTeacherTab(body, room, members, perms);
      toast('AI teacher appointed');
    }catch(err){ toast(err.message||'Could not appoint AI teacher'); }
  }));
  const input=body.querySelector('#roomTeacherSearch');
  const results=body.querySelector('#roomTeacherResults');
  let timer;
  input?.addEventListener('input',()=>{
    clearTimeout(timer);
    timer=setTimeout(async()=>{
      const q=input.value.trim();
      if(q.length<2){results.innerHTML='';return;}
      const users=await searchUsersByName(q);
      results.innerHTML=users.map(u=>`<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--rd-border);">
        <div class="avatar sm">${avatarInner(u)}</div><span style="flex:1;color:var(--rd-text);">${esc(u.name||u.username)}</span>
        <button class="rd-btn btn-sm" data-human-teacher="${u.id}">Appoint</button></div>`).join('') || '<p style="font-size:12px;color:var(--rd-muted);">No users found.</p>';
      results.querySelectorAll('[data-human-teacher]').forEach(b=>b.addEventListener('click',async()=>{
        try{
          if(state.activeRoomId===room.id) await appointStudyTeacher(room.id,'human',b.dataset.humanTeacher);
          else { const {error}=await supabase.from('discussion_rooms').update({teacher_id:b.dataset.humanTeacher,teacher_type:'human',bot_teacher_id:null}).eq('id',room.id); if(error) throw error; await supabase.from('discussion_room_members').upsert({room_id:room.id,user_id:b.dataset.humanTeacher}); }
          room.teacher_id=b.dataset.humanTeacher; room.teacher_type='human'; room.bot_teacher_id=null;
          renderRoomTeacherTab(body,room,members,perms); toast('Teacher appointed');
        }catch(err){toast(err.message||'Could not appoint teacher');}
      }));
    },300);
  });
  body.querySelector('#askBotBtn')?.addEventListener('click',()=>{
    const q=body.querySelector('#botQuestion').value;
    const bot=getBotTeacher(room.bot_teacher_id);
    body.querySelector('#botAnswer').textContent=bot ? teacherAnswer(bot,q) : 'No AI teacher selected.';
  });
}

/* ---- Discussion Rooms UI ---- */
async function renderDiscussionRooms(){
  const el = document.getElementById('view-discussion');
  if (!state.session){ el.innerHTML = `<div class="empty"><p>Log in to use Discussion Rooms.</p></div>`; return; }
  if (state.activeDiscussionRoomId){ await renderDiscussionRoomDetail(el); return; }
  el.innerHTML = `
    <div class="section-head"><h2>Discussion Rooms</h2></div>
    <p style="font-size:12px;color:var(--ink-faint);margin:-10px 0 16px;">Debate a topic, take turns answering, get scored, and climb the leaderboard.</p>
    <div class="room-join-bar">
      <button class="btn btn-primary btn-sm" id="createDiscussionBtn">${ICONS.plus} Create a room</button>
      <div class="room-join-input"><span>#</span><input id="discJoinCode" placeholder="Enter Room ID e.g. DR-2026-0001"></div>
      <button class="btn btn-secondary btn-sm" id="discJoinBtn">Join</button>
    </div>
    <div id="discRoomsList" class="room-grid"></div>
  `;
  document.getElementById('createDiscussionBtn').addEventListener('click', openCreateDiscussionRoomModal);
  document.getElementById('discJoinBtn').addEventListener('click', async ()=>{
    const code = document.getElementById('discJoinCode').value.trim();
    if (!code){ toast('Enter a room ID'); return; }
    try{ await joinDiscussionRoomByCode(code); await loadMyDiscussionRooms(); renderRoute(); toast('Joined the discussion room'); }
    catch(err){ toast(err.message); }
  });
  const list = el.querySelector('#discRoomsList');
  const banners = ['rb-indigo','rb-amber','rb-green','rb-coral','rb-grape'];
  list.innerHTML = state.discussionRooms.length ? state.discussionRooms.map((r,i)=>{
    const isHost = r.host_id === state.session.user.id;
    const isTeacher = r.teacher_id === state.session.user.id;
    return `
    <div class="room-card" data-disc-room="${r.id}">
      <div class="room-card-banner ${banners[i%banners.length]}">
        <span class="room-vip-badge">${ICONS.debate} ${r.status==='live'?'LIVE':r.status==='ended'?'Ended':'Open'}</span>
        <span class="room-card-emoji">🎓</span>
      </div>
      <div class="room-card-body">
        <p class="room-card-title">${esc(r.name)}</p>
        <div class="room-card-code">${r.room_code}</div>
        <p class="room-card-meta">${isHost?'You are the host':isTeacher?'You are the teacher':esc(r.description||'')}</p>
        <div class="room-card-actions"><button class="btn btn-primary btn-sm" data-enter-disc="${r.id}" style="flex:1;justify-content:center;">Enter</button></div>
      </div>
    </div>`;
  }).join('') : `<div class="empty"><p>No discussion rooms yet. Create one or join with a Room ID.</p></div>`;
  list.querySelectorAll('[data-enter-disc]').forEach(b=>b.addEventListener('click', async ()=>{
    state.activeDiscussionRoomId = b.dataset.enterDisc;
    state.discussionTab = 'discussion';
    renderRoute();
  }));
}
function openCreateDiscussionRoomModal(){
  openModal(`
    <div class="modal">
      <h3>Create a Discussion Room</h3>
      <label>Room name</label><input id="drName" placeholder="e.g. Physics Debate Club">
      <label>Subject</label><select id="drSubject"><option value="">General</option>${state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}</select>
      <label>Description</label><textarea id="drDesc" rows="2" placeholder="What is this room about?"></textarea>
      <label>Max members</label><input id="drMax" type="number" min="2" max="200" value="30">
      <label>Privacy</label>
      <select id="drPrivacy"><option value="public">Public — anyone can join</option><option value="invite_only">Invite only — join by Room ID only</option></select>
      <label style="display:flex;align-items:center;gap:8px;margin-top:8px;"><input type="checkbox" id="drScoring" checked style="width:auto;margin:0;"> Enable scoring</label>
      <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="drLeaderboard" checked style="width:auto;margin:0;"> Enable leaderboard</label>
      <label style="display:flex;align-items:center;gap:8px;"><input type="checkbox" id="drMedals" checked style="width:auto;margin:0;"> Enable medals/achievements</label>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelDr">Cancel</button><button class="btn btn-primary" id="saveDr">Create Room</button></div>
    </div>
  `);
  document.getElementById('cancelDr').addEventListener('click', closeModal);
  document.getElementById('saveDr').addEventListener('click', async e=>{
    const name = document.getElementById('drName').value.trim();
    if (!name){ toast('Give the room a name'); return; }
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Creating...';
    try{
      const room = await createDiscussionRoom({
        name, description: document.getElementById('drDesc').value.trim(),
        subjectId: document.getElementById('drSubject').value || null,
        maxMembers: Number(document.getElementById('drMax').value) || 30,
        privacy: document.getElementById('drPrivacy').value,
        scoringEnabled: document.getElementById('drScoring').checked,
        leaderboardEnabled: document.getElementById('drLeaderboard').checked,
        medalsEnabled: document.getElementById('drMedals').checked,
      });
      closeModal();
      toast(`Room created — ID: ${room.room_code}`);
      await loadMyDiscussionRooms();
      state.activeDiscussionRoomId = room.id;
      renderRoute();
    }catch(err){ btn.disabled = false; btn.textContent = 'Create Room'; toast(err.message || 'Could not create room'); }
  });
}

async function renderDiscussionRoomDetail(el){
  const room = state.discussionRooms.find(r=>r.id===state.activeDiscussionRoomId);
  if (!room){ state.activeDiscussionRoomId = null; return renderDiscussionRooms(); }
  const isHost = room.host_id === state.session.user.id;
  const isTeacher = room.teacher_id === state.session.user.id;
  const isAdmin = state.profile?.role === 'admin';
  const canManage = isHost || isAdmin;
  const canModerate = canManage || isTeacher;
  const members = await loadDiscussionRoomMembers(room.id);
  state.discussionActiveTopic = await loadActiveTopic(room.id);

  el.innerHTML = `
    <div class="room-dark">
      <div class="rd-header">
        <button class="rd-icon-btn" id="backToDisc">${ICONS.back}</button>
        <div class="rd-title">
          <p class="rd-name"><span class="rd-live-dot"></span>${esc(room.name)} <span class="rd-vip-pill" style="background:linear-gradient(135deg,#4C6FFF,#2A46C9);">${room.room_code}</span></p>
          <p class="rd-sub">${members.length}/${room.max_members} members · Host: ${esc(members.find(m=>m.user_id===room.host_id)?.profiles?.name || 'Unknown')}${room.teacher_id ? ' · Teacher: '+esc(members.find(m=>m.user_id===room.teacher_id)?.profiles?.name || '—') : ''}</p>
        </div>
        <div class="rd-header-actions">
          <button class="rd-icon-btn" id="raiseHandBtn" title="Raise hand">${ICONS.hand}</button>
          ${canManage ? `<button class="rd-icon-btn" id="endDiscussionBtn" title="End discussion &amp; announce winners">${ICONS.crown}</button>` : ''}
          <button class="rd-leave-btn" id="leaveDiscBtn">Leave Room</button>
        </div>
      </div>
      <div class="rd-tabs">
        <button class="rd-tab" data-dtab="discussion">💬 Discussion</button>
        <button class="rd-tab" data-dtab="topic">📋 Topic</button>
        <button class="rd-tab" data-dtab="rounds">🎯 Rounds</button>
        <button class="rd-tab" data-dtab="polls">📊 Polls</button>
        <button class="rd-tab" data-dtab="leaderboard">🏆 Leaderboard</button>
        <button class="rd-tab" data-dtab="teacher">👨‍🏫 Teacher</button>
        <button class="rd-tab" data-dtab="rules">📜 Rules</button>
        <button class="rd-tab" data-dtab="call">🎥 Call</button>
      </div>
      <div id="dTabBody" class="rd-tab-body"></div>
    </div>
  `;
  loadDiscussionMessages(room.id).then(()=>{ if (state.discussionTab==='discussion') drawDiscussionMessages(); });
  subscribeDiscussionChannel(room.id);

  el.querySelector('#backToDisc').addEventListener('click', ()=>{
    if (state.discussionChannel){ supabase.removeChannel(state.discussionChannel); state.discussionChannel=null; }
    if (state.call.active) endCall();
    state.activeDiscussionRoomId = null;
    renderRoute();
  });
  el.querySelector('#leaveDiscBtn').addEventListener('click', ()=>el.querySelector('#backToDisc').click());
  el.querySelector('#raiseHandBtn').addEventListener('click', async e=>{
    const me = members.find(m=>m.user_id===state.session.user.id);
    const nowRaised = !(me?.hand_raised);
    try{ await toggleRaiseHand(room.id, nowRaised); toast(nowRaised ? '✋ Hand raised — the teacher can see you' : 'Hand lowered'); e.currentTarget.classList.toggle('active', nowRaised); }
    catch(err){ toast(err.message); }
  });
  el.querySelector('#endDiscussionBtn')?.addEventListener('click', ()=>{
    openModal(`
      <div class="modal">
        <h3>End this discussion?</h3>
        <p>This calculates winners from every scored answer so far and awards medals. This can't be undone.</p>
        <div class="modal-actions"><button class="btn btn-secondary" id="cancelEnd">Cancel</button><button class="btn btn-danger" id="confirmEnd">End &amp; Announce Winners</button></div>
      </div>
    `);
    document.getElementById('cancelEnd').addEventListener('click', closeModal);
    document.getElementById('confirmEnd').addEventListener('click', async ()=>{
      try{
        await awardDiscussionWinners(room.id);
        closeModal();
        await showWinnerCelebration(room);
        await loadMyDiscussionRooms();
      }catch(err){ toast(err.message || 'Could not finalize the discussion'); }
    });
  });
  el.querySelectorAll('.rd-tab').forEach(b=>b.addEventListener('click', ()=>switchDiscussionTab(b.dataset.dtab, room, members, { isHost, isTeacher, isAdmin, canManage, canModerate })));
  switchDiscussionTab(state.discussionTab, room, members, { isHost, isTeacher, isAdmin, canManage, canModerate });
}

function switchDiscussionTab(tab, room, members, perms){
  state.discussionTab = tab;
  document.querySelectorAll('.rd-tab').forEach(b=>b.classList.toggle('active', b.dataset.dtab===tab));
  const body = document.getElementById('dTabBody');
  if (!body) return;
  if (tab==='discussion') renderDiscussionChatTab(body, room, perms);
  else if (tab==='topic') renderTopicTab(body, room, perms);
  else if (tab==='rounds') renderRoundsTab(body, room, members, perms);
  else if (tab==='polls') renderPollsTab(body, room, perms);
  else if (tab==='leaderboard') renderLeaderboardTab(body, room);
  else if (tab==='teacher') renderTeacherTab(body, room, members, perms);
  else if (tab==='rules') renderRulesTab(body, room, perms);
  else if (tab==='call') renderCallStrip(body, room, 'discussion');
}

function renderDiscussionChatTab(body, room, perms){
  body.innerHTML = `
    <div id="discussionMessages" class="rd-panel chat-appearance-scope" style="min-height:340px;max-height:440px;overflow-y:auto;"></div>
    <div class="rd-composer" style="margin-top:10px;">
      <textarea rows="1" id="discInput" placeholder="Share your thoughts..."></textarea>
      <button class="rd-send-btn" id="discSend">${ICONS.send}</button>
    </div>
  `;
  drawDiscussionMessages();
  body.querySelector('#discSend').addEventListener('click', async ()=>{
    const inp = body.querySelector('#discInput');
    const val = inp.value.trim();
    if (!val) return;
    inp.value = '';
    const tempId = 'temp-'+Date.now();
    state.discussionMessages.push({ id:tempId, room_id:room.id, sender_id:state.session.user.id, content:val, created_at:new Date().toISOString(), profiles:state.profile, pending:true });
    drawDiscussionMessages();
    try{
      const real = await sendDiscussionMessage(room.id, val);
      const i = state.discussionMessages.findIndex(m=>m.id===tempId);
      if (i>-1) state.discussionMessages[i] = real;
      drawDiscussionMessages();
    }catch(err){
      state.discussionMessages = state.discussionMessages.filter(m=>m.id!==tempId);
      drawDiscussionMessages(); inp.value = val;
      toast('Message failed to send');
    }
  });
}
function drawDiscussionMessages(){
  const wrap = document.getElementById('discussionMessages');
  if (!wrap) return;
  wrap.innerHTML = state.discussionMessages.length ? chatBubblesHTML(state.discussionMessages, state.session.user.id, { idKey:'sender_id' }) : `<div class="empty"><p>No messages yet — start the discussion!</p></div>`;
  wrap.querySelectorAll('[data-viewprofile]').forEach(n=>n.addEventListener('click', ()=>openUserProfileModal(n.dataset.viewprofile)));
  wrap.scrollTop = wrap.scrollHeight;
}

function renderTopicTab(body, room, perms){
  const t = state.discussionActiveTopic;
  body.innerHTML = `
    <div class="rd-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <p class="rd-panel-title">📋 Topic Board</p>
        ${perms.canModerate ? `<button class="rd-btn rd-btn-primary btn-sm" id="newTopicBtn">+ New Topic</button>` : ''}
      </div>
      ${t ? `
        <h3 style="font-family:var(--font-display);color:var(--rd-text);font-size:19px;margin:10px 0 6px;">${esc(t.title)}</h3>
        <p style="color:var(--rd-muted);font-size:13.5px;line-height:1.6;">${esc(t.description||'')}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">
          <span class="tag">Difficulty: ${esc(t.difficulty)}</span>
          <span class="tag">${t.discussion_minutes} min</span>
        </div>
        ${t.image_url ? `<img src="${esc(t.image_url)}" style="max-width:100%;border-radius:12px;margin-top:12px;">` : ''}
        ${t.file_url ? `<a href="${esc(t.file_url)}" target="_blank" rel="noopener noreferrer" class="rd-btn btn-sm" style="display:inline-block;margin-top:10px;">📎 Open attached file</a>` : ''}
      ` : `<p style="color:var(--rd-muted);font-size:13px;margin-top:10px;">No topic published yet.</p>`}
    </div>
  `;
  body.querySelector('#newTopicBtn')?.addEventListener('click', ()=>openNewTopicModal(room));
}
function openNewTopicModal(room){
  openModal(`
    <div class="modal">
      <h3>Publish a new topic</h3>
      <label>Title</label><input id="tpTitle" placeholder="e.g. Can Nuclear Energy Be the Future?">
      <label>Description</label><textarea id="tpDesc" rows="3"></textarea>
      <label>Difficulty</label><select id="tpDiff"><option value="easy">Easy</option><option value="medium" selected>Medium</option><option value="hard">Hard</option></select>
      <label>Discussion length (minutes)</label><input id="tpMinutes" type="number" value="20" min="5" max="120">
      <label>Diagram/image (optional)</label><input type="file" id="tpImage" accept="image/*">
      <label>File attachment — PDF, slides, etc. (optional)</label><input type="file" id="tpFile" accept=".pdf,.doc,.docx,.ppt,.pptx">
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelTp">Cancel</button><button class="btn btn-primary" id="saveTp">Publish</button></div>
    </div>
  `);
  document.getElementById('cancelTp').addEventListener('click', closeModal);
  document.getElementById('saveTp').addEventListener('click', async e=>{
    const title = document.getElementById('tpTitle').value.trim();
    if (!title){ toast('Give the topic a title'); return; }
    const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Publishing...';
    try{
      let imageUrl = null, fileUrl = null;
      const imgFile = document.getElementById('tpImage').files[0];
      if (imgFile) imageUrl = await uploadRoomFile(imgFile);
      const docFile = document.getElementById('tpFile').files[0];
      if (docFile) fileUrl = await uploadRoomFile(docFile);
      await createDiscussionTopic(room.id, {
        title, description: document.getElementById('tpDesc').value.trim(),
        difficulty: document.getElementById('tpDiff').value, minutes: Number(document.getElementById('tpMinutes').value),
        imageUrl, fileUrl,
      });
      closeModal(); toast('Topic published');
      state.discussionActiveTopic = await loadActiveTopic(room.id);
      switchDiscussionTab('topic', room, await loadDiscussionRoomMembers(room.id), {});
    }catch(err){ btn.disabled=false; btn.textContent='Publish'; toast(err.message || 'Could not publish topic'); }
  });
}

function renderRoundsTab(body, room, members, perms){
  body.innerHTML = `<div id="roundsBody"></div>`;
  refreshRoundsTab();
  async function refreshRoundsTab(){
    state.discussionRounds = await loadDiscussionRounds(room.id);
    const active = state.discussionRounds.find(r=>r.status==='active');
    const wrap = body.querySelector('#roundsBody');
    wrap.innerHTML = `
      ${perms.canModerate ? `
      <div class="rd-panel">
        <p class="rd-panel-title">🎯 Start a new round</p>
        <select id="roundType">
          <option value="knowledge">Round 1 — Knowledge</option>
          <option value="thinking">Round 2 — Thinking</option>
          <option value="advice">Round 3 — Advice</option>
          <option value="challenge">Round 4 — Challenge</option>
          <option value="final">Round 5 — Final Thought</option>
        </select>
        <input id="roundQuestion" placeholder="Custom question (optional — a default is used otherwise)" style="margin-top:8px;">
        <select id="roundTimer" style="margin-top:8px;"><option value="30">30 seconds</option><option value="60" selected>60 seconds</option><option value="90">90 seconds</option><option value="120">2 minutes</option><option value="300">5 minutes</option></select>
        <button class="rd-btn rd-btn-primary btn-sm" id="createRoundBtn" style="margin-top:10px;">Create Round</button>
      </div>` : ''}
      ${active ? renderActiveRoundHTML(active, members, perms) : `<div class="rd-panel"><p style="color:var(--rd-muted);font-size:13px;">No active round right now.</p></div>`}
      <div class="rd-panel">
        <p class="rd-panel-title">Past rounds</p>
        ${state.discussionRounds.filter(r=>r.status!=='active').map(r=>`<p style="font-size:12.5px;color:var(--rd-muted);margin:4px 0;">Round ${r.round_number} — ${r.round_type} <span style="color:var(--rd-text);">${r.status}</span></p>`).join('') || '<p style="font-size:12.5px;color:var(--rd-muted);">None yet.</p>'}
      </div>
    `;
    wrap.querySelector('#createRoundBtn')?.addEventListener('click', async e=>{
      const btn = e.currentTarget; btn.disabled = true;
      try{
        const round = await createDiscussionRound(room.id, state.discussionActiveTopic?.id, wrap.querySelector('#roundType').value, wrap.querySelector('#roundQuestion').value.trim(), Number(wrap.querySelector('#roundTimer').value));
        await startDiscussionRound(round.id, null);
        toast('Round started');
        await refreshRoundsTab();
      }catch(err){ toast(err.message || 'Could not start round'); }
      btn.disabled = false;
    });
    wrap.querySelectorAll('[data-select-participant]').forEach(sel=>sel.addEventListener('change', async e=>{
      try{ await selectRoundParticipant(active.id, e.target.value || null); toast('Participant selected'); await refreshRoundsTab(); }
      catch(err){ toast(err.message); }
    }));
    wrap.querySelector('#endRoundBtn')?.addEventListener('click', async ()=>{
      try{ await endDiscussionRound(active.id); toast('Round ended'); await refreshRoundsTab(); }catch(err){ toast(err.message); }
    });
    if (active){
      const answers = await loadAnswersForRound(active.id);
      const answersWrap = wrap.querySelector('#roundAnswers');
      if (answersWrap) drawRoundAnswers(answersWrap, answers, perms);
      const myAnswer = answers.find(a=>a.user_id===state.session.user.id);
      const canAnswer = !myAnswer && (!active.current_participant_id || active.current_participant_id===state.session.user.id);
      const submitBtn = wrap.querySelector('#submitAnswerBtn');
      if (submitBtn){
        submitBtn.disabled = !canAnswer;
        submitBtn.addEventListener('click', async e=>{
          const val = wrap.querySelector('#myAnswerInput').value.trim();
          if (!val){ toast('Write your answer first'); return; }
          const btn = e.currentTarget; btn.disabled = true; btn.textContent = 'Submitting...';
          try{
            await submitDiscussionAnswer(active.id, val);
            toast('Answer submitted');
            await refreshRoundsTab();
          }catch(err){ btn.disabled=false; btn.textContent='Submit answer'; toast(err.message || 'Could not submit — is it your turn?'); }
        });
      }
    }
  }
}
function renderActiveRoundHTML(round, members, perms){
  const participantName = round.current_participant_id ? (members.find(m=>m.user_id===round.current_participant_id)?.profiles?.name || 'Someone') : 'Anyone (open round)';
  return `
    <div class="rd-panel" style="border-color:var(--rd-cyan);">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
        <p class="rd-panel-title" style="margin:0;">Round ${round.round_number} — ${round.round_type.toUpperCase()}</p>
        <span class="tag" style="background:var(--rd-cyan);color:#04222A;">⏱ ${round.timer_seconds}s</span>
      </div>
      <p style="color:var(--rd-text);font-size:15px;margin:10px 0;">${esc(round.question)}</p>
      <p style="color:var(--rd-cyan);font-size:12.5px;font-weight:600;">${esc(participantName)} — Your Turn</p>
      ${perms.canModerate ? `
        <select id="roundParticipantSelect" data-select-participant>
          <option value="">Open to anyone</option>
          ${members.map(m=>`<option value="${m.user_id}" ${round.current_participant_id===m.user_id?'selected':''}>${esc(m.profiles?.name||m.profiles?.username)}</option>`).join('')}
        </select>
        <button class="rd-btn rd-btn-danger btn-sm" id="endRoundBtn" style="margin-top:8px;">End Round</button>
      ` : ''}
      <div style="margin-top:12px;display:flex;gap:8px;">
        <input id="myAnswerInput" class="rd-input" placeholder="Type your answer..." style="flex:1;">
        <button class="rd-btn rd-btn-primary btn-sm" id="submitAnswerBtn">Submit answer</button>
      </div>
      <div id="roundAnswers" style="margin-top:14px;"></div>
    </div>
  `;
}
function drawRoundAnswers(wrap, answers, perms){
  wrap.innerHTML = answers.length ? `<p style="font-size:12px;font-weight:600;color:var(--rd-muted);margin-bottom:6px;">Answers</p>` + answers.map(a=>`
    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;margin-bottom:8px;">
      <p style="font-size:12.5px;font-weight:600;color:var(--rd-text);margin:0 0 4px;">${esc(a.profiles?.name||a.profiles?.username)} ${a.evaluated_at?`<span style="color:var(--rd-cyan);">— ${a.total_score} pts</span>`:''}</p>
      <p style="font-size:13px;color:var(--rd-text);margin:0 0 6px;">${esc(a.content)}</p>
      ${perms.canModerate ? `<button class="rd-btn btn-sm" data-score-answer="${a.id}">${a.evaluated_at?'Re-score':'Score this answer'}</button>` : (a.feedback ? `<p style="font-size:12px;color:var(--rd-muted);">💬 ${esc(a.feedback)}</p>` : '')}
    </div>`).join('') : `<p style="font-size:12.5px;color:var(--rd-muted);">No answers yet.</p>`;
  wrap.querySelectorAll('[data-score-answer]').forEach(b=>b.addEventListener('click', ()=>openScoreModal(b.dataset.scoreAnswer, answers.find(a=>a.id===b.dataset.scoreAnswer))));
}
function openScoreModal(answerId, answer){
  openModal(`
    <div class="modal">
      <h3>Score this answer</h3>
      <p style="font-size:13px;color:var(--ink-soft);">"${esc(answer.content)}"</p>
      ${['knowledge','reasoning','creativity','relevance','communication'].map(k=>`
        <label style="text-transform:capitalize;">${k} (0-10)</label><input type="number" id="sc-${k}" min="0" max="10" value="${answer[k+'_score']||0}">
      `).join('')}
      <label>Bonus points (0-20)</label><input type="number" id="sc-bonus" min="0" max="20" value="${answer.bonus_points||0}">
      <label>Feedback</label><textarea id="sc-feedback" rows="2">${esc(answer.feedback||'')}</textarea>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelSc">Cancel</button><button class="btn btn-primary" id="saveSc">Save score</button></div>
    </div>
  `);
  document.getElementById('cancelSc').addEventListener('click', closeModal);
  document.getElementById('saveSc').addEventListener('click', async e=>{
    const btn = e.currentTarget; btn.disabled = true;
    try{
      await scoreDiscussionAnswer(answerId, {
        knowledge: Number(document.getElementById('sc-knowledge').value),
        reasoning: Number(document.getElementById('sc-reasoning').value),
        creativity: Number(document.getElementById('sc-creativity').value),
        relevance: Number(document.getElementById('sc-relevance').value),
        communication: Number(document.getElementById('sc-communication').value),
        bonus: Number(document.getElementById('sc-bonus').value),
        feedback: document.getElementById('sc-feedback').value.trim(),
      });
      closeModal(); toast('Score saved');
      renderRoute();
    }catch(err){ btn.disabled=false; toast(err.message || 'Could not save score'); }
  });
}

function renderPollsTab(body, room, perms){
  body.innerHTML = `
    ${perms.canModerate ? `<div class="rd-panel"><button class="rd-btn rd-btn-primary btn-sm" id="newPollBtn">+ New poll</button></div>` : ''}
    <div id="pollsList"></div>
  `;
  body.querySelector('#newPollBtn')?.addEventListener('click', ()=>openNewPollModal(room, ()=>refreshPolls()));
  refreshPolls();
  async function refreshPolls(){
    const polls = await loadActivePolls(room.id);
    const wrap = body.querySelector('#pollsList');
    wrap.innerHTML = polls.length ? polls.map(p=>{
      const total = p.votes.length || 1;
      const myVote = p.votes.find(v=>v.user_id===state.session.user.id);
      return `<div class="rd-panel">
        <p class="rd-panel-title">📊 ${esc(p.question)}</p>
        ${p.discussion_poll_options.sort((a,b)=>a.position-b.position).map(o=>{
          const count = p.votes.filter(v=>v.option_id===o.id).length;
          const pct = Math.round((count/total)*100);
          return `<div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:12.5px;color:var(--rd-text);"><span>${esc(o.label)}</span><span>${pct}% (${count})</span></div>
            <div style="background:rgba(255,255,255,0.08);border-radius:6px;height:8px;overflow:hidden;margin-top:3px;"><div style="width:${pct}%;height:100%;background:var(--rd-cyan);"></div></div>
            ${!myVote ? `<button class="rd-btn btn-sm" data-vote="${p.id}:${o.id}" style="margin-top:4px;">Vote</button>` : ''}
          </div>`;
        }).join('')}
      </div>`;
    }).join('') : `<div class="empty"><p>No polls yet.</p></div>`;
    wrap.querySelectorAll('[data-vote]').forEach(b=>b.addEventListener('click', async ()=>{
      const [pollId, optionId] = b.dataset.vote.split(':');
      try{ await voteOnPoll(pollId, optionId); await refreshPolls(); }catch(err){ toast(err.message); }
    }));
  }
}
function openNewPollModal(room, onDone){
  openModal(`
    <div class="modal">
      <h3>Create a poll</h3>
      <label>Question</label><input id="pqQuestion" placeholder="e.g. Which solution is most practical?">
      <label>Options (one per line)</label><textarea id="pqOptions" rows="4" placeholder="Solar\nWind\nNuclear\nHydroelectric"></textarea>
      <div class="modal-actions"><button class="btn btn-secondary" id="cancelPq">Cancel</button><button class="btn btn-primary" id="savePq">Create Poll</button></div>
    </div>
  `);
  document.getElementById('cancelPq').addEventListener('click', closeModal);
  document.getElementById('savePq').addEventListener('click', async ()=>{
    const question = document.getElementById('pqQuestion').value.trim();
    const options = document.getElementById('pqOptions').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if (!question || options.length<2){ toast('Add a question and at least 2 options'); return; }
    try{ await createDiscussionPoll(room.id, question, options); closeModal(); toast('Poll created'); onDone(); }
    catch(err){ toast(err.message); }
  });
}

async function renderLeaderboardTab(body, room){
  body.innerHTML = `<div class="rd-panel"><p class="rd-panel-title">🏆 Room Leaderboard</p><div id="lbList"></div></div>`;
  const board = await loadDiscussionLeaderboard(room.id);
  const medals = ['🥇','🥈','🥉'];
  document.getElementById('lbList').innerHTML = board.length ? board.map((u,i)=>`
    <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--rd-border);">
      <span style="width:26px;text-align:center;font-size:15px;">${medals[i]||(i+1)}</span>
      <div class="avatar sm" style="overflow:hidden;">${avatarInner(u.profile)}</div>
      <div style="flex:1;min-width:0;"><p style="font-size:13.5px;font-weight:600;color:var(--rd-text);margin:0;">${esc(u.profile?.name||u.profile?.username||'Student')}</p><p style="font-size:11px;color:var(--rd-muted);margin:0;">${u.count} answer${u.count===1?'':'s'} · best ${u.best}</p></div>
      <span style="font-family:var(--font-display);font-weight:700;color:var(--rd-cyan);">${u.total} pts</span>
    </div>`).join('') : `<p style="font-size:12.5px;color:var(--rd-muted);">No scored answers yet.</p>`;
}

function renderTeacherTab(body, room, members, perms){
  // Reuse the same teacher UX in Discussion Rooms. Human teachers use
  // discussion_rooms.teacher_id; AI teachers use teacher_type/bot_teacher_id.
  renderRoomTeacherTab(body, room, members, {canManage:perms.canManage});
}

function renderRulesTab(body, room, perms){
  body.innerHTML = `
    <div class="rd-panel">
      <p class="rd-panel-title">📜 Room Rules</p>
      <ol style="color:var(--rd-text);font-size:13.5px;line-height:2;padding-left:20px;margin:0;">
        ${(room.rules||[]).map(r=>`<li>${esc(r)}</li>`).join('')}
      </ol>
    </div>
  `;
}

async function showWinnerCelebration(room){
  const achievements = await loadRoomAchievements(room.id);
  const board = await loadDiscussionLeaderboard(room.id);
  const medals = ['🥇','🥈','🥉'];
  openModal(`
    <div class="modal" style="text-align:center;">
      <h3>🏆 Discussion Complete</h3>
      <p style="color:var(--ink-soft);font-size:13px;">${esc(state.discussionActiveTopic?.title||room.name)}</p>
      ${board.slice(0,3).map((u,i)=>`<p style="font-size:15px;margin:6px 0;">${medals[i]} ${esc(u.profile?.name||u.profile?.username)} — <strong>${u.total} pts</strong></p>`).join('')}
      ${achievements.length ? `<div style="height:1px;background:var(--hair);margin:14px 0;"></div><p style="font-size:12px;font-weight:600;color:var(--ink-soft);">Special Awards</p>${achievements.map(a=>`<p style="font-size:13px;margin:4px 0;">${AWARD_LABELS[a.award_type]?.emoji||'🏅'} ${AWARD_LABELS[a.award_type]?.label||a.award_type} — ${esc(a.profiles?.name||a.profiles?.username)}</p>`).join('')}` : ''}
      <p style="font-size:12px;color:var(--ink-faint);margin-top:14px;">Achievements have been added to each student's account.</p>
      <div class="modal-actions"><button class="btn btn-primary" id="closeWinnerModal" style="width:100%;justify-content:center;">Done</button></div>
    </div>
  `);
  document.getElementById('closeWinnerModal').addEventListener('click', ()=>{ closeModal(); go('discussion'); });
}

function renderBookmarks(){
  const el = document.getElementById('view-bookmarks');
  const items = state.notes.filter(n=>state.bookmarkIds.has(n.id));
  el.innerHTML = `<div class="section-head"><h2>My bookmarks</h2></div><div id="bmList"></div>`;
  el.querySelector('#bmList').innerHTML = items.length ? items.map(noteCardHTML).join('') : `<div class="empty"><p>Bookmark notes to find them here.</p></div>`;
  bindNoteCards(el.querySelector('#bmList'));
}

async function renderAdmin(){
  const el = document.getElementById('view-admin');
  if (state.profile?.role !== 'admin'){ el.innerHTML = `<div class="empty"><p>Admins only.</p></div>`; return; }
  await loadReports();
  el.innerHTML = `
    <div class="section-head"><h2>Admin · Reports</h2></div>
    <div id="reportsList"></div>
  `;
  const list = el.querySelector('#reportsList');
  list.innerHTML = state.reports.length ? state.reports.map(r=>`
    <div class="card">
      <p style="font-size:13px;font-weight:600;margin:0 0 4px;">${esc(r.target_type)} · ${esc(r.target_id)}</p>
      <p style="font-size:12.5px;color:var(--ink-soft);margin:0 0 8px;">${esc(r.reason||'')} — ${fmtRelative(r.created_at)}</p>
      ${r.resolved ? `<span class="tag" style="background:var(--green-soft);color:var(--green);">Resolved</span>` : `<button class="btn btn-secondary btn-sm" data-resolve="${r.id}">Mark resolved</button>`}
    </div>`).join('') : `<div class="empty"><p>No reports filed.</p></div>`;
  list.querySelectorAll('[data-resolve]').forEach(b=>b.addEventListener('click', async ()=>{
    await resolveReport(b.dataset.resolve);
    renderAdmin();
  }));
}

/* ============ AUTH GATE ============ */
function renderAuthGate(container){
  const el = container || document.body;
  el.innerHTML = `
    <div style="max-width:360px;margin:60px auto;padding:0 20px;">
      <div style="text-align:center;margin-bottom:24px;">${ICONS.logo}<h2 style="font-family:var(--font-display);margin:10px 0 2px;">The Extreme Notebook</h2><p style="font-size:13px;color:var(--ink-soft);">Study. Ask. Learn. Connect.</p></div>
      <div class="card" id="authCard"></div>
    </div>
  `;
  drawAuthForm(el.querySelector('#authCard'), 'login');
}
function drawAuthForm(card, mode){
  if (mode === 'login'){
    card.innerHTML = `
      <label>Email</label><input id="authEmail" type="email" placeholder="name@example.com">
      <label>Password</label><input id="authPassword" type="password" placeholder="Your password">
      <div id="authError" class="pin-error" style="text-align:left;"></div>
      <button class="btn btn-primary" id="authSubmit" style="width:100%;justify-content:center;margin-bottom:10px;">Log in</button>
      <p style="text-align:center;font-size:12.5px;"><a href="#" id="toForgot" style="color:var(--indigo);font-weight:600;">Forgot password?</a></p>
      <p style="text-align:center;font-size:12.5px;color:var(--ink-soft);margin-top:6px;">New here? <a href="#" id="toSignup" style="color:var(--indigo);font-weight:600;">Create an account</a></p>
    `;
    card.querySelector('#authSubmit').addEventListener('click', async e=>{
      const btn = e.currentTarget;
      if (btn.disabled) return; // BUG FIX (#11): stops rapid double-clicks from firing two logins
      btn.disabled = true; const original = btn.textContent; btn.textContent = 'Logging in...';
      card.querySelector('#authError').textContent = '';
      try{ await signIn(card.querySelector('#authEmail').value.trim(), card.querySelector('#authPassword').value); }
      catch(err){ card.querySelector('#authError').textContent = err.message; }
      finally{ btn.disabled = false; btn.textContent = original; }
    });
    card.querySelector('#toSignup').addEventListener('click', e=>{ e.preventDefault(); drawAuthForm(card, 'signup'); });
    card.querySelector('#toForgot').addEventListener('click', e=>{ e.preventDefault(); drawAuthForm(card, 'forgot'); });
  } else if (mode === 'signup'){
    card.innerHTML = `
      <label>Name</label><input id="authName" placeholder="Your name">
      <label>Username</label><input id="authUsername" placeholder="unique_username">
      <label>Email</label><input id="authEmail" type="email" placeholder="name@example.com">
      <label>Password</label><input id="authPassword" type="password" placeholder="At least 6 characters">
      <div id="authError" class="pin-error" style="text-align:left;"></div>
      <button class="btn btn-primary" id="authSubmit" style="width:100%;justify-content:center;margin-bottom:10px;">Sign up</button>
      <p style="text-align:center;font-size:12.5px;color:var(--ink-soft);">Already have an account? <a href="#" id="toLogin" style="color:var(--indigo);font-weight:600;">Log in</a></p>
    `;
    card.querySelector('#authSubmit').addEventListener('click', async e=>{
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true; const original = btn.textContent; btn.textContent = 'Signing up...';
      card.querySelector('#authError').textContent = '';
      try{
        await signUp(card.querySelector('#authEmail').value.trim(), card.querySelector('#authPassword').value, card.querySelector('#authUsername').value.trim(), card.querySelector('#authName').value.trim());
        toast('Check your email to confirm your account');
        drawAuthForm(card, 'login');
        return; // form was just replaced — don't touch the old button below
      } catch(err){ card.querySelector('#authError').textContent = err.message; }
      btn.disabled = false; btn.textContent = original;
    });
    card.querySelector('#toLogin').addEventListener('click', e=>{ e.preventDefault(); drawAuthForm(card, 'login'); });
  } else if (mode === 'forgot'){
    card.innerHTML = `
      <label>Email</label><input id="authEmail" type="email" placeholder="name@example.com">
      <div id="authError" class="pin-error" style="text-align:left;"></div>
      <button class="btn btn-primary" id="authSubmit" style="width:100%;justify-content:center;margin-bottom:10px;">Send reset link</button>
      <p style="text-align:center;font-size:12.5px;"><a href="#" id="toLogin" style="color:var(--indigo);font-weight:600;">Back to login</a></p>
    `;
    card.querySelector('#authSubmit').addEventListener('click', async e=>{
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true; const original = btn.textContent; btn.textContent = 'Sending...';
      card.querySelector('#authError').textContent = '';
      try{ await sendPasswordReset(card.querySelector('#authEmail').value.trim()); toast('Reset link sent — check your email'); }
      catch(err){ card.querySelector('#authError').textContent = err.message; }
      btn.disabled = false; btn.textContent = original;
    });
    card.querySelector('#toLogin').addEventListener('click', e=>{ e.preventDefault(); drawAuthForm(card, 'login'); });
  }
}
function requireAuth(){
  if (!state.session){ toast('Log in to do that'); go('profile'); return false; }
  return true;
}

/* ============ ROUTER ============ */
async function renderRoute(){
  document.documentElement.setAttribute('data-theme', state.theme);
  const inRoomFullscreen = state.view === 'rooms' && !!state.activeRoomId;
  document.documentElement.classList.toggle('room-focus-mode', inRoomFullscreen);
  renderChrome();
  const views = ['home','study','notes','test','livetest','rooms','discussion','doubts','live','private','dashboard','profile','bookmarks','admin'];
  views.forEach(v=>{ const node = document.getElementById('view-'+v); if (node) node.hidden = state.view !== v; });

  if (state.view==='home') await renderHome();
  else if (state.view==='study') renderStudy();
  else if (state.view==='notes') renderNotes();
  else if (state.view==='test') renderTestList(false);
  else if (state.view==='livetest') renderTestList(true);
  else if (state.view==='rooms') await renderRooms();
  else if (state.view==='discussion') await renderDiscussionRooms();
  else if (state.view==='doubts') renderDoubts();
  else if (state.view==='live') await renderLive();
  else if (state.view==='private') await renderPrivate();
  else if (state.view==='dashboard') renderDashboard();
  else if (state.view==='profile') await renderProfile();
  else if (state.view==='bookmarks') renderBookmarks();
  else if (state.view==='admin') await renderAdmin();
}

/* ============ BOOT ============ */
async function boot(){
  if (!configured){
    document.getElementById('app-root').innerHTML = `
      <div style="max-width:440px;margin:80px auto;padding:24px;text-align:center;font-family:sans-serif;">
        <h2>Backend not configured yet</h2>
        <p style="color:#666;line-height:1.6;">Open <code>config.js</code> and paste your Supabase project URL and anon key. See SETUP_GUIDE.md for exact steps.</p>
      </div>`;
    return;
  }
  try{
    await refreshSession();
    if (!state.session){
      renderAuthGate(document.getElementById('app-root'));
    } else {
      document.getElementById('app-root').innerHTML = document.getElementById('app-template').innerHTML;
      await loadEverythingForSession();
      await renderRoute();
    }
    attachAuthListener();
  }catch(err){
    // BUG FIX (#12): if anything above throws (bad network, Supabase down,
    // a missing table), the user used to get silently stuck on whatever
    // half-rendered state was left — no message, no way forward except
    // manually reloading. Now it's a clear, recoverable error screen.
    console.error('[boot] startup failed:', err);
    document.getElementById('app-root').innerHTML = `
      <div style="max-width:440px;margin:80px auto;padding:24px;text-align:center;font-family:sans-serif;">
        <h2>Something went wrong while loading</h2>
        <p style="color:#666;line-height:1.6;margin-bottom:18px;">${esc(err.message || 'Unknown error')}</p>
        <button id="bootRetryBtn" style="background:#332E7C;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;">Retry</button>
      </div>`;
    document.getElementById('bootRetryBtn')?.addEventListener('click', ()=>window.location.reload());
  }
}
// Loads every optional/secondary data source for the signed-in session.
// Uses allSettled (#12) so that if, say, loadTests() fails for some reason,
// the rest of the app (notes, questions, rooms...) still loads and works —
// one broken feature no longer takes the whole startup down with it.
async function loadEverythingForSession(){
  const results = await Promise.allSettled([
    loadSubjects(), loadNotes(), loadMyNotes(), loadQuestions(), loadTests(), loadMyRooms(), loadMyDiscussionRooms()
  ]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error('[boot] a startup data load failed (feature ' + i + '):', r.reason);
  });
  applyAppearance();
  subscribeLive();
  try{ await loadLiveMessages(); }catch(err){ console.error('[boot] loadLiveMessages failed:', err); }
  try{ await loadConversations(); }catch(err){ console.error('[boot] loadConversations failed:', err); }
}
function attachAuthListener(){
  let currentUserId = state.session?.user?.id || null;
  supabase.auth.onAuthStateChange(async (event, session) => {
    // Supabase can fire SIGNED_IN again on tab focus / token refresh even though
    // the user never logged out. Only do a full app rebuild when the signed-in
    // user actually changes — this was the cause of the "keeps reloading" bug.
    if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION'){
      state.session = session;
      return;
    }
    if (event === 'SIGNED_IN'){
      if (session?.user?.id === currentUserId) { state.session = session; return; }
      currentUserId = session?.user?.id || null;
      state.session = session;
      try{
        const { data: prof, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (error) throw error;
        state.profile = prof;
        state.privateHidden = prof?.settings?.private_hidden || false;
        document.getElementById('app-root').innerHTML = document.getElementById('app-template').innerHTML;
        await loadEverythingForSession();
        state.view = 'home';
        await renderRoute();
      }catch(err){
        console.error('[auth] failed to load profile after sign-in:', err);
        toast('Signed in, but something failed to load — try refreshing');
      }
    } else if (event === 'SIGNED_OUT'){
      currentUserId = null;
      state.session = null;
      state.profile = null;
      state.view = 'home';
      renderAuthGate(document.getElementById('app-root'));
    }
  });
}

document.addEventListener('DOMContentLoaded', boot);
