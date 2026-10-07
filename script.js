const SPRITE = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const ARTE = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const TIPOS = {normal:['Normal','#a8a77a'],fire:['Fogo','#ee8130'],water:['Água','#6390f0'],electric:['Elétrico','#d4a900'],grass:['Planta','#7ac74c'],ice:['Gelo','#5fb8b3'],fighting:['Lutador','#c22e28'],poison:['Veneno','#a33ea1'],ground:['Terra','#c9a13f'],flying:['Voador','#a98ff3'],psychic:['Psíquico','#f95587'],bug:['Inseto','#a6b91a'],rock:['Pedra','#b6a136'],ghost:['Fantasma','#735797'],dragon:['Dragão','#6f35fc'],dark:['Sombrio','#705746'],steel:['Aço','#8e8ea8'],fairy:['Fada','#d685ad']};
const $ = s => document.querySelector(s);
let D, BASE, P = [], M = {};
let est = { q: '', tro: new Set(), jogo: '', tipo: '', todos: false };

function el(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
const sem = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

const cache = JSON.parse(localStorage.getItem('pk4') || '{}');
async function infoDe(id) {
  if (cache[id]) return cache[id];
  try {
    const d = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();
    const esp = d.species.name, suf = d.name.startsWith(esp + '-') ? d.name.slice(esp.length + 1) : '';
    cache[id] = { nome: esp.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ') + (suf ? ` (${suf.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ')})` : ''), tipos: d.types.map(t => t.type.name), stats: d.stats.map(x => x.base_stat) };
    localStorage.setItem('pk4', JSON.stringify(cache));
    return cache[id];
  } catch { return { nome: `#${id}`, tipos: [] }; }
}

function contar(dados) {
  const c = {};
  const get = id => (c[id] ??= { t: {} });
  const soma = (id, t, n = 1) => { const p = get(id); p.t[t] = (p.t[t] || 0) + n; };
  dados.jogos.forEach(j => {
    j.time.forEach(id => soma(id, j.trofeu));
    (j.extras || []).forEach(e => soma(e.pokemon, e.trofeu));
    (j.caidos || []).forEach(c => soma(c.id, 'medalha-nuzlocke'));
  });
  (dados.individuais || []).forEach(e => soma(e.pokemon, e.trofeu, e.quantidade || 1));
  return c;
}

function trofeu(t, n, grande) {
  const b = el('span', 'badge' + (grande ? ' grande' : ''));
  const ic = el('span', 'tro');
  ic.tabIndex = 0;
  ic.dataset.nome = t.nome;
  const img = new Image();
  img.alt = t.nome;
  img.onerror = () => { img.remove(); ic.classList.add('sem-img'); };
  img.src = t.imagem;
  ic.append(img);
  if (grande && n != null) ic.append(el('span', 'qtd', n));
  b.append(ic);
  if (!grande && n != null) b.append(String(n));
  return b;
}

function sprite(id, nome) {
  const i = new Image();
  i.className = 'spr';
  i.alt = nome;
  i.loading = 'lazy'; i.decoding = 'async';
  i.src = SPRITE(id);
  return i;
}

function badges(cont, cls) {
  const bs = el('div', 'badges' + (cls ? ' ' + cls : ''));
  D.trofeus.forEach(t => {
    const n = cont.t[t.id];
    if (n) bs.append(trofeu(t, n, cls !== 'mini'));
  });
  return bs;
}

function tipoChip(t) {
  const [nome, cor] = TIPOS[t] || [t, '#777'];
  const s = el('span', 'tipo', nome);
  s.style.background = cor;
  return s;
}

const EST = [['HP', 0], ['Ataque', 1], ['Defesa', 2], ['Velocidade', 5], ['Def. Esp.', 4], ['Atq. Esp.', 3]];
function radar(s) {
  const cx = 160, cy = 125, R = 80;
  const xy = (i, k) => { const a = -Math.PI / 2 + i * Math.PI / 3; return [cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k]; };
  const poli = k => EST.map((_, i) => xy(i, k).map(v => v.toFixed(1)).join(',')).join(' ');
  const val = EST.map(([, j], i) => xy(i, Math.min(s[j], 160) / 160).map(v => v.toFixed(1)).join(',')).join(' ');
  const eixos = EST.map((_, i) => { const [x, y] = xy(i, 1); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="r-e"/>`; }).join('');
  const rot = EST.map(([n, j], i) => { const [x, y] = xy(i, (R + 28) / R); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" class="r-n">${n}</text><text x="${x.toFixed(1)}" y="${(y + 16).toFixed(1)}" text-anchor="middle" class="r-v">${s[j]}</text>`; }).join('');
  return `<svg viewBox="0 0 320 250" class="radar" role="img" aria-label="Status base"><polygon points="${poli(1)}" class="r-f"/><polygon points="${poli(.5)}" class="r-f2"/>${eixos}<polygon points="${val}" class="r-p"/>${rot}</svg>`;
}

function abrir(p) {
  const d = $('#perfil');
  d.replaceChildren();
  d.style.setProperty('--tc', (TIPOS[p.tipos[0]] || [0, '#2196F3'])[1]);
  const x = el('button', 'fechar', '×');
  x.setAttribute('aria-label', 'Fechar');
  x.onclick = () => d.close();
  const arte = new Image();
  arte.className = 'p-arte';
  arte.alt = p.nome;
  arte.onerror = () => { arte.onerror = null; arte.src = SPRITE(p.id); };
  arte.src = ARTE(p.id);
  const tipos = el('div', 'tipos');
  p.tipos.forEach(t => tipos.append(tipoChip(t)));
  const ap = [...new Set(p.apelidos)];
  const info = el('div');
  info.append(el('p', 'p-dex', `Nº ${p.id}, ${p.pos}º no ranking`), el('h2', null, p.nome), tipos);
  if (ap.length) info.append(el('p', 'p-ap', `${ap.length > 1 ? 'Apelidos usados' : 'Apelido usado'}: ${ap.join(', ')}`));
  const topo = el('div', 'p-topo');
  topo.append(arte, info);
  const tr = el('div', 'p-trofeus');
  D.trofeus.forEach(t => {
    const n = p.c.t[t.id];
    if (!n) return;
    const b = el('div', 'p-tro');
    b.append(trofeu(t, n, true), el('span', null, t.nome));
    tr.append(b);
  });
  const jg = el('ul', 'p-jogos');
  p.jogos.forEach(j => {
    const li = el('li');
    const t = D.trofeus.find(y => y.id === j.trofeu);
    if (t) li.append(trofeu(t));
    li.append(el('strong', null, j.nome));
    const a = (j.apelidos || {})[p.id];
    if (a) li.append(el('span', 'ap', `"${a}"`));
    (j.extras || []).filter(e => e.pokemon === p.id).forEach(e => {
      const tx = D.trofeus.find(y => y.id === e.trofeu);
      if (tx) li.append(trofeu(tx));
    });
    jg.append(li);
  });
  const st = [];
  if (p.stats) { const g = el('div'); g.innerHTML = radar(p.stats); st.push(el('h3', null, `Status base (total ${p.stats.reduce((a, b) => a + b, 0)})`), g); }
  d.append(x, topo, ...st, el('h3', null, 'Troféus'), tr, el('h3', null, 'Jogos em que foi campeão'), jg);
  d.showModal();
}

function filtrar() {
  const q = sem(est.q.trim());
  return P.filter(p =>
    (!q || sem(p.nome).includes(q) || p.apelidos.some(a => sem(a).includes(q)) || String(p.id) === q) &&
    [...est.tro].every(t => p.c.t[t]) &&
    (!est.jogo || p.jogos.some(j => j.nome === est.jogo)) &&
    (!est.tipo || p.tipos.includes(est.tipo)));
}

function desenhar() {
  const lista = filtrar();
  const ativo = !!(est.q || est.tro.size || est.jogo || est.tipo);
  const vis = ativo || est.todos ? lista : lista.slice(0, 12);
  const ol = $('#ranking');
  ol.replaceChildren();
  vis.forEach((p, i) => {
    const li = el('li', 'linha ' + (['ouro', 'prata', 'bronze'][p.pos - 1] || ''));
    li.style.setProperty('--i', i);
    li.tabIndex = 0;
    li.onclick = () => abrir(p);
    li.onkeydown = e => { if (e.key === 'Enter') abrir(p); };
    const info = el('div', 'info');
    info.append(el('strong', null, p.nome), el('span', null, `${p.total} ${p.total === 1 ? 'título' : 'títulos'}`));
    li.append(el('span', 'pos', p.pos), sprite(p.id, p.nome), info, badges(p.c));
    ol.append(li);
  });
  $('#contagem').textContent = ativo ? `${lista.length} de ${P.length} Pokémon` : `Mostrando ${vis.length} de ${P.length} Pokémon`;
  $('#mais').hidden = ativo || lista.length <= 12;
  $('#mais').textContent = est.todos ? 'Mostrar só os 12 primeiros' : `Mostrar todos (${lista.length})`;
  $('#limpar').hidden = !ativo;
}

function filtros() {
  montarLegenda();
  $('#f-jogo').length = 1; $('#f-tipo').length = 1; $('#f-trofeus').replaceChildren();
  D.jogos.forEach(j => $('#f-jogo').append(new Option(j.nome, j.nome)));
  Object.entries(TIPOS).forEach(([k, [n]]) => $('#f-tipo').append(new Option(n, k)));
  D.trofeus.forEach(t => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    const i = new Image();
    i.src = t.imagem;
    i.alt = '';
    b.append(i, t.nome);
    b.onclick = () => {
      est.tro.has(t.id) ? est.tro.delete(t.id) : est.tro.add(t.id);
      b.setAttribute('aria-pressed', est.tro.has(t.id));
      desenhar();
    };
    $('#f-trofeus').append(b);
  });
  $('#busca').oninput = e => { est.q = e.target.value; desenhar(); };
  $('#f-jogo').onchange = e => { est.jogo = e.target.value; desenhar(); };
  $('#f-tipo').onchange = e => { est.tipo = e.target.value; desenhar(); };
  $('#mais').onclick = () => { est.todos = !est.todos; desenhar(); };
  $('#limpar').onclick = () => {
    est = { q: '', tro: new Set(), jogo: '', tipo: '', todos: false };
    $('#busca').value = ''; $('#f-jogo').value = ''; $('#f-tipo').value = '';
    document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
    desenhar();
  };
  $('#perfil').onclick = e => { if (e.target === $('#perfil')) $('#perfil').close(); };
}

