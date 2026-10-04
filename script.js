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

const cache = JSON.parse(localStorage.getItem('pk3') || '{}');
async function infoDe(id) {
  if (cache[id]) return cache[id];
  try {
    const d = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();
    cache[id] = { nome: d.species.name.split('-').map(p => p[0].toUpperCase() + p.slice(1)).join(' '), tipos: d.types.map(t => t.type.name), stats: d.stats.map(x => x.base_stat) };
    localStorage.setItem('pk3', JSON.stringify(cache));
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
  i.loading = 'lazy';
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

async function render(dados) {
  D = dados; M = {};
  const c = contar(D);
  const ids = Object.keys(c).map(Number);
  const infos = await Promise.all(ids.map(infoDe));
  const peso = Object.fromEntries(D.trofeus.map(t => [t.id, t.peso || 1]));
  P = ids.map((id, i) => {
    const jogos = D.jogos.filter(j => j.time.includes(id)), t = c[id].t;
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
  + D.jogos.reduce((s, j) => s + (j.extras || []).filter(e => e.trofeu === t.id).length, 0)
  + (D.individuais || []).filter(e => e.trofeu === t.id).reduce((s, e) => s + (e.quantidade || 1), 0);

function conquistas() {
  const box = $('#conq');
  box.replaceChildren();
  if (!P.length) return;
  D.trofeus.forEach(t => {
    const n = totalTro(t), d = el('div', n ? '' : 'zero');
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
  const mvp = mvpDe(j), time = $('#d-time');
  time.replaceChildren();
  j.time.forEach(id => {
    const p = M[id], ap = (j.apelidos || {})[id], m = el('div', 'membro' + (mvp === id ? ' mvp' : ''));
    if (mvp === id) { const co = el('span', 'coroa'), im = new Image(); im.src = 'img/mvp.png'; im.alt = 'MVP'; co.append(im); m.append(co); }
    const arte = new Image(); arte.className = 'arte'; arte.alt = p ? p.nome : '';
    arte.onerror = () => { arte.onerror = null; arte.src = SPRITE(id); };
    arte.src = ARTE(id);
    m.append(arte, el('b', null, ap || (p ? p.nome : '#' + id)), el('small', null, ap && p ? p.nome : '#' + id));
    if (p) m.onclick = () => abrir(p);
    time.append(m);
  });
  const top = $('#top3');
  top.replaceChildren();
  P.slice(0, 3).forEach((p, i) => {
    const c = el('div', 'c ' + ['o', 'p', 'b'][i]), im = new Image(), tx = el('div');
    im.src = SPRITE(p.id); im.alt = p.nome;
    tx.append(el('b', null, `${i + 1}º ${p.nome}`), el('br'), el('small', null, `${p.total} ${p.total === 1 ? 'título' : 'títulos'}`));
    c.append(im, tx);
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
  const dlg = $('#dlg-cartao'), cv = $('#cartao-cv'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  $('#cartao-msg').textContent = '';
  dlg.showModal();
  try { await Promise.all([document.fonts.load('700 60px Silkscreen'), document.fonts.load('800 30px Nunito')]); } catch {}
  const carregar = src => new Promise(ok => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  const jogo = D.jogos.find(x => x.nome === ALVO.destaque) || D.jogos[0];
  const ids = jogo ? jogo.time.slice(0, 6) : P.slice(0, 6).map(p => p.id);
  const mvpId = jogo ? mvpDe(jogo) : null;
  const tros = D.trofeus.map(t => ({ t, n: totalTro(t) })).filter(x => x.n).sort((a, b) => (b.t.peso || 1) - (a.t.peso || 1)).slice(0, 5);
  const trJogo = jogo ? D.trofeus.find(t => t.id === jogo.trofeu) : null;
  const [foto, tipos, artes, imgsT, bt, coroa, imTrJogo] = await Promise.all([
    ALVO.foto_url ? carregar(ALVO.foto_url) : null,
    tiposTop(2),
    Promise.all(ids.map(async id => (await carregar(ARTE(id))) || (await carregar(SPRITE(id))))),
    Promise.all(tros.map(x => carregar(x.t.imagem))),
    ALVO.beta ? carregar('img/beta.png') : null,
    carregar('img/mvp.png'),
    trJogo ? carregar(trJogo.imagem) : null
  ]);
  const rr = (x, y, w, h, r, fill, stroke, lw) => {
    g.beginPath(); g.roundRect(x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 2; g.stroke(); }
  };
  const contain = (im, x, y, w, h) => { const r = Math.min(w / im.width, h / im.height); g.drawImage(im, x + (w - im.width * r) / 2, y + (h - im.height * r) / 2, im.width * r, im.height * r); };
  const rotulo = (txt, x, y, alinha) => { g.textAlign = alinha || 'left'; g.fillStyle = '#8fb8e3'; g.font = '800 24px Nunito, sans-serif'; try { g.letterSpacing = '4px'; } catch {} g.fillText(txt.toUpperCase(), x, y); try { g.letterSpacing = '0px'; } catch {} };
  g.clearRect(0, 0, W, H);
  // fundo: azul liso com uma luz suave e grade de pontos
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
  g.strokeStyle = '#90CAF9'; g.lineWidth = 6; g.beginPath(); g.arc(ax, ay, ar, 0, Math.PI * 2); g.stroke();
  const nome = ALVO.nome || ALVO.username, nx = ax + ar + 36, maxN = W - nx - 72 - (bt ? 76 : 0);
  let fs = 64; g.textAlign = 'left';
  do { g.font = `700 ${fs}px Silkscreen, monospace`; fs -= 2; } while (g.measureText(nome).width > maxN && fs > 24);
  g.fillStyle = '#fff'; g.fillText(nome, nx, ay - 6);
  if (bt) contain(bt, nx + g.measureText(nome).width + 16, ay - 6 - 54, 60, 60);
  g.fillStyle = '#8fb8e3'; g.font = '800 32px Nunito, sans-serif'; g.fillText('@' + ALVO.username, nx, ay + 40);
  // time de destaque
  rotulo(jogo ? 'Time de destaque' : 'Mais campeões', 72, 440);
  if (jogo) {
    g.textAlign = 'right'; g.fillStyle = '#fff'; g.font = '800 30px Nunito, sans-serif';
    const lw = g.measureText(jogo.nome).width;
    g.fillText(jogo.nome, W - 72 - (imTrJogo ? 52 : 0), 440, 560);
    if (imTrJogo) contain(imTrJogo, W - 72 - 44, 402, 44, 50);
  }
  const pw = 148, gap = 12, x0 = (W - (pw * 6 + gap * 5)) / 2;
  ids.forEach((id, i) => {
    const x = x0 + i * (pw + gap), y = 470, mvp = id === mvpId;
    rr(x, y, pw, 232, 20, '#ffffff0f', mvp ? '#f5c542' : '#90CAF933', mvp ? 3 : 2);
    if (artes[i]) contain(artes[i], x + 8, y + 22, pw - 16, pw - 16);
    if (mvp && coroa) contain(coroa, x + pw / 2 - 22, y - 18, 44, 44);
    const ap = jogo && (jogo.apelidos || {})[id], p = M[id];
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '800 22px Nunito, sans-serif';
    g.fillText(ap || (p ? p.nome : nomeDe(id)), x + pw / 2, y + 196, pw - 14);
    if (ap && p) { g.fillStyle = '#8fb8e3'; g.font = '700 17px Nunito, sans-serif'; g.fillText(p.nome, x + pw / 2, y + 218, pw - 14); }
  });
  // números
  const tit = D.trofeus.reduce((s, t) => s + totalTro(t), 0);
  [[D.jogos.length, D.jogos.length === 1 ? 'time campeão' : 'times campeões'], [P.length, 'Pokémon usados'], [tit, tit === 1 ? 'título' : 'títulos']].forEach(([n, l], i) => {
    const cx = 72 + (W - 144) / 6 + i * (W - 144) / 3;
    g.textAlign = 'center'; g.fillStyle = '#E3F2FD'; g.font = '800 84px Nunito, sans-serif'; g.fillText(String(n), cx, 830);
    g.fillStyle = '#8fb8e3'; g.font = '700 26px Nunito, sans-serif'; g.fillText(l, cx, 870);
    if (i) { g.fillStyle = '#90CAF933'; g.fillRect(72 + i * (W - 144) / 3, 770, 2, 120); }
  });
  // tipos
  rotulo('Tipos mais usados', 72, 970);
  g.font = '800 30px Nunito, sans-serif';
  let tx = 72;
  tipos.forEach(([t]) => {
    const nm = (TIPOS[t] || [t])[0], w = g.measureText(nm).width + 56;
    rr(tx, 992, w, 58, 14, (TIPOS[t] || [0, '#777'])[1]);
    g.textAlign = 'center'; g.fillStyle = '#fff'; g.fillText(nm, tx + w / 2, 1031); tx += w + 14;
  });
  // troféus
  if (tros.length) {
    rotulo('Troféus', 72, 1110);
    const item = (W - 144) / tros.length;
    tros.forEach((x, i) => {
      const bx = 72 + i * item;
      if (imgsT[i]) contain(imgsT[i], bx, 1130, 70, 86);
      g.textAlign = 'left'; g.fillStyle = '#E3F2FD'; g.font = '800 44px Nunito, sans-serif'; g.fillText(String(x.n), bx + 80, 1188);
    });
  }
  // rodapé
  g.fillStyle = '#90CAF933'; g.fillRect(72, 1252, W - 144, 2);
  g.textAlign = 'left'; g.fillStyle = '#8fb8e3'; g.font = '700 26px Nunito, sans-serif';
  g.fillText(location.href.split('#')[0].replace(/^https?:\/\//, '').replace(/index\.html$/, '') + '#/u/' + ALVO.username, 72, 1302, W - 144);
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

let atual = 0;
function montarTimes() {
  $('#linha-tempo').replaceChildren();
  if (!D.jogos.length) { $('#palco').replaceChildren(el('p', 'mut', 'Nenhum time cadastrado ainda.')); return; }
  D.jogos.forEach((j, i) => {
    const b = el('button', 'marco');
    b.type = 'button';
    b.style.setProperty('--i', i);
    const t = D.trofeus.find(y => y.id === j.trofeu);
    if (t) { const im = new Image(); im.src = t.imagem; im.alt = ''; b.append(im); }
    b.append(j.nome.replace(/^Pokémon /, ''));
    b.onclick = () => palco(i);
    $('#linha-tempo').append(b);
  });
  palco(Math.min(atual, D.jogos.length - 1));
}

function palco(i) {
  atual = (i + D.jogos.length) % D.jogos.length;
  const j = D.jogos[atual];
  document.querySelectorAll('.marco').forEach((b, k) => {
    b.setAttribute('aria-pressed', k === atual);
    if (k === atual) b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
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
  nos.push(time);
  $('#palco').replaceChildren(...nos);
}

function aba(n) {
  ['inicio', 'ranking', 'times', 'editar', 'seguindo'].forEach(k => {
    $('#' + k + '-secao').hidden = k !== n;
    document.querySelector(`[data-aba=${k}]`).setAttribute('aria-selected', k === n);
  });
  if (n === 'times' && D && D.jogos.length) palco(atual);
  if (n === 'seguindo') listarSeguindo();
}
document.querySelectorAll('[data-aba]').forEach(b => b.onclick = () => aba(b.dataset.aba));
document.addEventListener('keydown', e => {
  if ($('#times-secao').hidden || $('#perfil').open || /INPUT|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key === 'ArrowRight') palco(atual + 1);
  if (e.key === 'ArrowLeft') palco(atual - 1);
});

// ---------- Editor de times (dono do perfil) ----------
let edit = null;
const ORDEM = { liga: 0, craft: 1, pokerogue: 2, medalha: 3 };
const COMP = { craft: 'bola-ouro-craft', liga: 'bola-ouro-liga', medalha: null, pokerogue: 'pokerogue-mvp' };
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
const nomeDe = id => ESP[id] ? bonito(ESP[id]) : (M[id] && M[id].nome) || '#' + id;

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
async function listaDex(def) {
  if (def === 'todos') return idsDex('todos');
  if (def === 'ate493') return (await idsDex('todos')).filter(i => i <= 493);
  return [...new Set((await Promise.all(def.map(idsDex))).flat())];
}
function defDex() {
  const k = $('#ed-trofeu').value, v = ($('#ed-extra-campo') || {}).value;
  if (k === 'craft' || k === 'pokerogue' || $('#dex-todos').checked) return { def: 'todos', titulo: 'Todos os Pokémon' };
  if (k === 'medalha') return { def: DEX['Legends: Z-A'], titulo: 'Pokédex de Pokémon Legends: Z-A' };
  if (!v) return null;
  return { def: DEX[v] || 'todos', titulo: `Pokédex de Pokémon ${v}` };
}

/* ===== time em montagem ===== */
let SLOTS = Array(6).fill(null), tokenDex = 0;

function desenharSlots() {
  const box = $('#ed-time'), mvpOk = !!COMP[$('#ed-trofeu').value];
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

function adicionar(id) {
  const msg = $('#ed-msg');
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
  try { ids = await listaDex(d.def); }
  catch { if (eu === tokenDex) { g.replaceChildren(); msg.textContent = 'Não consegui carregar a Pokédex agora. Confira a internet e troque a versão para tentar de novo.'; } return; }
  if (eu !== tokenDex) return;
  const q = sem($('#dex-q').value.trim());
  const lista = ids.filter(id => !q || sem(bonito(ESP[id] || '')).includes(q) || String(id) === q);
  g.replaceChildren(...lista.map(id => {
    const t = el('button', 'tile'), im = new Image();
    t.type = 'button'; t.dataset.id = id; t.title = `${nomeDe(id)} (Nº ${id})`;
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
  if (!COMP[k]) SLOTS.forEach(s => { if (s) s.mvp = false; });
  desenharSlots(); desenharDex();
}

function montarEditor() {
  const s = $('#ed-trofeu');
  Object.keys(COMP).forEach(k => { const t = D.trofeus.find(x => x.id === k); if (t) s.append(new Option(t.nome, k)); });
  s.onchange = () => { $('#dex-todos').checked = false; campoExtra(); };
  $('#dex-q').oninput = desenharDex;
  $('#dex-todos').onchange = desenharDex;
  $('#ed-salvar').onclick = salvarTime;
  $('#ed-cancelar').onclick = () => { sairEdicao(); limparForm(); };
  $('#ed-baixar').onclick = baixar;
  $('#imp-arq').onchange = importar;
  desenharSlots();
}

async function salvarTime() {
  const msg = $('#ed-msg'), k = $('#ed-trofeu').value, v = $('#ed-extra-campo').value.trim();
  const ed = { craft: 'Copa Craft', pokerogue: 'Copa PokéRogue' }[k];
  const nome = ed ? `${ed}: ${v}ª edição` : k === 'medalha' ? 'Pokémon Legends: Z-A' : v && (/^pok[eé]mon\b/i.test(v) ? v : `Pokémon ${v}`);
  const cheio = SLOTS.filter(Boolean), time = cheio.map(s => s.id), apelidos = {}, extras = [];
  cheio.forEach(s => {
    if (s.ap && s.ap.trim()) apelidos[s.id] = s.ap.trim();
    if (s.mvp && COMP[k]) extras.push({ pokemon: s.id, trofeu: COMP[k] });
  });
  if (!nome) return void (msg.textContent = 'Escolha o jogo (versão).');
  if (!time.length) return void (msg.textContent = 'Adicione pelo menos um Pokémon.');
  if (D.jogos.some(j => j.nome === nome && !(edit && j.id === edit.id))) return void (msg.textContent = `Já existe: ${nome}.`);
  const mvps = Object.values(COMP);
  const novo = { nome, trofeu: k, time, apelidos, extras: [...(edit ? (edit.extras || []).filter(e => !mvps.includes(e.trofeu)) : []), ...extras] };
  msg.textContent = 'Salvando...';
  const r = edit ? await sb.from('jogos').update(novo).eq('id', edit.id) : await sb.from('jogos').insert({ ...novo, user_id: USER.id });
  if (r.error) return void (msg.textContent = r.error.message);
  sairEdicao(); limparForm();
  await abrirPerfil(ALVO.username, nome);
}

function montarLegenda() {
  const ul = $('#legenda-lista');
  ul.replaceChildren();
  [...D.trofeus].sort((a, b) => (b.peso || 1) - (a.peso || 1)).forEach(t => {
    const li = el('li'), p = t.peso || 1;
    li.append(trofeu(t), t.nome, el('strong', null, `${p} ${p === 1 ? 'ponto' : 'pontos'}`));
    ul.append(li);
  });
}

function limparForm() {
  SLOTS = Array(6).fill(null);
  $('#dex-q').value = ''; $('#dex-todos').checked = false;
  $('#ed-msg').textContent = '';
  desenharSlots(); marcarDex();
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
  $('#ed-trofeu').value = j.trofeu;
  SLOTS = Array(6).fill(null);
  campoExtra();
  const f = $('#ed-extra-campo'), m = /(\d+)ª edição$/.exec(j.nome);
  if (m) f.value = m[1];
  else if (j.trofeu === 'liga') {
    const g = j.nome.replace(/^Pokémon /, '');
    if (![...f.options].some(o => o.value === g)) f.append(new Option(g, g));
    f.value = g;
  }
  const mvp = (j.extras || []).find(e => e.trofeu === COMP[j.trofeu]);
  j.time.slice(0, 6).forEach((id, i) => { SLOTS[i] = { id, ap: (j.apelidos || {})[id] || '', mvp: !!mvp && mvp.pokemon === id }; });
  desenharSlots(); desenharDex();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function excluir(j) {
  if (!confirm(`Excluir "${j.nome}"? Essa ação não pode ser desfeita.`)) return;
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
    const novos = (base.jogos || []).filter(j => !tem.has(j.nome)).map(j => ({ user_id: USER.id, nome: j.nome, trofeu: j.trofeu, time: j.time, apelidos: j.apelidos || {}, extras: j.extras || [] }));
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

function selo() {
  const b = el('span', 'selo'), im = new Image();
  b.dataset.nome = 'Beta tester'; b.tabIndex = 0; b.title = 'Beta tester';
  im.src = 'img/beta.png'; im.alt = 'Beta tester';
  b.append(im);
  return b;
}

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
  };
  return b;
}

function cabecalho() {
  const c = $('#cab'), tx = el('div'), ac = el('div', 'cab-acoes'), link = el('button', null, 'Copiar link');
  c.replaceChildren();
  const h1 = el('h1', null, ALVO.nome || ALVO.username);
  if (ALVO.beta) h1.append(selo());
  tx.append(h1, el('p', null, '@' + ALVO.username));
  link.onclick = () => navigator.clipboard.writeText(location.href.split('#')[0] + '#/u/' + ALVO.username).then(() => { link.textContent = 'Link copiado'; setTimeout(() => { link.textContent = 'Copiar link'; }, 1500); });
  const cb = el('button', null, 'Compartilhar cartão'); cb.onclick = cartao;
  ac.append(link, cb);
  if (dono()) { const b = el('button', null, 'Editar perfil'); b.onclick = abrirConta; ac.append(b); }
  else ac.append(botaoSeguir());
  c.append(avatar(ALVO), tx, ac);
}

async function listarSeguindo() {
  const ul = $('#seg-lista'), ids = [...SEGUINDO];
  ul.replaceChildren();
  $('#seg-vazio').hidden = ids.length > 0;
  if (!ids.length) return;
  const { data } = await sb.from('perfis').select('id,username,nome,foto_url,beta').in('id', ids);
  (data || []).forEach(p => {
    const li = el('li'), a = el('a');
    a.href = '#/u/' + p.username;
    const nm = el('span', null, `${p.nome || p.username} (@${p.username})`);
    if (p.beta) nm.append(selo());
    a.append(avatar(p, true), nm);
    li.append(a);
    ul.append(li);
  });
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
  $('#k-foto').onchange = e => { const f = e.target.files[0]; if (f) carregarFoto(f); else { CORTE.img = null; $('#k-corte').hidden = true; } };
}

function abrirConta() {
  $('#k-nome').value = MEU.nome || ''; $('#k-foto').value = ''; $('#k-msg').textContent = ''; CORTE.img = null; $('#k-corte').hidden = true;
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
  SEGUINDO = new Set(((await sb.from('seguindo').select('seguido').eq('seguidor', USER.id)).data || []).map(x => x.seguido));
}

async function autenticar(cria) {
  const email = $('#a-email').value.trim(), password = $('#a-senha').value, msg = $('#a-msg');
  msg.textContent = '';
  let res;
  try { res = cria ? await sb.auth.signUp({ email, password }) : await sb.auth.signInWithPassword({ email, password }); }
  catch (e) { res = { error: e }; }
  const { data, error } = res;
  if (error) return void (msg.textContent = /fetch|network/i.test(error.message || '') ? `Não consegui falar com o Supabase (${new URL(CFG.SUPABASE_URL.trim()).host}). Confira o ID na URL do config.js, se o projeto está ativo e se algum bloqueador está ligado.` : error.message);
  if (cria && !data.session) msg.textContent = 'Conta criada! Confirme o e-mail que você recebeu e depois entre.';
}

async function esqueciSenha() {
  const email = $('#a-email').value.trim(), msg = $('#a-msg');
  if (!email) return void (msg.textContent = 'Digite seu e-mail no campo acima e clique de novo em "Esqueci minha senha".');
  msg.textContent = 'Enviando...';
  let res;
  try { res = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); }
  catch (e) { res = { error: e }; }
  if (res.error) msg.textContent = /rate|seconds|limit/i.test(res.error.message || '') ? 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.' : res.error.message;
  else msg.textContent = 'Se esse e-mail tiver uma conta, enviamos um link para criar uma nova senha. Olhe também o spam.';
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

async function criarPerfil() {
  const username = $('#c-user').value.trim().toLowerCase(), nome = $('#c-nome').value.trim() || username, msg = $('#c-msg');
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return void (msg.textContent = 'Use de 3 a 20 letras minúsculas, números ou _.');
  const { error } = await sb.from('perfis').insert({ id: USER.id, username, nome });
  if (error) return void (msg.textContent = error.code === '23505' ? 'Esse nome de usuário já existe.' : error.message);
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
  $('#a-entrar').onclick = () => autenticar(false);
  $('#a-criar').onclick = () => autenticar(true);
  $('#a-senha').onkeydown = e => { if (e.key === 'Enter') autenticar(false); };
  $('#c-criar').onclick = criarPerfil;
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
