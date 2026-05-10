/* catat — global tweaks panel
   Persists accent palette across all pages via localStorage.
   Floats a small panel; toggled via toolbar __activate_edit_mode.
*/
(function(){
  const KEY = 'catat.tweaks.v1';
  const PALETTES = {
    'paper': {
      label: 'Paper (default)',
      swatch: ['#c0392b','#ffea7a','#211b14'],
      vars: {
        '--marker-red':'#c0392b',
        '--marker-blue':'#2c5282',
        '--marker-green':'#2f7a5b',
        '--marker-purple':'#6b3a8c',
        '--highlight':'#ffea7a',
        '--postit':'#fff3a6',
        '--postit-pink':'#ffd1d9',
        '--postit-mint':'#c7e9d0',
        '--postit-blue':'#cfe2f7',
        '--postit-purple':'#e3d4f0',
        '--margin':'#d68a8a',
        '--rule':'#a3c4d4',
      }
    },
    'walrus': {
      label: 'Walrus blue',
      swatch: ['#1f6fb2','#9bd2ff','#0e3b66'],
      vars: {
        '--marker-red':'#1f6fb2',     /* primary accent */
        '--marker-blue':'#0e3b66',
        '--marker-green':'#1c8a7a',
        '--marker-purple':'#5b6fb2',
        '--highlight':'#9bd2ff',
        '--postit':'#cfe6fb',
        '--postit-pink':'#bfe0ff',
        '--postit-mint':'#c5e9e3',
        '--postit-blue':'#9fcdee',
        '--postit-purple':'#cdd5f0',
        '--margin':'#7fb6dd',
        '--rule':'#1f6fb2',
      }
    },
    'ocean': {
      label: 'Ocean teal',
      swatch: ['#0a7f86','#a8ecd8','#03423e'],
      vars: {
        '--marker-red':'#0a7f86',
        '--marker-blue':'#0d4d7a',
        '--marker-green':'#117a4d',
        '--marker-purple':'#3f6f8e',
        '--highlight':'#a8ecd8',
        '--postit':'#c4f0e2',
        '--postit-pink':'#cdeee5',
        '--postit-mint':'#a8e7d0',
        '--postit-blue':'#b8e2ec',
        '--postit-purple':'#cfe5e8',
        '--margin':'#6cbcb8',
        '--rule':'#0a7f86',
      }
    },
    'ink': {
      label: 'Indigo ink',
      swatch: ['#3a3a8a','#cfd8ff','#1a1a4a'],
      vars: {
        '--marker-red':'#3a3a8a',
        '--marker-blue':'#1a1a4a',
        '--marker-green':'#2c6e6a',
        '--marker-purple':'#552d80',
        '--highlight':'#cfd8ff',
        '--postit':'#dfe2ff',
        '--postit-pink':'#d6d2f5',
        '--postit-mint':'#c5e1d8',
        '--postit-blue':'#bfcdfa',
        '--postit-purple':'#d2c5ee',
        '--margin':'#7c80c4',
        '--rule':'#3a3a8a',
      }
    },
    'forest': {
      label: 'Forest pine',
      swatch: ['#2d6a3a','#daf0c5','#1a3d22'],
      vars: {
        '--marker-red':'#2d6a3a',
        '--marker-blue':'#1f5972',
        '--marker-green':'#1a3d22',
        '--marker-purple':'#5b6a2d',
        '--highlight':'#daf0c5',
        '--postit':'#e6f1c8',
        '--postit-pink':'#e2eecd',
        '--postit-mint':'#c5e6c2',
        '--postit-blue':'#cce4cb',
        '--postit-purple':'#d6e3c2',
        '--margin':'#8aab6e',
        '--rule':'#2d6a3a',
      }
    },
    'sunset': {
      label: 'Sunset coral',
      swatch: ['#e26432','#ffd9a0','#7a2a14'],
      vars: {
        '--marker-red':'#e26432',
        '--marker-blue':'#a14a2c',
        '--marker-green':'#a06b1f',
        '--marker-purple':'#8c3a3a',
        '--highlight':'#ffd9a0',
        '--postit':'#ffe2b8',
        '--postit-pink':'#ffd0c4',
        '--postit-mint':'#f0d8a8',
        '--postit-blue':'#fbd5c0',
        '--postit-purple':'#f3cdb8',
        '--margin':'#e8a37c',
        '--rule':'#e26432',
      }
    },
  };

  let state = { palette: 'paper' };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch(e){}

  // Inject style override
  const styleEl = document.createElement('style');
  styleEl.id = '__catat_tweak_overrides';
  document.head.appendChild(styleEl);

  function applyPalette(name){
    const p = PALETTES[name] || PALETTES.paper;
    const lines = Object.entries(p.vars).map(([k,v])=>`${k}:${v} !important;`).join('');
    styleEl.textContent = `:root{${lines}}`;
  }
  applyPalette(state.palette);

  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
  }

  // ---- Panel UI ----
  let panelOpen = false;
  let panel;
  function ensurePanel(){
    if (panel) return panel;
    panel = document.createElement('div');
    panel.id = '__catat_tweaks';
    panel.innerHTML = `
      <style>
        #__catat_tweaks{position:fixed;right:18px;bottom:18px;z-index:9999;width:300px;background:var(--paper-2,#fbf5dc);border:2.5px solid var(--ink,#211b14);border-radius:12px;box-shadow:6px 6px 0 var(--ink,#211b14);padding:16px 18px 14px;font-family:var(--body,"Patrick Hand",sans-serif);color:var(--ink,#211b14);transform:rotate(-.5deg);display:none}
        #__catat_tweaks.open{display:block;animation:__catat_pop .18s ease-out}
        @keyframes __catat_pop{from{transform:rotate(-.5deg) translateY(8px);opacity:0}to{transform:rotate(-.5deg) translateY(0);opacity:1}}
        #__catat_tweaks h4{font-family:var(--hand,"Caveat",cursive);font-weight:700;font-size:28px;margin:0 0 2px;line-height:1}
        #__catat_tweaks .sub{font-family:var(--type,"Special Elite",monospace);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--pencil,#6b665e);margin-bottom:12px;border-bottom:1.5px dashed var(--ink,#211b14);padding-bottom:8px;display:flex;justify-content:space-between;align-items:center}
        #__catat_tweaks .x{cursor:pointer;font-family:var(--hand,cursive);font-size:18px;color:var(--marker-red,#c0392b);text-transform:none;letter-spacing:0;padding:0 4px}
        #__catat_tweaks .x:hover{color:var(--ink,#211b14)}
        #__catat_tweaks .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
        #__catat_tweaks .opt{background:var(--paper,#f4ecd6);border:1.8px solid var(--ink,#211b14);border-radius:8px;padding:8px 10px;cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;transition:transform .1s,box-shadow .1s}
        #__catat_tweaks .opt:hover{transform:translate(-1px,-1px);box-shadow:2px 2px 0 var(--ink,#211b14)}
        #__catat_tweaks .opt.on{background:var(--postit,#fff3a6);box-shadow:3px 3px 0 var(--marker-red,#c0392b)}
        #__catat_tweaks .sw{display:flex;flex-direction:column;gap:1px;flex:none}
        #__catat_tweaks .sw i{display:block;width:18px;height:6px;border:1px solid rgba(33,27,20,.4);border-radius:1px}
        #__catat_tweaks .lb{font-family:var(--hand,cursive);font-size:18px;line-height:1;color:var(--ink,#211b14)}
        #__catat_tweaks .foot{margin-top:10px;font-family:var(--type,monospace);font-size:10px;letter-spacing:.06em;color:var(--pencil,#6b665e);line-height:1.4;border-top:1px dashed var(--line,#cdbf94);padding-top:8px}
      </style>
      <div class="sub"><span>Tweaks · accent palette</span><span class="x" id="__catat_x">close ✕</span></div>
      <h4>Pick a vibe</h4>
      <div class="grid" id="__catat_grid"></div>
      <div class="foot">Saved per browser. Carries across every catat page.</div>
    `;
    document.body.appendChild(panel);

    const grid = panel.querySelector('#__catat_grid');
    Object.entries(PALETTES).forEach(([key,p])=>{
      const b = document.createElement('button');
      b.className = 'opt' + (state.palette===key?' on':'');
      b.dataset.key = key;
      b.innerHTML = `<span class="sw">${p.swatch.map(c=>`<i style="background:${c}"></i>`).join('')}</span><span class="lb">${p.label}</span>`;
      b.addEventListener('click',()=>{
        state.palette = key;
        persist();
        applyPalette(key);
        panel.querySelectorAll('.opt').forEach(o=>o.classList.toggle('on', o.dataset.key===key));
      });
      grid.appendChild(b);
    });

    panel.querySelector('#__catat_x').addEventListener('click', close);
    return panel;
  }
  function open(){ ensurePanel(); panel.classList.add('open'); panelOpen = true; }
  function close(){
    if (panel) panel.classList.remove('open');
    panelOpen = false;
    try { window.parent.postMessage({type:'__edit_mode_dismissed'},'*'); } catch(e){}
  }

  // ---- Host protocol ----
  window.addEventListener('message', (e)=>{
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') open();
    else if (d.type === '__deactivate_edit_mode') close();
  });
  try { window.parent.postMessage({type:'__edit_mode_available'},'*'); } catch(e){}
})();