function filtrarTipo(tipo) {
  est = { q: '', tro: new Set(), jogo: '', tipo, todos: false };
  $('#busca').value = ''; $('#f-jogo').value = ''; $('#f-tipo').value = tipo;
  document.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', 'false'));
  desenhar();
  aba('ranking');
  $('#ranking-secao').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

let CN = {};
async function render(dados) {
  D = dados; M = {};
  const c = contar(D);
  const ids = Object.keys(c).map(Number);
  const infos = await Promise.all(ids.map(infoDe));
  const cai = [...new Set(D.jogos.flatMap(j => (j.caidos || []).map(x => x.id)))];
  CN = Object.fromEntries((await Promise.all(cai.map(infoDe))).map((x, i) => [cai[i], x.nome]));
  const peso = Object.fromEntries(D.trofeus.map(t => [t.id, t.peso || 1]));
  P = ids.map((id, i) => {
    const jogos = D.jogos.filter(j => j.time.includes(id) || (j.caidos || []).some(x => x.id === id)), t = c[id].t;
    return {
      id, nome: infos[i].nome, tipos: infos[i].tipos, stats: infos[i].stats, c: c[id], jogos,
      apelidos: jogos.map(j => (j.apelidos || {})[id]).filter(Boolean),
      total: Object.values(t).reduce((a, b) => a + b, 0),
      pontos: Object.entries(t).reduce((s, [k, n]) => s + n * (peso[k] || 1), 0)
    };
  });
  P.sort((a, b) => b.pontos - a.pontos || b.total - a.total);
  P.forEach((p, i) => { p.pos = i + 1; M[p.id] = p; });
  filtros(); desenhar(); estatisticas(); montarTimes(); conquistas(); inicio();
  if (!P.length) $('#contagem').textContent = dono() ? 'Você ainda não tem times. Use a aba Adicionar.' : 'Esta pessoa ainda não cadastrou times.';
  if (dono()) { if (!$('#ed-time').children.length) montarEditor(); campoExtra(); }
}

function estatisticas() {
  const box = $('#stats');
  box.replaceChildren();
  [[D.jogos.length, 'Times campeões'], [P.length, 'Pokémon usados']].forEach(([v, r]) => {
    const s = el('div', 'stat'), num = el('strong', null, '0');
    s.append(num, el('span', null, r));
    box.append(s);
    const t0 = performance.now();
    const passo = t => { const k = Math.min((t - t0) / 900, 1); num.textContent = Math.round(v * k); if (k < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  });
  const top = [...P].sort((a, b) => b.jogos.length - a.jogos.length || b.pontos - a.pontos)[0];
  if (top && top.jogos.length) {
    const s = el('div', 'stat destaque'), t = el('div'), im = new Image();
    im.src = SPRITE(top.id); im.alt = top.nome;
    t.append(el('strong', null, top.nome), el('span', null, `Mais usado: ${top.jogos.length} ${top.jogos.length === 1 ? 'time' : 'times'}`));
    s.append(im, t);
    s.onclick = () => abrir(top);
    box.append(s);
  }
  const eu = ++tokenStats;
  tiposTop(2).then(tops => {
    if (eu !== tokenStats) return;
    tops.forEach(([tipo, n], i) => {
      const s = el('div', 'stat destaque'), t = el('div');
      t.append(tipoChip(tipo), el('span', null, `${i + 1}º tipo mais usado: ${n} ${n === 1 ? 'vez' : 'vezes'}`));
      s.append(t);
      s.tabIndex = 0;
      s.title = `Ver os Pokémon do tipo ${(TIPOS[tipo] || [tipo])[0]} no ranking`;
      s.onclick = () => filtrarTipo(tipo);
      s.onkeydown = e => { if (e.key === 'Enter') filtrarTipo(tipo); };
      box.append(s);
    });
  });
}
async function tiposTop(n) {
  const pesos = {};
  await Promise.all(P.filter(p => p.jogos.length).map(async p => {
    const i = await infoDe(p.id);
    (i.tipos || []).forEach(t => { pesos[t] = (pesos[t] || 0) + p.jogos.length; });
  }));
  return Object.entries(pesos).sort((a, b) => b[1] - a[1]).slice(0, n);
}
let tokenStats = 0;

/* ===== início: conquistas, time de destaque, top 3, estado vazio ===== */
const totalTro = t => D.jogos.filter(j => j.trofeu === t.id).length
  + (t.id === 'medalha-nuzlocke' ? D.jogos.reduce((s, j) => s + (j.caidos || []).length, 0) : 0)
  + D.jogos.reduce((s, j) => s + (j.extras || []).filter(e => e.trofeu === t.id).length, 0)
  + (D.individuais || []).filter(e => e.trofeu === t.id).reduce((s, e) => s + (e.quantidade || 1), 0);

function conquistas() {
  const box = $('#conq');
  box.replaceChildren();
  if (!P.length) return;
  D.trofeus.forEach(t => {
    const n = totalTro(t);
    if (!n && /-nuzlocke$/.test(t.id)) return;
    const d = el('div', n ? '' : 'zero');
    d.title = t.nome;
    const im = new Image(); im.alt = ''; im.src = t.imagem; im.onerror = () => im.remove();
    d.append(im, el('b', null, n), el('span', null, t.nome));
    box.append(d);
  });
}

function mvpDe(j) {
  const set = new Set(Object.values(COMP).filter(Boolean));
  return ((j.extras || []).find(e => set.has(e.trofeu)) || {}).pokemon;
}

function inicio() {
  const vazio = !D.jogos.length;
  $('#dest-bloco').hidden = vazio;
  $('#vazio').hidden = !vazio;
  if (vazio) {
    $('#vazio-txt').textContent = dono() ? 'Quando você cadastrar o primeiro time, ele aparece aqui.' : 'Esta pessoa ainda não cadastrou times.';
    $('#vazio-bt').hidden = !dono();
    return;
  }
  const j = D.jogos.find(x => x.nome === ALVO.destaque) || D.jogos[0];
  const t = D.trofeus.find(y => y.id === j.trofeu);
  $('#d-nome').textContent = j.nome;
  $('#d-tr').replaceChildren();
  if (t) { const im = new Image(); im.alt = t.nome; im.src = t.imagem; im.onerror = () => im.remove(); $('#d-tr').append(im); }
  const sel = $('#d-sel');
  sel.hidden = !dono();
  if (dono()) {
    sel.replaceChildren(...D.jogos.map(x => { const o = new Option(x.nome, x.nome); o.selected = x.nome === j.nome; return o; }));
  }
  const nc = (j.caidos || []).length;
  $('#d-nome').textContent = j.nome + (nc ? `  ·  † ${nc} ${nc === 1 ? 'caiu' : 'caíram'}` : '');
  const mvp = mvpDe(j), time = $('#d-time');
  time.replaceChildren();
  j.time.forEach(id => {
    const p = M[id], ap = (j.apelidos || {})[id], m = el('div', 'membro' + (mvp === id ? ' mvp' : ''));
    if (mvp === id) { const co = el('span', 'coroa'), im = new Image(); im.src = 'img/mvp.png'; im.alt = 'MVP'; co.append(im); m.append(co); }
    const arte = new Image(); arte.className = 'arte'; arte.decoding = 'async'; arte.alt = p ? p.nome : '';
    arte.onerror = () => { arte.onerror = null; arte.src = SPRITE(id); };
    arte.src = ARTE(id);
    m.append(arte, el('b', null, ap || (p ? p.nome : '#' + id)), el('small', null, ap && p ? p.nome : '#' + id));
    if (p) m.onclick = () => abrir(p);
    time.append(m);
  });
  const top = $('#top3');
  top.replaceChildren();
  const ordem = [1, 0, 2].filter(i => P[i]);
  ordem.forEach(i => {
    const p = P[i], c = el('div', 'pod ' + ['o', 'p', 'b'][i]), im = new Image();
    im.src = ARTE(p.id); im.alt = p.nome; im.onerror = () => { im.onerror = null; im.src = SPRITE(p.id); };
    c.append(im, el('b', null, p.nome), el('small', null, `${p.total} ${p.total === 1 ? 'título' : 'títulos'}`), el('span', 'degrau', `${i + 1}º`));
    c.onclick = () => abrir(p);
    top.append(c);
  });
}

async function trocarDestaque() {
  const nome = $('#d-sel').value, msg = $('#d-msg');
  msg.textContent = 'Salvando...';
  const { error } = await sb.from('perfis').update({ destaque: nome }).eq('id', USER.id);
  if (error) { msg.textContent = /destaque/.test(error.message) ? 'Falta rodar o comando SQL da coluna "destaque" no Supabase (veja o README).' : error.message; return; }
  ALVO.destaque = nome; if (MEU) MEU.destaque = nome;
  msg.textContent = '';
  inicio();
}

/* ===== cartão para compartilhar ===== */
async function cartao() {
  const dlg = $('#dlg-cartao'), cv = $('#cartao-cv'), W = cv.width;
  cv.height = 1500;
  const g = cv.getContext('2d'), H = cv.height;
  $('#cartao-msg').textContent = '';
  dlg.showModal();
  try { await Promise.all([document.fonts.load('700 60px Silkscreen'), document.fonts.load('800 30px Nunito')]); } catch {}
  const carregar = src => new Promise(ok => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  const jogo = D.jogos.find(x => x.nome === ALVO.destaque) || D.jogos[0];
  const ids = jogo ? jogo.time.slice(0, 6) : P.slice(0, 6).map(p => p.id);
  const mvpId = jogo ? mvpDe(jogo) : null;
  const tros = D.trofeus.map(t => ({ t, n: totalTro(t) })).filter(x => x.n).sort((a, b) => (b.t.peso || 1) - (a.t.peso || 1)).slice(0, 4);
  const trJogo = jogo ? D.trofeus.find(t => t.id === jogo.trofeu) : null;
  const [foto, tipos, sprs, imgsT, bt, coroa, imTrJogo] = await Promise.all([
    ALVO.foto_url ? carregar(ALVO.foto_url) : null,
    tiposTop(2),
    Promise.all(ids.map(id => carregar(SPRITE(id)))),
    Promise.all(tros.map(x => carregar(x.t.imagem))),
    Promise.all([ALVO.beta ? carregar('img/beta.png') : null, ALVO.beta2 ? carregar('img/beta2.png') : null]).then(a => a.filter(Boolean)),
    carregar('img/mvp.png'),
    trJogo ? carregar(trJogo.imagem) : null
  ]);
  const rr = (x, y, w, h, r, fill, stroke, lw) => {
    g.beginPath(); g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 2; g.stroke(); }
  };
  const contain = (im, x, y, w, h) => { const r = Math.min(w / im.width, h / im.height); g.drawImage(im, x + (w - im.width * r) / 2, y + (h - im.height * r) / 2, im.width * r, im.height * r); };
  const rotulo = (txt, x, y) => { g.textAlign = 'left'; g.fillStyle = '#8fb8e3'; g.font = '800 24px Nunito, sans-serif'; try { g.letterSpacing = '4px'; } catch {} g.fillText(txt.toUpperCase(), x, y); try { g.letterSpacing = '0px'; } catch {} };
  g.clearRect(0, 0, W, H);
  let gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0b2d6b'); gr.addColorStop(0.55, '#071f4a'); gr.addColorStop(1, '#04122e');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createRadialGradient(180, 120, 0, 180, 120, 620); gr.addColorStop(0, '#2196F340'); gr.addColorStop(1, '#2196F300');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#90CAF90d';
  for (let x = 40; x < W; x += 40) for (let y = 40; y < H; y += 40) g.fillRect(x, y, 3, 3);
  // topo
  g.textAlign = 'left'; g.fillStyle = '#90CAF9'; g.font = '700 26px Silkscreen, monospace'; g.fillText('MEUS CAMPEÕES', 72, 96);
  g.fillStyle = '#90CAF933'; g.fillRect(72, 118, W - 144, 2);
  // perfil
  const ax = 72 + 90, ay = 262, ar = 90;
  g.save(); g.beginPath(); g.arc(ax, ay, ar, 0, Math.PI * 2); g.clip();
  if (foto) { const m = Math.min(foto.width, foto.height); g.drawImage(foto, (foto.width - m) / 2, (foto.height - m) / 2, m, m, ax - ar, ay - ar, ar * 2, ar * 2); }
  else { g.fillStyle = '#1565C0'; g.fillRect(ax - ar, ay - ar, ar * 2, ar * 2); g.fillStyle = '#E3F2FD'; g.font = '700 80px Silkscreen, monospace'; g.textAlign = 'center'; g.fillText((ALVO.nome || ALVO.username)[0].toUpperCase(), ax, ay + 28); }
  g.restore();
  const nome = ALVO.nome || ALVO.username, nx = ax + ar + 36, maxN = W - nx - 72 - bt.length * 48;
  let fs = 64; g.textAlign = 'left';
  do { g.font = `700 ${fs}px Silkscreen, monospace`; fs -= 2; } while (g.measureText(nome).width > maxN && fs > 24);
  g.fillStyle = '#fff'; g.fillText(nome, nx, ay - 6);
  bt.forEach((b, i) => { const z = b.src.includes('beta2') ? 46 : 38; contain(b, nx + g.measureText(nome).width + 14 + i * 50, ay - 6 - 40 - (z - 38) / 2, z, z); });
  g.fillStyle = '#8fb8e3'; g.font = '800 32px Nunito, sans-serif'; g.fillText('@' + ALVO.username, nx, ay + 40);
  // time de destaque: sprites em 2x, 3 por linha, sem caixas
  rotulo(jogo ? 'Time de destaque' : 'Mais campeões', 72, 440);
  if (jogo) {
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = '800 30px Nunito, sans-serif';
    g.fillText(jogo.nome, W - 72 - (imTrJogo ? 52 : 0), 440, 560);
    if (imTrJogo) contain(imTrJogo, W - 72 - 44, 402, 44, 50);
  }
  const cw = (W - 144) / 3, linhaH = 290;
  ids.forEach((id, i) => {
    const cx = 72 + (i % 3) * cw + cw / 2, y = 478 + Math.floor(i / 3) * linhaH, mvp = id === mvpId;
    if (mvp) {
      gr = g.createRadialGradient(cx, y + 100, 10, cx, y + 100, 120); gr.addColorStop(0, '#f5c54240'); gr.addColorStop(1, '#f5c54200');
      g.fillStyle = gr; g.fillRect(cx - 130, y - 20, 260, 240);
    }
    if (sprs[i]) { g.imageSmoothingEnabled = false; g.drawImage(sprs[i], cx - 96, y, 192, 192); g.imageSmoothingEnabled = true; }
    if (mvp && coroa) contain(coroa, cx + 52, y - 4, 52, 52);
    const ap = jogo && (jogo.apelidos || {})[id], p = M[id];
    g.textAlign = 'center'; g.fillStyle = mvp ? '#f5d36b' : '#fff'; g.font = '800 30px Nunito, sans-serif';
    g.fillText(ap || (p ? p.nome : nomeDe(id)), cx, y + 228, cw - 24);
    if (ap && p) { g.fillStyle = '#8fb8e3'; g.font = '700 21px Nunito, sans-serif'; g.fillText(p.nome, cx, y + 256, cw - 24); }
  });
  g.fillStyle = '#90CAF933'; g.fillRect(72, 1076, W - 144, 2);
  // números
  const tit = D.trofeus.reduce((s, t) => s + totalTro(t), 0), col = (W - 144) / 3;
  [[D.jogos.length, D.jogos.length === 1 ? 'time campeão' : 'times campeões'], [P.length, 'Pokémon usados'], [tit, tit === 1 ? 'título' : 'títulos']].forEach(([n, l], i) => {
    const cx = 72 + col / 2 + i * col;
    g.textAlign = 'center'; g.fillStyle = '#E3F2FD'; g.font = '800 84px Nunito, sans-serif'; g.fillText(String(n), cx, 1176);
    g.fillStyle = '#8fb8e3'; g.font = '700 26px Nunito, sans-serif'; g.fillText(l, cx, 1214);
  });
  g.fillStyle = '#90CAF933'; g.fillRect(72, 1252, W - 144, 2);
  // tipos (esquerda) e troféus (direita)
  rotulo('Tipos mais usados', 72, 1304);
  g.font = '800 30px Nunito, sans-serif';
  let tx = 72;
  tipos.forEach(([t]) => {
    const nm = (TIPOS[t] || [t])[0], w = g.measureText(nm).width + 52;
    rr(tx, 1326, w, 56, 14, (TIPOS[t] || [0, '#777'])[1]);
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(nm, tx + w / 2, 1364); tx += w + 12;
  });
  if (tros.length) {
    const rx = 560, item = (W - 72 - rx) / 4;
    rotulo('Troféus', rx, 1304);
    tros.forEach((x, i) => {
      const bx = rx + i * item;
      if (imgsT[i]) contain(imgsT[i], bx, 1320, 46, 70);
      g.textAlign = 'left'; g.fillStyle = '#E3F2FD'; g.font = '800 38px Nunito, sans-serif'; g.fillText(String(x.n), bx + 54, 1368);
    });
  }
  // rodapé
  g.textAlign = 'left'; g.fillStyle = '#8fb8e3'; g.font = '700 26px Nunito, sans-serif';
  g.fillText(location.href.split('#')[0].replace(/^https?:\/\//, '').replace(/index\.html$/, '') + '#/u/' + ALVO.username, 72, 1452, W - 144);
}

function iniciarExtras() {
  $('#d-sel').onchange = trocarDestaque;
  $('#d-rank').onclick = () => aba('ranking');
  $('#vazio-bt').onclick = () => aba('editar');
  $('#cartao-fechar').onclick = () => $('#dlg-cartao').close();
  $('#cartao-baixar').onclick = () => {
    try {
      $('#cartao-cv').toBlob(b => {
        if (!b) { $('#cartao-msg').textContent = 'Não foi possível gerar a imagem.'; return; }
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `campeoes-${ALVO.username}.png`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }, 'image/png');
    } catch { $('#cartao-msg').textContent = 'O navegador bloqueou a imagem. Tire um print do cartão.'; }
  };
}

/* ===== estatísticas e coleção ===== */
const GERACOES = [['I', 1, 151], ['II', 152, 251], ['III', 252, 386], ['IV', 387, 493], ['V', 494, 649], ['VI', 650, 721], ['VII', 722, 809], ['VIII', 810, 905], ['IX', 906, 1025]];
const TOTAL_POKEMON = 1025;

function barras(itens, maxFixo) {
  const box = el('div', 'barras'), max = maxFixo || Math.max(1, ...itens.map(i => i.valor));
  itens.forEach(i => {
    const r = el('div', 'gbar'), l = el('span', 'b-rot'), tr = el('span', 'b-trilho'), f = el('span', 'b-fill');
    if (i.img) { const im = new Image(); im.src = i.img; im.alt = ''; l.append(im); }
    l.append(el('span', null, i.rotulo));
    f.style.background = i.cor || 'var(--azul)';
    tr.append(f);
    r.append(l, tr, el('span', 'b-val', i.texto || i.valor));
    if (i.clique) { r.classList.add('clicavel'); r.onclick = i.clique; }
    box.append(r);
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = `${Math.max(3, i.valor / max * 100)}%`; }));
  });
  return box;
}

function cartaoEst(titulo, ...filhos) {
  const c = el('div', 'est-card');
  c.append(el('h3', null, titulo), ...filhos);
  return c;
}

function graficos() {
  const box = $('#est-box');
  box.replaceChildren();
  const usados = P.filter(p => p.jogos.length);
  if (!usados.length) { box.append(el('p', 'mut', dono() ? 'Cadastre um time para ver os gráficos.' : 'Esta pessoa ainda não cadastrou times.')); return; }

  const top = [...usados].sort((a, b) => b.jogos.length - a.jogos.length || b.pontos - a.pontos).slice(0, 10);
  box.append(cartaoEst('Pokémon mais usados', barras(top.map(p => ({
    rotulo: p.nome, valor: p.jogos.length, texto: `${p.jogos.length} ${p.jogos.length === 1 ? 'time' : 'times'}`,
    img: SPRITE(p.id), clique: () => abrir(p)
  })))));

  const tp = {};
  usados.forEach(p => (p.tipos || []).forEach(t => { tp[t] = (tp[t] || 0) + p.jogos.length; }));
  const tipos = Object.entries(tp).sort((a, b) => b[1] - a[1]);
  box.append(cartaoEst('Tipos mais usados', barras(tipos.map(([t, n]) => ({
    rotulo: (TIPOS[t] || [t])[0], valor: n, texto: n, cor: (TIPOS[t] || [0, '#777'])[1], clique: () => filtrarTipo(t)
  })))));

  const ids = new Set(P.map(p => p.id).filter(i => i <= TOTAL_POKEMON)), tem = ids.size;
  const geral = el('div', 'colecao-topo');
  geral.append(el('strong', null, tem), el('span', null, ` de ${TOTAL_POKEMON} Pokémon (${(tem / TOTAL_POKEMON * 100).toFixed(1).replace('.', ',')}%)`));
  const porGer = GERACOES.map(([n, a, b]) => {
    let c = 0; for (const i of ids) if (i >= a && i <= b) c++;
    return { rotulo: `Geração ${n}`, valor: c / (b - a + 1) * 100, texto: `${c}/${b - a + 1}` };
  });
  const cartaoCol = cartaoEst('Coleção', geral, barras(porGer, 100));
  cartaoCol.classList.add('larga');
  box.append(cartaoCol);
}

let atual = 0;
const grupoDe = j => D.jogos.filter(x => baseDe(x.nome) === baseDe(j.nome)).sort((p, q) => p.nome.localeCompare(q.nome));
function montarTimes() {
  $('#linha-tempo').replaceChildren();
  if (!D.jogos.length) { $('#palco').replaceChildren(el('p', 'mut', 'Nenhum time cadastrado ainda.')); return; }
  const vistos = new Set();
  D.jogos.forEach((j, i) => {
    const base = baseDe(j.nome);
    if (vistos.has(base)) return;
    vistos.add(base);
    const b = el('button', 'marco');
    b.type = 'button';
    b.dataset.base = base;
    b.style.setProperty('--i', i);
    const t = D.trofeus.find(y => y.id === j.trofeu);
    if (t) { const im = new Image(); im.src = t.imagem; im.alt = ''; b.append(im); }
    b.append(base.replace(/^Pokémon /, ''));
    b.onclick = () => palco(D.jogos.indexOf(grupoDe(j)[0]));
    $('#linha-tempo').append(b);
  });
  palco(Math.min(atual, D.jogos.length - 1));
}

function palco(i) {
  atual = (i + D.jogos.length) % D.jogos.length;
  const j = D.jogos[atual];
  document.querySelectorAll('.marco').forEach(b => {
    const on = b.dataset.base === baseDe(j.nome);
    b.setAttribute('aria-pressed', on);
    if (on) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  });
  const t = D.trofeus.find(y => y.id === j.trofeu);
  const ant = el('button', 'seta', '‹'), prox = el('button', 'seta', '›');
  ant.setAttribute('aria-label', 'Anterior'); prox.setAttribute('aria-label', 'Próximo');
  ant.onclick = () => palco(atual - 1); prox.onclick = () => palco(atual + 1);
  const tit = el('div', 'titulo');
  if (t) tit.append(trofeu(t));
  tit.append(el('h3', null, j.nome));
  const hd = el('header');
  hd.append(ant, tit, prox);
  const time = el('div', 'time');
  const mvpSet = new Set(Object.values(COMP).filter(Boolean));
  const mvpId = ((j.extras || []).find(e => mvpSet.has(e.trofeu)) || {}).pokemon;
  j.time.forEach((id, k) => {
    const p = M[id], m = el('div', 'membro');
    if (id === mvpId) { m.classList.add('mvp'); const co = el('span', 'coroa'); co.title = 'MVP da edição'; co.innerHTML = '<img src="img/mvp.png" alt="MVP">'; m.append(co); }
    m.tabIndex = 0;
    m.style.setProperty('--i', k);
    m.onclick = () => abrir(p);
    m.onkeydown = e => { if (e.key === 'Enter') abrir(p); };
    m.append(sprite(id, p.nome), el('strong', null, p.nome));
    const a = (j.apelidos || {})[id];
    if (a) m.append(el('span', 'ap', `"${a}"`));
    m.append(badges(p.c, 'mini'));
    time.append(m);
  });
  const nos = [hd];
  if (dono()) {
    const ac = el('div', 'acoes'), be = el('button', null, 'Editar'), bx = el('button', 'perigo', 'Excluir');
    be.onclick = () => editar(j); bx.onclick = () => excluir(j);
    ac.append(be, bx);
    nos.push(ac);
  }
  const grupo = grupoDe(j);
  if (grupo.length > 1) {
    const sel = el('div', 'seletor-time');
    grupo.forEach((g, n) => {
      const bt = el('button', null, n + 1);
      bt.type = 'button'; bt.title = `${n + 1}º time`; bt.setAttribute('aria-label', `${n + 1}º time`);
      bt.setAttribute('aria-pressed', g === j);
      bt.onclick = () => palco(D.jogos.indexOf(g));
      sel.append(bt);
    });
    nos.push(sel);
  }
  nos.push(time);
  if ((j.caidos || []).length) {
    const cem = el('div', 'cemiterio');
    cem.append(el('h4', null, `† Cemitério (${j.caidos.length})`));
    const lista = el('div', 'cem-lista');
    j.caidos.forEach(c => {
      const m = el('div', 'cem-item');
      const tm = D.trofeus.find(y => y.id === 'medalha-nuzlocke'), fig = el('span', 'cem-fig');
      fig.append(sprite(c.id, CN[c.id] || ''));
      if (tm) { const md = new Image(); md.className = 'cem-medalha'; md.alt = tm.nome; md.title = tm.nome; md.src = tm.imagem; fig.append(md); }
      m.append(fig, el('strong', null, c.ap || CN[c.id] || '#' + c.id));
      if (c.ap) m.append(el('small', null, CN[c.id] || ''));
      lista.append(m);
    });
    cem.append(lista);
    nos.push(cem);
  }
  $('#palco').replaceChildren(...nos);
}

function aba(n) {
  ['inicio', 'ranking', 'estatisticas', 'insignias', 'times', 'editar', 'seguindo'].forEach(k => {
    $('#' + k + '-secao').hidden = k !== n;
    document.querySelector(`[data-aba=${k}]`).setAttribute('aria-selected', k === n);
  });
  try { const b = document.querySelector(`[data-aba=${n}]`), r = b.parentElement; r.scrollTo({ left: b.offsetLeft - (r.clientWidth - b.offsetWidth) / 2, behavior: 'smooth' }); } catch (e) {}
  if (n === 'times' && D && D.jogos.length) palco(atual);
  if (n === 'seguindo') listarSeguindo();
  if (n === 'estatisticas') graficos();
  if (n === 'insignias') insignias();
}
document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => aba(b.dataset.aba));
document.addEventListener('keydown', e => {
  if ($('#times-secao').hidden || $('#perfil').open || /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') palco(atual + 1);
  if (e.key === 'ArrowLeft') palco(atual - 1);
});

// ---------- Editor de times (dono do perfil) ----------
let edit = null;
const ORDEM = { liga: 0, 'liga-nuzlocke': 0, craft: 1, pokerogue: 2, medalha: 3 };
const COMP = { craft: 'bola-ouro-craft', liga: 'bola-ouro-liga', medalha: null, pokerogue: 'pokerogue-mvp', 'liga-nuzlocke': 'bola-ouro-liga-nuzlocke' };
const NZ = ': Nuzlocke', MAX_TIMES = 3, MAX_CEM = 60;
const baseDe = n => n.replace(/ \((\d)º time\)$/, '');
const nuzOn = () => !!$('#ed-nz').checked && !$('#ed-nz-l').hidden;
const chaveEf = () => $('#ed-trofeu').value + (nuzOn() ? '-nuzlocke' : '');
// escolhe o nome livre: "X", "X (2º time)", "X (3º time)"
function nomeLivre(base, proprio) {
  const outros = D.jogos.filter(j => !(edit && j.id === edit.id)).map(j => j.nome);
  if (proprio && baseDe(proprio) === base) return proprio;
  const opcoes = [base, `${base} (2º time)`, `${base} (3º time)`];
  return opcoes.find(o => !outros.includes(o)) || null;
}
const JOGOS = ['Red', 'Blue', 'Yellow', 'Gold', 'Silver', 'Crystal', 'Ruby', 'Sapphire', 'Emerald', 'FireRed', 'LeafGreen', 'Diamond', 'Pearl', 'Platinum', 'HeartGold', 'SoulSilver', 'Black', 'White', 'Black 2', 'White 2', 'X', 'Y', 'Omega Ruby', 'Alpha Sapphire', 'Sun', 'Moon', 'Ultra Sun', 'Ultra Moon', "Let's Go, Pikachu!", "Let's Go, Eevee!", 'Sword', 'Shield', 'Brilliant Diamond', 'Shining Pearl', 'Legends: Arceus', 'Scarlet', 'Violet', 'Legends: Z-A'];

/* ===== Pokédex por jogo ===== */
const DEX = {
  'Red': [2], 'Blue': [2], 'Yellow': [2], 'FireRed': [2], 'LeafGreen': [2],
  'Gold': [3], 'Silver': [3], 'Crystal': [3], 'HeartGold': [7], 'SoulSilver': [7],
  'Ruby': [4], 'Sapphire': [4], 'Emerald': [4], 'Omega Ruby': [15], 'Alpha Sapphire': [15],
  'Diamond': [5], 'Pearl': [5], 'Platinum': [6], 'Brilliant Diamond': 'ate493', 'Shining Pearl': 'ate493',
  'Black': [8], 'White': [8], 'Black 2': [9], 'White 2': [9],
  'X': [12, 13, 14], 'Y': [12, 13, 14],
  'Sun': [16], 'Moon': [16], 'Ultra Sun': [21], 'Ultra Moon': [21],
  "Let's Go, Pikachu!": [26], "Let's Go, Eevee!": [26],
  'Sword': [27, 28, 29], 'Shield': [27, 28, 29], 'Legends: Arceus': [30],
  'Scarlet': [31, 32, 33], 'Violet': [31, 32, 33], 'Legends: Z-A': [34, 35]
};
let ESP = {}, DEXC = {};
try { ESP = JSON.parse(localStorage.getItem('esp1') || '{}'); DEXC = JSON.parse(localStorage.getItem('dex2') || '{}'); } catch {}
const idUrl = u => +u.split('/').filter(Boolean).pop();
const bonito = n => n.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' ');
let FORMAS = [];
try { FORMAS = JSON.parse(localStorage.getItem('formas1') || '[]'); } catch {}
const FORMA = {};
FORMAS.forEach(f => { FORMA[f[0]] = f; });
const nomeDe = id => {
  if (FORMA[id]) { const [, n, sp] = FORMA[id], b = ESP[sp] || ''; return bonito(b) + ` (${bonito(n.slice(b.length + 1))})`; }
  return ESP[id] ? bonito(ESP[id]) : (M[id] && M[id].nome) || '#' + id;
};
const FORMA_RUIM = /-(mega|mega-[xyz]|gmax|primal|totem|totem-\w+|cap|\w+-cap|cosplay|rock-star|belle|pop-star|phd|libre|starter|eternamax|battle-bond|busted|school|meteor|hangry|ultra|terastal|stellar|\w*power-construct|dada|ash|gulping|gorging|antique|zero-hero|hero|low-power)$|-(mega|gmax|totem|cap)-|-starter|-gmax/;
const REGIAO = { alola: ['Sun', 'Moon', 'Ultra Sun', 'Ultra Moon', "Let's Go, Pikachu!", "Let's Go, Eevee!"], galar: ['Sword', 'Shield'], hisui: ['Legends: Arceus', 'Scarlet', 'Violet'], paldea: ['Scarlet', 'Violet'] };
async function carregarFormas() {
  if (FORMAS.length) return FORMAS;
  const esp = await idsDex('todos');
  const nomes = esp.map(i => [i, ESP[i]]).sort((a, b) => b[1].length - a[1].length);
  const r = await (await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000')).json();
  FORMAS = r.results.map(x => [idUrl(x.url), x.name]).filter(([id, n]) => id > 10000 && !FORMA_RUIM.test(n))
    .map(([id, n]) => { const sp = nomes.find(([, nm]) => n.startsWith(nm + '-')); return sp ? [id, n, sp[0]] : null; }).filter(Boolean);
  FORMAS.forEach(f => { FORMA[f[0]] = f; });
  try { localStorage.setItem('formas1', JSON.stringify(FORMAS)); } catch {}
  return FORMAS;
}
function formaPermitida(f, jogo) {
  const suf = f[1].slice((ESP[f[2]] || '').length + 1), reg = suf.split('-')[0];
  if (REGIAO[reg]) return jogo === 'todos' || REGIAO[reg].includes(jogo);
  return true;
}

async function idsDex(chave) {
  if (DEXC[chave]) return DEXC[chave];
  let ids;
  if (chave === 'todos') {
    const r = await (await fetch('https://pokeapi.co/api/v2/pokemon-species?limit=2000')).json();
    ids = r.results.map(x => { const id = idUrl(x.url); ESP[id] = x.name; return id; }).sort((a, b) => a - b);
  } else {
    const r = await (await fetch(`https://pokeapi.co/api/v2/pokedex/${chave}`)).json();
    ids = r.pokemon_entries.map(e => { const id = idUrl(e.pokemon_species.url); ESP[id] = e.pokemon_species.name; return id; });
  }
  DEXC[chave] = ids;
  try { localStorage.setItem('dex2', JSON.stringify(DEXC)); localStorage.setItem('esp1', JSON.stringify(ESP)); } catch {}
  return ids;
}
async function listaDex(def, jogo) {
  let base;
  if (def === 'todos') base = await idsDex('todos');
  else if (def === 'ate493') base = (await idsDex('todos')).filter(i => i <= 493);
  else base = [...new Set((await Promise.all(def.map(idsDex))).flat())];
  let formas = [];
  try { formas = await carregarFormas(); } catch {}
  const por = {};
  formas.filter(f => formaPermitida(f, jogo)).forEach(f => { (por[f[2]] ||= []).push(f[0]); });
  return base.flatMap(i => [i, ...(por[i] || [])]);
}
function defDex() {
  const k = $('#ed-trofeu').value, v = ($('#ed-extra-campo') || {}).value;
  if (k === 'craft' || k === 'pokerogue' || $('#dex-todos').checked) return { def: 'todos', jogo: 'todos', titulo: 'Todos os Pokémon' };
  if (k === 'medalha') return { def: DEX['Legends: Z-A'], jogo: 'Legends: Z-A', titulo: 'Pokédex de Pokémon Legends: Z-A' };
  if (!v) return null;
  return { def: DEX[v] || 'todos', jogo: v, titulo: `Pokédex de Pokémon ${v}` };
}

/* ===== time em montagem ===== */
let SLOTS = Array(6).fill(null), tokenDex = 0;

function desenharSlots() {
  const box = $('#ed-time'), mvpOk = !!COMP[chaveEf()];
  box.replaceChildren();
  SLOTS.forEach((s, i) => {
    const r = el('div', 'slot' + (s ? '' : ' vazio')), bola = el('span', 'bola');
    if (s) { const im = new Image(); im.src = SPRITE(s.id); im.alt = ''; bola.append(im); } else bola.textContent = i + 1;
    r.append(bola, el('span', 'nm', s ? nomeDe(s.id) : 'Escolha na Pokédex abaixo'));
    if (s) {
      const ap = el('input', 'ap'), m = el('label', 'ed-mvp'), c = el('input'), x = el('button', 'rm', '×');
      ap.placeholder = 'Apelido (opcional)'; ap.value = s.ap || ''; ap.maxLength = 24;
      ap.oninput = () => { s.ap = ap.value; };
      c.type = 'checkbox'; c.checked = !!s.mvp;
      c.onchange = () => { SLOTS.forEach(o => { if (o) o.mvp = false; }); s.mvp = c.checked; desenharSlots(); };
      m.append(c, ' MVP'); m.hidden = !mvpOk;
      x.type = 'button'; x.title = 'Tirar do time'; x.setAttribute('aria-label', 'Tirar do time');
      x.onclick = () => { SLOTS[i] = null; desenharSlots(); marcarDex(); };
      r.append(ap, m, x);
    }
    box.append(r);
  });
}

function marcarDex() {
  const no = new Set(SLOTS.filter(Boolean).map(s => s.id));
  document.querySelectorAll('#dex-grade .tile').forEach(t => t.classList.toggle('no-time', no.has(+t.dataset.id)));
}

let CEM = [], alvoDex = 'time';
function desenharCem() {
  const box = $('#ed-cem'), nz = nuzOn();
  $('#cem-bloco').hidden = !nz; $('#dex-alvo').hidden = !nz;
  if (!nz) alvoDex = 'time';
  document.querySelectorAll('#dex-alvo button').forEach(b => b.setAttribute('aria-pressed', b.dataset.alvo === alvoDex));
  box.replaceChildren();
  if (!CEM.length) box.append(el('p', 'mut', 'Ninguém caiu ainda. Troque para "Cemitério" acima da Pokédex e clique nos Pokémon que morreram.'));
  CEM.forEach((c, i) => {
    const r = el('div', 'cem-lin'), im = new Image(), ap = el('input'), x = el('button', 'rm', '×');
    im.src = SPRITE(c.id); im.alt = '';
    ap.placeholder = 'Apelido (opcional)'; ap.value = c.ap || ''; ap.maxLength = 24; ap.oninput = () => { c.ap = ap.value; };
    x.type = 'button'; x.title = 'Tirar do cemitério'; x.setAttribute('aria-label', 'Tirar do cemitério');
    x.onclick = () => { CEM.splice(i, 1); desenharCem(); };
    r.append(im, el('span', 'nm', nomeDe(c.id)), ap, x);
    box.append(r);
  });
}

function adicionar(id) {
  const msg = $('#ed-msg');
  if (alvoDex === 'cem' && nuzOn()) {
    if (CEM.some(c => c.id === id)) return void (msg.textContent = `${nomeDe(id)} já está no cemitério.`);
    if (SLOTS.some(s => s && s.id === id)) return void (msg.textContent = `${nomeDe(id)} está no time. Tire do time primeiro.`);
    if (CEM.length >= MAX_CEM) return void (msg.textContent = `O cemitério aceita até ${MAX_CEM} Pokémon.`);
    CEM.push({ id, ap: '' }); msg.textContent = '';
    desenharCem(); return;
  }
  if (CEM.some(c => c.id === id)) return void (msg.textContent = `${nomeDe(id)} está no cemitério.`);
  if (SLOTS.some(s => s && s.id === id)) return void (msg.textContent = `${nomeDe(id)} já está no time.`);
  const i = SLOTS.findIndex(s => !s);
  if (i < 0) return void (msg.textContent = 'O time já tem 6 Pokémon. Tire um para trocar.');
  SLOTS[i] = { id, ap: '', mvp: false };
  msg.textContent = '';
  desenharSlots(); marcarDex();
}

async function desenharDex() {
  const eu = ++tokenDex, g = $('#dex-grade'), msg = $('#dex-msg'), k = $('#ed-trofeu').value;
  $('#dex-todos-l').hidden = k === 'craft' || k === 'pokerogue';
  const d = defDex();
  if (!d) { g.replaceChildren(); $('#dex-titulo').textContent = 'Pokédex'; msg.textContent = 'Escolha a versão do jogo para ver os Pokémon disponíveis.'; return; }
  $('#dex-titulo').textContent = d.titulo;
  msg.textContent = 'Carregando...';
  let ids;
  try { ids = await listaDex(d.def, d.jogo); }
  catch { if (eu === tokenDex) { g.replaceChildren(); msg.textContent = 'Não consegui carregar a Pokédex agora. Confira a internet e troque a versão para tentar de novo.'; } return; }
  if (eu !== tokenDex) return;
  const q = sem($('#dex-q').value.trim());
  const lista = ids.filter(id => !q || sem(nomeDe(id)).includes(q) || String(id) === q);
  g.replaceChildren(...lista.map(id => {
    const t = el('button', 'tile'), im = new Image();
    t.type = 'button'; t.dataset.id = id; t.title = id > 10000 ? nomeDe(id) : `${nomeDe(id)} (Nº ${id})`;
    im.src = SPRITE(id); im.alt = ''; im.loading = 'lazy';
    t.append(im, el('span', null, nomeDe(id)));
    t.onclick = () => adicionar(id);
    return t;
  }));
  msg.textContent = lista.length ? `${lista.length} Pokémon. Clique para adicionar ao time.` : 'Nenhum Pokémon encontrado.';
  marcarDex();
}

function campoExtra() {
  const k = $('#ed-trofeu').value, box = $('#ed-extra'), pref = { craft: 'Copa Craft', pokerogue: 'Copa PokéRogue' }[k];
  box.replaceChildren();
  let c;
  if (pref) {
    c = el('select');
    const re = new RegExp(`^${pref}: (\\d+)ª`);
    const ed = D.jogos.map(j => +(re.exec(j.nome) || [])[1]).filter(Boolean);
    const n = Math.max(k === 'craft' ? 4 : 2, Math.max(0, ...ed) + 1);
    for (let i = 1; i <= n; i++) c.append(new Option(`${i}ª edição`, i));
  } else if (k === 'medalha') {
    c = el('input'); c.value = 'Pokémon Legends: Z-A'; c.disabled = true;
  } else {
    c = el('select');
    c.append(new Option('Escolha o jogo (versão)', ''));
    JOGOS.forEach(j => c.append(new Option(j, j)));
    c.onchange = () => { $('#dex-todos').checked = false; desenharDex(); };
  }
  c.id = 'ed-extra-campo';
  box.append(c);
  const podeNz = k === 'liga';
  $('#ed-nz-l').hidden = !podeNz;
  if (!podeNz) $('#ed-nz').checked = false;
  desenharCem();
  if (!COMP[k]) SLOTS.forEach(s => { if (s) s.mvp = false; });
  desenharSlots(); desenharDex();
}

function montarEditor() {
  const s = $('#ed-trofeu');
  Object.keys(COMP).filter(k => !k.endsWith('-nuzlocke')).forEach(k => { const t = D.trofeus.find(x => x.id === k); if (t) s.append(new Option(t.nome, k)); });
  s.onchange = () => { $('#dex-todos').checked = false; campoExtra(); };
  $('#ed-nz').onchange = () => { SLOTS.forEach(o => { if (o && !COMP[chaveEf()]) o.mvp = false; }); desenharCem(); desenharSlots(); };
  document.querySelectorAll('#dex-alvo button').forEach(b => { b.onclick = () => { alvoDex = b.dataset.alvo; desenharCem(); }; });
  $('#dex-q').oninput = desenharDex;
  $('#dex-todos').onchange = desenharDex;
  $('#ed-salvar').onclick = salvarTime;
  $('#ed-cancelar').onclick = () => { sairEdicao(); limparForm(); };
  $('#ed-baixar').onclick = baixar;
  $('#imp-arq').onchange = importar;
  desenharSlots();
}

async function salvarTime() {
  const msg = $('#ed-msg'), kb = $('#ed-trofeu').value, k = chaveEf(), nz = nuzOn(), v = $('#ed-extra-campo').value.trim();
  const ed = { craft: 'Copa Craft', pokerogue: 'Copa PokéRogue' }[kb];
  let base = ed ? `${ed}: ${v}ª edição` : kb === 'medalha' ? 'Pokémon Legends: Z-A' : v && (/^pok[eé]mon\b/i.test(v) ? v : `Pokémon ${v}`);
  if (!base) return void (msg.textContent = 'Escolha o jogo (versão).');
  if (nz) base += NZ;
  const cheio = SLOTS.filter(Boolean), time = cheio.map(s => s.id), apelidos = {}, extras = [];
  cheio.forEach(s => {
    if (s.ap && s.ap.trim()) apelidos[s.id] = s.ap.trim();
    if (s.mvp && COMP[k]) extras.push({ pokemon: s.id, trofeu: COMP[k] });
  });
  if (!time.length) return void (msg.textContent = 'Adicione pelo menos um Pokémon.');
  const nome = nomeLivre(base, edit && edit.nome);
  if (!nome) return void (msg.textContent = `Você já tem ${MAX_TIMES} times em ${base}. Edite ou exclua um deles.`);
  const mvps = Object.values(COMP);
  const novo = { nome, trofeu: k, time, apelidos, extras: [...(edit ? (edit.extras || []).filter(e => !mvps.includes(e.trofeu)) : []), ...extras] };
  if (nz) novo.caidos = CEM.map(c => ({ id: c.id, ...(c.ap && c.ap.trim() ? { ap: c.ap.trim() } : {}) }));
  else if (edit && edit.caidos) novo.caidos = [];
  msg.textContent = 'Salvando...';
  const r = edit ? await sb.from('jogos').update(novo).eq('id', edit.id) : await sb.from('jogos').insert({ ...novo, user_id: USER.id });
  if (r.error) return void (msg.textContent = /caidos/.test(r.error.message) ? 'Falta rodar o SQL novo no Supabase (veja o README).' : r.error.message);
  sairEdicao(); limparForm();
  await abrirPerfil(ALVO.username, nome);
}

function montarLegenda() {
  const ul = $('#legenda-lista');
  ul.replaceChildren();
  [...D.trofeus].sort((a, b) => (b.peso || 1) - (a.peso || 1)).forEach(t => {
    const li = el('li'), p = t.peso || 1;
    li.append(trofeu(t), el('span', 'l-nome', t.nome), el('strong', null, `${p} ${p === 1 ? 'ponto' : 'pontos'}`));
    ul.append(li);
  });
}

function limparForm() {
  SLOTS = Array(6).fill(null); CEM = [];
  $('#dex-q').value = ''; $('#dex-todos').checked = false; $('#ed-nz').checked = false;
  $('#ed-msg').textContent = '';
  campoExtra(); marcarDex();
}

function sairEdicao() {
  edit = null;
  $('#ed-titulo').textContent = 'Novo time campeão';
  $('#ed-salvar').textContent = 'Salvar time';
  $('#ed-cancelar').hidden = true;
}

function editar(j) {
  edit = j;
  aba('editar');
  $('#ed-titulo').textContent = `Editando: ${j.nome}`;
  $('#ed-salvar').textContent = 'Salvar alterações';
  $('#ed-cancelar').hidden = false;
  $('#ed-msg').textContent = ''; $('#dex-q').value = ''; $('#dex-todos').checked = false;
  const nz = /-nuzlocke$/.test(j.trofeu), kb = j.trofeu.replace('-nuzlocke', '');
  $('#ed-trofeu').value = kb;
  SLOTS = Array(6).fill(null);
  CEM = (j.caidos || []).map(c => ({ id: c.id, ap: c.ap || '' }));
  campoExtra();
  $('#ed-nz').checked = nz;
  const f = $('#ed-extra-campo'), nome = baseDe(j.nome).replace(new RegExp(NZ + '$'), ''), m = /(\d+)ª edição$/.exec(nome);
  if (m) f.value = m[1];
  else if (kb === 'liga') {
    const g = nome.replace(/^Pokémon /, '');
    if (![...f.options].some(o => o.value === g)) f.append(new Option(g, g));
    f.value = g;
  }
  const mvp = (j.extras || []).find(e => e.trofeu === COMP[j.trofeu]);
  j.time.slice(0, 6).forEach((id, i) => { SLOTS[i] = { id, ap: (j.apelidos || {})[id] || '', mvp: !!mvp && mvp.pokemon === id }; });
  desenharCem(); desenharSlots(); desenharDex();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmar(msg, rotulo) {
  const d = $('#dlg-conf');
  $('#conf-titulo').textContent = rotulo || 'Confirmar';
  $('#conf-msg').textContent = msg;
  $('#conf-sim').textContent = rotulo || 'Confirmar';
  return new Promise(ok => {
    const fim = v => { d.close(); ok(v); };
    $('#conf-sim').onclick = () => fim(true);
    $('#conf-nao').onclick = () => fim(false);
    d.oncancel = () => ok(false);
    d.showModal();
  });
}

async function excluir(j) {
  if (!await confirmar(`Excluir "${j.nome}"? Essa ação não pode ser desfeita.`, 'Excluir time')) return;
  const r = await sb.from('jogos').delete().eq('id', j.id);
  if (r.error) return void alert(r.error.message);
  await abrirPerfil(ALVO.username);
}

async function importar(e) {
  const f = e.target.files[0], msg = $('#imp-msg');
  if (!f) return;
  try {
    const base = JSON.parse(await f.text());
    const tem = new Set(D.jogos.map(j => j.nome));
    const novos = (base.jogos || []).filter(j => !tem.has(j.nome)).map(j => ({ user_id: USER.id, nome: j.nome, trofeu: j.trofeu, time: j.time, apelidos: j.apelidos || {}, extras: j.extras || [], ...(j.caidos ? { caidos: j.caidos } : {}) }));
    if (novos.length) { const r = await sb.from('jogos').insert(novos); if (r.error) throw r.error; }
    const ind = (base.individuais || []).map(x => ({ user_id: USER.id, pokemon: x.pokemon, trofeu: x.trofeu, quantidade: x.quantidade || 1 }));
    if (ind.length && !D.individuais.length) { const r = await sb.from('individuais').insert(ind); if (r.error) throw r.error; }
    msg.textContent = `Importado: ${novos.length} times.`;
    e.target.value = '';
    await abrirPerfil(ALVO.username);
  } catch (err) { msg.textContent = 'Erro ao importar: ' + (err.message || err); }
}

function baixar() {
  const limpo = { jogos: D.jogos.map(({ id, user_id, criado_em, ...j }) => j), individuais: D.individuais.map(({ id, user_id, ...x }) => x) };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(limpo, null, 2)], { type: 'application/json' }));
  a.download = `meus-campeoes-${ALVO.username}.json`;
  a.click();
}

