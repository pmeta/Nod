// $NOD Full Works + Nod Game JS
(function(){
  const cfg = window.NOD_CONFIG || {};
  // Theme
  const root = document.documentElement;
  const applyTheme = (mode) => {
    if(mode === 'light') root.classList.add('light');
    else if(mode === 'dark') root.classList.remove('light');
    else {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      root.classList.toggle('light', !!prefersLight);
    }
  };
  applyTheme(cfg.theme || 'auto');
  document.getElementById('themeToggle').addEventListener('click', ()=>{
    const next = root.classList.contains('light') ? 'dark' : 'light';
    root.classList.toggle('light');
    localStorage.setItem('nod-theme', next);
  });
  const saved = localStorage.getItem('nod-theme'); if(saved){ applyTheme(saved); }

  // Wiring links
  const addr = cfg.contract || 'PASTE_CONTRACT_ADDRESS';
  const pair = cfg.pairId || '';
  const ds = cfg.dexscreenerUrl || (pair ? `https://dexscreener.com/solana/${pair}` : '#');

  const setHref = (id, h)=>{ const el=document.getElementById(id); if(el) el.href=h; };
  const setText = (id, t)=>{ const el=document.getElementById(id); if(el) el.textContent=t; };
  const byId = id => document.getElementById(id);

  setHref('dexLink', ds); setHref('dsLink', ds); setHref('dsFooter', ds);
  setHref('tw', cfg.twitter||'#'); setHref('twFooter', cfg.twitter||'#');
  setHref('tg', cfg.telegram||'#'); setHref('tgFooter', cfg.telegram||'#');
  const mailto = `mailto:${cfg.email||'hello@nodcoin.xyz'}`; setHref('ml', mailto); setHref('mailFooter', mailto);
  byId('buyCta').href = ds;
  setText('addr', addr);
  setText('year', new Date().getFullYear());

  // Copy
  function copyNow(){
    navigator.clipboard.writeText(addr).then(()=>{
      ['copyAddr','copyAddr2'].forEach(id=>{
        const b = byId(id); if(b){ b.textContent = (id==='copyAddr'?'Copied! ✅':'Copied!'); setTimeout(()=> b.textContent=(id==='copyAddr'?'Copy Contract':'Copy'),1200); }
      });
    });
  }
  byId('copyAddr').addEventListener('click', copyNow);
  byId('copyAddr2').addEventListener('click', copyNow);

  // Tweet button
  const text = "A nod means ‘yes’ in every language. Now it’s on‑chain. 🟢 $NOD #Solana #NodApproved";
  const url  = location.href;
  setHref('tweetBtn', `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);

  // Chart iframe
  const frame = byId('chartFrame');
  if (pair) frame.src = `https://dexscreener.com/solana/${pair}?embed=1&theme=${root.classList.contains('light')?'light':'dark'}`;
  else frame.parentElement.innerHTML = '<p class="tiny">Set your pairId in config.js to show the live chart.</p>';

  // Live price
  async function fetchPrice(){
    const el = byId('price');
    if (!pair){ el.textContent = '$NOD — add pairId in config.js'; return; }
    try{
      const r = await fetch(`https://api.dexscreener.com/latest/dex/pairs/solana/${pair}`);
      const j = await r.json(); const p = j?.pairs?.[0];
      if(!p) throw new Error('No pair data');
      el.textContent = `$NOD — $${Number(p.priceUsd||0).toFixed(6)} • ${p.priceChange?.h1||0}% 1h`;
    }catch(e){ el.textContent = '$NOD — live price unavailable'; }
  }
  fetchPrice(); setInterval(fetchPrice, 60000);

  // ---- Nod Game (global counter via CountAPI with fallback) ----
  const countEl = byId('nodCount');
  const statusEl = byId('nodStatus');
  const btn = byId('nodBtn');

  const ns = (location.host || 'nod.local').replace(/[:.]/g,'-');
  const key = 'global-nods';

  async function getCount(){
    try{
      const r = await fetch(`https://api.countapi.xyz/get/${ns}/${key}`);
      if(!r.ok) throw new Error('get failed');
      const j = await r.json();
      return j.value || 0;
    }catch(e){
      const local = Number(localStorage.getItem('nodCountLocal')||0);
      statusEl.textContent = 'Global counter offline — showing local only.';
      return local;
    }
  }
  async function hit(){
    try{
      const r = await fetch(`https://api.countapi.xyz/hit/${ns}/${key}`);
      if(!r.ok) throw new Error('hit failed');
      const j = await r.json();
      return j.value || 0;
    }catch(e){
      const local = Number(localStorage.getItem('nodCountLocal')||0)+1;
      localStorage.setItem('nodCountLocal', local);
      statusEl.textContent = 'Global counter offline — added to local.';
      return local;
    }
  }

  // initialize
  getCount().then(v=>{ countEl.textContent = v.toLocaleString(); });

  btn.addEventListener('click', async ()=>{
    btn.classList.add('nodding');
    const v = await hit();
    countEl.textContent = Number(v).toLocaleString();
    setTimeout(()=> btn.classList.remove('nodding'), 450);
  });
})();