// ---------- Contas, perfis e rotas ----------
const CFG = window.CONFIG || {};
let sb = null, TROFEUS = [], USER = null, MEU = null, ALVO = null, SEGUINDO = new Set();
const dono = () => !!(USER && ALVO && USER.id === ALVO.id);
const ver = id => ['v-config', 'v-entrada', 'v-criar', 'v-nao', 'v-perfil'].forEach(v => { $('#' + v).hidden = v !== id; });

function selo(n) {
  const b = el('span', 'selo' + (n === 2 ? ' s2' : '')), im = new Image(), nome = 'Beta tester ' + n;
  b.dataset.nome = nome; b.tabIndex = 0; b.title = nome;
  im.src = n === 2 ? 'img/beta2.png' : 'img/beta.png'; im.alt = nome;
  b.append(im);
  return b;
}
const selos = p => [p.beta ? selo(1) : null, p.beta2 ? selo(2) : null].filter(Boolean);

function avatar(p, pequeno) {
  const a = el('span', 'avatar' + (pequeno ? ' p' : ''));
  if (p.foto_url) { const im = new Image(); im.src = p.foto_url; im.alt = ''; a.append(im); }
  else a.textContent = (p.nome || p.username || '?')[0].toUpperCase();
  return a;
}

function barra() {
  const b = $('#barra-acoes');
  b.replaceChildren();
  if (USER) {
    if (MEU) { const a = el('a', 'bt'); a.href = '#/u/' + MEU.username; a.append(avatar(MEU, true), el('span', null, 'Meu perfil')); b.append(a); }
    const s = el('button', 'bt sair', 'Sair');
    s.onclick = () => sb.auth.signOut();
    b.append(s);
  } else { const a = el('a', 'bt'); a.href = '#/entrar'; a.textContent = 'Entrar'; b.append(a); }
}

function botaoSeguir() {
  const b = el('button', 'seg');
  const pinta = () => { const s = SEGUINDO.has(ALVO.id); b.textContent = s ? 'Seguindo' : 'Seguir'; b.classList.toggle('on', s); };
  pinta();
  b.onclick = async () => {
    if (!USER) return void (location.hash = '#/entrar');
    if (!MEU) return void (location.hash = '#/criar-perfil');
    if (SEGUINDO.has(ALVO.id)) { await sb.from('seguindo').delete().eq('seguidor', USER.id).eq('seguido', ALVO.id); SEGUINDO.delete(ALVO.id); }
    else { await sb.from('seguindo').insert({ seguidor: USER.id, seguido: ALVO.id }); SEGUINDO.add(ALVO.id); }
    pinta();
    cabecalhoContagem();
  };
  return b;
}

async function cabecalhoContagem() {
  const n = await contagens(), cont = document.querySelector('#cab .contagens');
  if (!cont || !n) return;
  const bt = (v, rot, tipo) => { const b = el('button', null); b.type = 'button'; b.append(el('strong', null, v), ' ' + rot); b.onclick = () => abrirPessoas(tipo); return b; };
  cont.replaceChildren(bt(n.seguidores, n.seguidores === 1 ? 'seguidor' : 'seguidores', 'seguidores'), bt(n.seguindo, 'seguindo', 'seguindo'));
  cont.hidden = false;
}

function cabecalho() {
  const c = $('#cab'), tx = el('div'), ac = el('div', 'cab-acoes'), link = el('button', null, 'Copiar link');
  c.replaceChildren();
  const h1 = el('h1', null, ALVO.nome || ALVO.username);
  h1.append(...selos(ALVO));
  const cont = el('p', 'contagens');
  cont.hidden = true;
  tx.append(h1, el('p', null, '@' + ALVO.username), cont);
  if (USER) cabecalhoContagem();
  link.onclick = () => navigator.clipboard.writeText(location.href.split('#')[0] + '#/u/' + ALVO.username).then(() => { link.textContent = 'Link copiado'; setTimeout(() => { link.textContent = 'Copiar link'; }, 1500); });
  const cb = el('button', null, 'Compartilhar cartão'); cb.onclick = cartao;
  ac.append(link, cb);
  if (dono()) { const b = el('button', null, 'Editar perfil'); b.onclick = abrirConta; ac.append(b); }
  else ac.append(botaoSeguir());
  c.append(avatar(ALVO), tx, ac);
}

async function buscarPerfis(ids) {
  // as colunas beta/beta2 só existem depois do SQL novo; sem elas, busca sem os selos
  let r = await sb.from('perfis').select('id,username,nome,foto_url,beta,beta2').in('id', ids);
  if (r.error) r = await sb.from('perfis').select('id,username,nome,foto_url,beta').in('id', ids);
  if (r.error) r = await sb.from('perfis').select('id,username,nome,foto_url').in('id', ids);
  return r;
}

function linhaPessoa(p, aoClicar) {
  const li = el('li'), a = el('a');
  a.href = '#/u/' + p.username;
  if (aoClicar) a.onclick = aoClicar;
  const nm = el('span', null, `${p.nome || p.username} (@${p.username})`);
  nm.append(...selos(p));
  a.append(avatar(p, true), nm);
  li.append(a);
  return li;
}

async function listarSeguindo() {
  const ul = $('#seg-lista'), ids = [...SEGUINDO], aviso = $('#seg-vazio');
  ul.replaceChildren();
  aviso.textContent = 'Você ainda não segue ninguém. Para achar alguém, peça o link do perfil da pessoa.';
  aviso.hidden = ids.length > 0;
  if (!ids.length) return;
  const r = await buscarPerfis(ids);
  if (r.error) { aviso.textContent = 'Não consegui carregar a lista: ' + r.error.message; aviso.hidden = false; return; }
  (r.data || []).forEach(p => ul.append(linhaPessoa(p)));
}

/* ===== seguidores e seguindo de qualquer perfil ===== */
async function contagens() {
  const q = c => sb.from('seguindo').select('*', { count: 'exact', head: true }).eq(c, ALVO.id);
  const [a, b] = await Promise.all([q('seguido'), q('seguidor')]);
  return a.error || b.error ? null : { seguidores: a.count || 0, seguindo: b.count || 0 };
}

async function abrirPessoas(tipo) {
  const d = $('#dlg-pessoas'), ul = $('#pes-lista'), vz = $('#pes-vazio');
  $('#pes-titulo').textContent = (tipo === 'seguidores' ? 'Seguidores de ' : 'Quem segue: ') + (ALVO.nome || ALVO.username);
  ul.replaceChildren(); vz.hidden = false; vz.textContent = 'Carregando...';
  d.showModal();
  const col = tipo === 'seguidores' ? 'seguidor' : 'seguido', fil = tipo === 'seguidores' ? 'seguido' : 'seguidor';
  const r = await sb.from('seguindo').select(col).eq(fil, ALVO.id);
  if (r.error) { vz.textContent = 'Não consegui carregar a lista: ' + r.error.message; return; }
  const ids = (r.data || []).map(x => x[col]);
  if (!ids.length) { vz.textContent = tipo === 'seguidores' ? 'Ninguém segue esta pessoa ainda.' : 'Esta pessoa ainda não segue ninguém.'; return; }
  const p = await buscarPerfis(ids);
  if (p.error) { vz.textContent = 'Não consegui carregar a lista: ' + p.error.message; return; }
  vz.hidden = true;
  (p.data || []).forEach(x => ul.append(linhaPessoa(x, () => d.close())));
}

async function abrirPerfil(username, ir) {
  const r = await sb.from('perfis').select('*').eq('username', username).maybeSingle();
  if (!r.data) return ver('v-nao');
  ALVO = r.data;
  sairEdicao();
  const [j, i] = await Promise.all([sb.from('jogos').select('*').eq('user_id', ALVO.id).order('id'), sb.from('individuais').select('*').eq('user_id', ALVO.id)]);
  est = { q: '', tro: new Set(), jogo: '', tipo: '', todos: false };
  $('#busca').value = ''; $('#f-jogo').value = ''; $('#f-tipo').value = '';
  ver('v-perfil');
  cabecalho();
  const jogos = (j.data || []).sort((a, b) => (ORDEM[a.trofeu] ?? 9) - (ORDEM[b.trofeu] ?? 9));
  await render({ trofeus: TROFEUS, jogos, individuais: i.data || [] });
  document.querySelector('[data-aba=editar]').hidden = !dono();
  document.querySelector('[data-aba=seguindo]').hidden = !dono();
  if (ir != null) { atual = Math.max(0, jogos.findIndex(x => x.nome === ir)); aba('times'); } else { atual = 0; aba('inicio'); }
}

const CORTE = { img: null, z: 1, ox: 0, oy: 0 };
function limitar() {
  const c = $('#k-canvas'), im = CORTE.img;
  if (!im) return;
  const s = (c.width / Math.min(im.width, im.height)) * CORTE.z;
  const mx = Math.max(0, (im.width * s - c.width) / 2), my = Math.max(0, (im.height * s - c.height) / 2);
  CORTE.ox = Math.max(-mx, Math.min(mx, CORTE.ox)); CORTE.oy = Math.max(-my, Math.min(my, CORTE.oy));
  return s;
}
function desenharCorte() {
  const c = $('#k-canvas'), g = c.getContext('2d'), im = CORTE.img;
  g.fillStyle = '#071f4a'; g.fillRect(0, 0, c.width, c.height);
  if (!im) return;
  const s = limitar();
  g.drawImage(im, c.width / 2 + CORTE.ox - im.width * s / 2, c.height / 2 + CORTE.oy - im.height * s / 2, im.width * s, im.height * s);
}
function carregarFoto(file) {
  const url = URL.createObjectURL(file), im = new Image();
  im.onload = () => {
    URL.revokeObjectURL(url);
    Object.assign(CORTE, { img: im, z: 1, ox: 0, oy: 0 });
    $('#k-zoom').value = 1; $('#k-corte').hidden = false; desenharCorte();
  };
  im.onerror = () => { CORTE.img = null; $('#k-corte').hidden = true; $('#k-msg').textContent = 'O arquivo não é uma imagem.'; };
  im.src = url;
}
function iniciarCorte() {
  const c = $('#k-canvas');
  let ult = null;
  c.addEventListener('pointerdown', e => { if (!CORTE.img) return; ult = [e.clientX, e.clientY]; c.setPointerCapture(e.pointerId); });
  c.addEventListener('pointermove', e => {
    if (!ult) return;
    const k = c.width / c.getBoundingClientRect().width;
    CORTE.ox += (e.clientX - ult[0]) * k; CORTE.oy += (e.clientY - ult[1]) * k;
    ult = [e.clientX, e.clientY]; desenharCorte();
  });
  const solta = () => { ult = null; };
  c.addEventListener('pointerup', solta); c.addEventListener('pointercancel', solta);
  c.addEventListener('wheel', e => { if (!CORTE.img) return; e.preventDefault(); const z = $('#k-zoom'); z.value = Math.max(1, Math.min(4, +z.value - e.deltaY / 400)); z.oninput(); }, { passive: false });
  $('#k-zoom').oninput = e => { CORTE.z = +$('#k-zoom').value; desenharCorte(); };
  $('#k-foto').onchange = e => { const f = e.target.files[0]; $('#k-foto-nome').textContent = f ? f.name : 'Nenhuma foto escolhida'; if (f) carregarFoto(f); else { CORTE.img = null; $('#k-corte').hidden = true; } };
}

function abrirConta() {
  $('#k-nome').value = MEU.nome || ''; $('#k-foto').value = ''; $('#k-foto-nome').textContent = 'Nenhuma foto escolhida'; $('#k-msg').textContent = ''; CORTE.img = null; $('#k-corte').hidden = true;
  $('#dlg-conta').showModal();
}

async function salvarConta() {
  const msg = $('#k-msg'), f = CORTE.img;
  let foto_url = MEU.foto_url;
  msg.textContent = 'Salvando...';
  if (f) {
    try {
      const caminho = `${USER.id}/avatar.jpg`;
      const up = await sb.storage.from('fotos').upload(caminho, await new Promise((ok, no) => $('#k-canvas').toBlob(b => b ? ok(b) : no(new Error('imagem inválida')), 'image/jpeg', 0.88)), { upsert: true, contentType: 'image/jpeg' });
      if (up.error) throw up.error;
      foto_url = sb.storage.from('fotos').getPublicUrl(caminho).data.publicUrl + '?v=' + Date.now();
    } catch (e) { return void (msg.textContent = 'Erro na foto: ' + e.message); }
  }
  const { error } = await sb.from('perfis').update({ nome: $('#k-nome').value.trim() || MEU.username, foto_url }).eq('id', USER.id);
  if (error) return void (msg.textContent = error.message);
  $('#dlg-conta').close();
  await carregarMeu();
  ALVO = MEU; cabecalho(); barra();
}

async function carregarMeu() {
  MEU = null; SEGUINDO = new Set();
  if (!USER) return;
  MEU = (await sb.from('perfis').select('*').eq('id', USER.id).maybeSingle()).data;
  // quem já tem conta ganha o selo Beta tester 2 só de entrar (a função só existe depois do SQL novo)
  if (MEU && !MEU.beta2) {
    try {
      const g = await sb.rpc('ganhar_beta2');
      if (!g.error) { const n = await sb.from('perfis').select('*').eq('id', USER.id).maybeSingle(); if (n.data) MEU = n.data; }
    } catch {}
  }
  SEGUINDO = new Set(((await sb.from('seguindo').select('seguido').eq('seguidor', USER.id)).data || []).map(x => x.seguido));
}

let modoAuth = 'entrar';
function modoEntrada(m) {
  modoAuth = m;
  const criar = m === 'criar';
  $('#ab-entrar').setAttribute('aria-selected', !criar);
  $('#ab-criar').setAttribute('aria-selected', criar);
  $('#a-enviar').textContent = criar ? 'Criar conta' : 'Entrar';
  $('#a-senha').autocomplete = criar ? 'new-password' : 'current-password';
  $('#a-senha').placeholder = criar ? 'Crie uma senha' : 'Sua senha';
  $('#a-dica').hidden = !criar;
  $('#a-esqueci').hidden = criar;
  $('#a-msg').textContent = ''; $('#a-msg').className = 'auth-msg';
}

function msgAuth(txt, tipo) { const m = $('#a-msg'); m.textContent = txt; m.className = 'auth-msg ' + (tipo || ''); }

const ERROS_AUTH = [
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/already registered|already been registered/i, 'Esse e-mail já tem conta. Clique em "Entrar".'],
  [/email not confirmed/i, 'Confirme seu e-mail antes de entrar. Veja a caixa de entrada e o spam.'],
  [/at least 6|weak/i, 'A senha precisa ter pelo menos 6 caracteres.'],
  [/rate|seconds|too many/i, 'Muitas tentativas seguidas. Espere um pouco e tente de novo.'],
  [/invalid.*email|email.*invalid|valid email/i, 'Digite um e-mail válido.']
];

async function autenticar(cria) {
  const email = $('#a-email').value.trim(), password = $('#a-senha').value, bt = $('#a-enviar');
  if (!/^\S+@\S+\.\S+$/.test(email)) return void msgAuth('Digite um e-mail válido.', 'erro');
  if (cria && password.length < 6) return void msgAuth('A senha precisa ter pelo menos 6 caracteres.', 'erro');
  if (!password) return void msgAuth('Digite sua senha.', 'erro');
  const texto = bt.textContent;
  bt.disabled = true; bt.textContent = cria ? 'Criando...' : 'Entrando...'; msgAuth('');
  let res;
  try { res = cria ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password }); }
  catch (e) { res = { error: e }; }
  bt.disabled = false; bt.textContent = texto;
  const { data, error } = res;
  if (error) {
    const m = error.message || '';
    if (/fetch|network/i.test(m)) return void msgAuth(`Não consegui falar com o Supabase (${new URL(CFG.SUPABASE_URL.trim()).host}). Confira o ID na URL do config.js, se o projeto está ativo e se algum bloqueador está ligado.`, 'erro');
    const conhecido = ERROS_AUTH.find(([re]) => re.test(m));
    return void msgAuth(conhecido ? conhecido[1] : m, 'erro');
  }
  if (cria && data && data.user && !data.session) {
    if (data.user.identities && !data.user.identities.length) return void msgAuth('Esse e-mail já tem conta. Clique em "Entrar".', 'erro');
    modoEntrada('entrar');
    msgAuth('Conta criada! Enviamos um e-mail de confirmação. Clique no link e depois entre aqui.', 'ok');
  }
}

async function esqueciSenha() {
  const email = $('#a-email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) return void msgAuth('Digite seu e-mail no campo acima e clique de novo em "Esqueci minha senha".', 'erro');
  msgAuth('Enviando...');
  let res;
  try { res = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); }
  catch (e) { res = { error: e }; }
  if (res.error) msgAuth(/rate|seconds|limit/i.test(res.error.message || '') ? 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.' : res.error.message, 'erro');
  else msgAuth('Se esse e-mail tiver uma conta, enviamos um link para criar uma nova senha. Olhe também o spam.', 'ok');
}

async function salvarSenha() {
  const a = $('#ns-1').value, b = $('#ns-2').value, msg = $('#ns-msg');
  if (a.length < 6) return void (msg.textContent = 'Use pelo menos 6 caracteres.');
  if (a !== b) return void (msg.textContent = 'As duas senhas não são iguais.');
  msg.textContent = 'Salvando...';
  const { error } = await sb.auth.updateUser({ password: a });
  if (error) return void (msg.textContent = error.message);
  msg.textContent = 'Senha alterada!';
  setTimeout(() => { $('#dlg-senha').close(); $('#ns-1').value = $('#ns-2').value = ''; msg.textContent = ''; }, 1200);
}

function previaLink() {
  const u = $('#c-user');
  u.value = u.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  $('#c-previa').textContent = location.origin.replace(/^https?:\/\//, '') + location.pathname.replace(/index\.html$/, '') + '#/u/' + (u.value || 'seunome');
}

async function criarPerfil() {
  const username = $('#c-user').value.trim().toLowerCase(), nome = $('#c-nome').value.trim() || username, msg = $('#c-msg'), bt = $('#c-criar');
  msg.className = 'auth-msg erro';
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return void (msg.textContent = 'Use de 3 a 20 letras minúsculas, números ou _ (sem espaços).');
  bt.disabled = true; msg.textContent = '';
  const { error } = await sb.from('perfis').insert({ id: USER.id, username, nome });
  bt.disabled = false;
  if (error) return void (msg.textContent = error.code === '23505' ? 'Esse nome de usuário já existe. Escolha outro.' : error.message);
  await carregarMeu();
  location.hash = '#/u/' + username;
}

function iniciarLupa() {
  const f = $('#lupa'), inp = $('#lupa-in'), bt = $('#lupa-bt');
  const alterna = abrir => {
    f.classList.toggle('on', abrir); bt.setAttribute('aria-expanded', abrir); inp.tabIndex = abrir ? 0 : -1;
    if (abrir) setTimeout(() => inp.focus(), 120); else { inp.value = ''; inp.placeholder = 'Cole o link do perfil'; }
  };
  bt.onclick = () => alterna(!f.classList.contains('on'));
  inp.addEventListener('keydown', e => { if (e.key === 'Escape') alterna(false); });
  f.addEventListener('submit', e => {
    e.preventDefault();
    let v = inp.value.trim();
    const m = /#?\/?u\/([^/?#\s]+)/i.exec(v);
    v = (m ? decodeURIComponent(m[1]) : v).replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(v)) {
      inp.value = ''; inp.placeholder = 'Link ou usuário inválido';
      f.classList.remove('erro'); void f.offsetWidth; f.classList.add('erro'); return;
    }
    alterna(false); location.hash = '#/u/' + v;
  });
}

async function rota() {
  barra();
  const h = location.hash.replace(/^#\/?/, ''), m = /^u\/([^/?]+)/.exec(h);
  if (m) return abrirPerfil(decodeURIComponent(m[1]).toLowerCase());
  if (h === 'criar-perfil') return USER ? (MEU ? (location.hash = '#/u/' + MEU.username) : ver('v-criar')) : (location.hash = '#/entrar');
  if (USER && MEU) return void (location.hash = '#/u/' + MEU.username);
  if (USER) return void (location.hash = '#/criar-perfil');
  ver('v-entrada');
}

(async function iniciar() {
  const url = (CFG.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  if (!url || url.includes('COLE_AQUI') || !CFG.SUPABASE_KEY || CFG.SUPABASE_KEY.includes('COLE_AQUI') || !window.supabase) return ver('v-config');
  if (/^sb_secret_|service_role/.test(CFG.SUPABASE_KEY.trim())) {
    $('#config-aviso').textContent = 'A chave do config.js é a SECRET (ou service_role), que dá acesso total ao projeto e não pode ficar no site. Use a chave PUBLISHABLE (sb_publishable_...).';
    return ver('v-config');
  }
  if (/ID-DO-PROJETO/i.test(url)) {
    $('#config-aviso').textContent = 'A URL ainda tem o texto de exemplo ID-DO-PROJETO. Troque pelo ID real do seu projeto (ele aparece no endereço do painel do Supabase).';
    return ver('v-config');
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|com)$/.test(url)) {
    $('#config-aviso').textContent = `A URL do config.js parece errada: "${url}". Ela deve ser parecida com https://abcdxyz.supabase.co (sem nada depois de .supabase.co).`;
    return ver('v-config');
  }
  sb = window.supabase.createClient(url, CFG.SUPABASE_KEY.trim());
  try { TROFEUS = (await (await fetch('trofeus.json')).json()).trofeus; } catch { return ver('v-config'); }
  $('#auth-form').onsubmit = e => { e.preventDefault(); autenticar(modoAuth === 'criar'); };
  $('#ab-entrar').onclick = () => modoEntrada('entrar');
  $('#ab-criar').onclick = () => modoEntrada('criar');
  $('#a-ver').onclick = () => { const v = $('#a-senha').type === 'password'; $('#a-senha').type = v ? 'text' : 'password'; $('#a-ver').textContent = v ? 'Ocultar' : 'Mostrar'; };
  $('#criar-form').onsubmit = e => { e.preventDefault(); criarPerfil(); };
  $('#c-user').oninput = previaLink;
  previaLink(); modoEntrada('entrar');
  $('#a-esqueci').onclick = esqueciSenha;
  $('#ns-salvar').onclick = salvarSenha;
  $('#ns-cancelar').onclick = () => $('#dlg-senha').close();
  $('#ns-2').onkeydown = e => { if (e.key === 'Enter') salvarSenha(); };
  $('#k-salvar').onclick = salvarConta;
  iniciarCorte(); iniciarLupa(); iniciarExtras();
  $('#k-fechar').onclick = () => $('#dlg-conta').close();
  let primeira = true;
  sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'PASSWORD_RECOVERY') setTimeout(() => $('#dlg-senha').showModal(), 0);
    const novo = s ? s.user : null;
    if (!primeira && (novo ? novo.id : null) === (USER ? USER.id : null)) return;
    primeira = false;
    USER = novo;
    setTimeout(async () => { await carregarMeu(); rota(); }, 0);
  });
  window.onhashchange = rota;
})();

$('#pes-x').onclick = () => $('#dlg-pessoas').close();
$('#dlg-pessoas').onclick = e => { if (e.target === $('#dlg-pessoas')) $('#dlg-pessoas').close(); };

/* ===== insígnias (maletinha) ===== */
const INSIGNIAS = [
  ['primeiro-time', 'Primeiro time', 'Complete seu primeiro time oficial.', d => d.jogos.length >= 1],
  ['liga', 'Campeão de liga', 'Registre um time campeão de liga.', d => d.jogos.some(j => /^liga/.test(j.trofeu))],
  ['craft', 'Campeão da Copa Craft', 'Registre um time da Copa Craft.', d => d.jogos.some(j => j.trofeu === 'craft')],
  ['pokerogue', 'Campeão do PokéRogue', 'Registre um time do PokéRogue.', d => d.jogos.some(j => j.trofeu === 'pokerogue')],
  ['mvp', 'MVP', 'Marque um MVP em algum time.', d => { const set = new Set(Object.values(COMP).filter(Boolean)); return d.jogos.some(j => (j.extras || []).some(e => set.has(e.trofeu))); }],
  ['nuzlocke', 'Nuzlocke', 'Registre seu primeiro time Nuzlocke.', d => d.jogos.some(j => /-nuzlocke$/.test(j.trofeu))],
  ['colecionador', 'Colecionador', 'Registre 20 Pokémon diferentes.', () => P.length >= 20, () => `${Math.min(P.length, 20)}/20`],
  ['social', 'Social', 'Siga 5 pessoas ou seja seguido por 5.', (d, c) => !!c && (c.seguidores >= 5 || c.seguindo >= 5), (d, c) => c ? `${Math.min(Math.max(c.seguidores, c.seguindo), 5)}/5` : '']
];

async function insignias() {
  const box = $('#estojo');
  const c = USER ? await contagens().catch(() => null) : null;
  box.replaceChildren();
  let n = 0;
  INSIGNIAS.forEach(([id, nome, regra, ok, prog]) => {
    const ganha = ok(D, c);
    if (ganha) n++;
    const slot = el('div', 'ins' + (ganha ? ' on' : ''));
    slot.setAttribute('role', 'listitem');
    slot.tabIndex = 0;
    slot.title = ganha ? nome : `${nome}: ${regra}`;
    const disco = el('div', 'disco'), im = new Image();
    im.src = `img/insignias/${id}.png`; im.alt = ''; im.loading = 'lazy';
    disco.append(im);
    const p = !ganha && prog ? prog(D, c) : '';
    slot.append(disco, el('b', null, nome), el('small', null, ganha ? 'Conquistada' : regra + (p ? ` (${p})` : '')));
    box.append(slot);
  });
  $('#ins-resumo').textContent = `${n} de ${INSIGNIAS.length} insígnias conquistadas`;
}
