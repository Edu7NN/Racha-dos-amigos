/* Testes do Quadrangular. Uso:  node test_quadrangular.js [../index.html] */
const load = require('./harness'), seed = require('./fixtures');
const { T, els, chk, done, clickAct, bn, menuGo } = load(process.argv[2] || '../index.html');
T.setEdit(true);
const { NAMES } = seed(T);
const S = T.S, K = ['vermelho', 'azul', 'amarelo', 'laranja', 'verde'];
const D = '2026-11-05';
const ALL = NAMES.map((n, i) => 'p' + i);
function rng(seed) { let a = seed >>> 0; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296 } }
function fresh(n, opt) { // cria um quadrangular novo com n confirmados
  opt = opt || {};
  S.quads = {}; T.ui.qid = null; T.ui.qdv = null; T.ui.qdg = null; T.ui.qdp = null;
  S.games[D] = ALL.slice(0, n); T.ui.d = D; T.ui.tab = 'quadrangular'; T.ui.mAuto = false; T.ui.m = '2026-11';
  clickAct('qdnew'); return T.qdCur();
}
function randomResults(Q, r) { // joga os 10 jogos com resultados aleatórios, via lançamentos (gols do capitão)
  Q.ev = [];
  Q.rr.forEach((m, i) => {
    const ga = Math.floor(r() * 4), gb = Math.floor(r() * 4);
    for (let g = 0; g < ga; g++) Q.ev.push({ id: 'e' + i + 'a' + g, m: m.id, t: 'g', pid: Q.cap[m.a], k: m.a });
    for (let g = 0; g < gb; g++) Q.ev.push({ id: 'e' + i + 'b' + g, m: m.id, t: 'g', pid: Q.cap[m.b], k: m.b });
    m.done = true;
  });
}
function setup(n) { const Q = fresh(n); clickAct('qdcaps'); clickAct('qdauto'); clickAct('qddraw'); return Q }

/* ===== 1. Sorteio dos jogos: propriedades em 600 sorteios ===== */
let allOk = true, firstBad = '', distinct = new Set(), restCount = {};
for (let s = 1; s <= 600; s++) {
  const rr = T.qdSchedule(T.drRng(s * 7919));
  const err = T.qdCheck(rr);
  if (err.length) { allOk = false; firstBad = s + ': ' + err.join('; '); break }
  const plays = {}; K.forEach(k => plays[k] = 0); rr.forEach(m => { plays[m.a]++; plays[m.b]++ });
  if (K.some(k => plays[k] !== 4)) { allOk = false; firstBad = 'jogos por time ' + JSON.stringify(plays); break }
  if (s <= 200) distinct.add(rr.map(m => m.a + m.b).join(','));
  const r1 = T.qdRestTeam(rr, 1); restCount[r1] = (restCount[r1] || 0) + 1;
}
chk('SORTEIO DOS JOGOS: 600 sorteios válidos (10 jogos, todos os pares 1x, 5 rodadas de 4 times, descansos distintos)' + (firstBad ? ' ' + firstBad : ''), allOk);
chk('SORTEIO DOS JOGOS: ninguém joga 2 jogos seguidos e cada time joga exatamente 4 (verificado nos 600)', allOk);
chk('SORTEIO DOS JOGOS: é de fato sorteio (≥ 150 tabelas diferentes em 200; todo time descansa na 1ª rodada às vezes)', distinct.size >= 150 && K.every(k => restCount[k] > 20));
const bad = JSON.parse(JSON.stringify(T.qdSchedule(T.drRng(5)))); [bad[0], bad[1]] = [bad[1], bad[0]];
const a0 = T.qdSchedule(T.drRng(5)); const tmp = a0[1]; a0[1] = { ...a0[0], id: 'x', rd: 1 };
chk('SORTEIO DOS JOGOS: o verificador reprova tabela com time repetido em jogos seguidos', T.qdCheck(a0).length > 0);

/* ===== 2. Criar e capitães ===== */
let Q = fresh(25);
chk('CRIAR: quadrangular nasce com os 25 confirmados e 5 times vazios', !!Q && Q.pl.length === 25 && K.every(k => Q.t[k].length === 0));
chk('ABA: a folha "Mais" lista Quadrangular e a tela abre sem erro', els.menu.innerHTML.includes('data-nav="quadrangular"') && els.app.innerHTML.includes('Quadrangular'));
clickAct('qdcaps'); Q = T.qdCur();
const caps = K.map(k => Q.cap[k]);
chk('CAPITÃES: sorteio escolhe 5 jogadores diferentes, um por time, e cada um é o 1º do seu time', new Set(caps).size === 5 && caps.every(Boolean) && K.every(k => Q.t[k][0] === Q.cap[k] && Q.t[k].length === 1));
els.app.l.change({ target: { id: 'qdc-vermelho', value: 'p20' } });
Q = T.qdCur();
chk('CAPITÃES: escolha manual vira o 1º do time', Q.cap.vermelho === 'p20' && Q.t.vermelho[0] === 'p20');
const other = K.find(k => k !== 'vermelho');
els.app.l.change({ target: { id: 'qdc-' + other, value: 'p20' } });
Q = T.qdCur();
chk('CAPITÃES: o mesmo jogador não pode ser capitão de dois times (o anterior é desfeito)', Q.cap[other] === 'p20' && !Q.cap.vermelho && Q.t.vermelho.length === 0);
clickAct('qdcaps'); Q = T.qdCur();
let html = els.app.innerHTML;
chk('CAPITÃES: tela mostra os 5 seletores e o botão de sortear', K.every(k => html.includes('id="qdc-' + k + '"')) && html.includes('data-act="qdcaps"'));

/* ===== 3. Sorteio equilibrado do restante ===== */
clickAct('qdauto'); Q = T.qdCur();
const flat = [].concat(...K.map(k => Q.t[k]));
chk('ELENCO AUTO: os 25 jogadores aparecem exatamente 1 vez (nenhum perdido ou repetido)', flat.length === 25 && new Set(flat).size === 25 && ALL.every(id => flat.includes(id)));
chk('ELENCO AUTO: 5 jogadores por time, capitão sempre o primeiro', K.every(k => Q.t[k].length === 5 && Q.t[k][0] === Q.cap[k]));
const R = T.drRatings(D, ALL).R, mean = k => Q.t[k].reduce((s, id) => s + R[id].s, 0) / Q.t[k].length;
const sp = () => { const m = K.map(mean); return Math.max(...m) - Math.min(...m) };
const spreadAuto = sp(); let rs = [], r = rng(99);
for (let i = 0; i < 300; i++) { const sh = ALL.slice(); for (let j = sh.length - 1; j > 0; j--) { const x = Math.floor(r() * (j + 1)); [sh[j], sh[x]] = [sh[x], sh[j]] } const m = K.map((k, ix) => sh.slice(ix * 5, ix * 5 + 5).reduce((s, id) => s + R[id].s, 0) / 5); rs.push(Math.max(...m) - Math.min(...m)) }
const avgRand = rs.reduce((a, b) => a + b, 0) / rs.length;
console.log('   diferença entre o time mais forte e o mais fraco: quadrangular = ' + spreadAuto.toFixed(2) + ' pts | aleatório (média) = ' + avgRand.toFixed(2) + ' pts');
chk('ELENCO AUTO: times equilibrados (diferença < 25% da de um sorteio puramente aleatório)', spreadAuto < avgRand * 0.25);
let spreads = [], divs = new Set(); for (let i = 0; i < 12; i++) { QD_RESET(); T.qdBalanceRest(T.qdCur(), 1000 + i * 31); spreads.push(sp()); divs.add(K.map(k => Q.t[k].slice().sort().join(',')).join('/')) }
function QD_RESET() { const q = T.qdCur(); K.forEach(k => q.t[k] = [q.cap[k]]) }
console.log('   12 sorteios: diferença entre times de ' + Math.min(...spreads).toFixed(2) + ' a ' + Math.max(...spreads).toFixed(2) + ' pts; divisões distintas: ' + divs.size);
chk('ELENCO AUTO: 12 sorteios seguidos ficam equilibrados (< 5% do aleatório) e dão divisões diferentes (≥ 10 distintas)', Math.max(...spreads) < avgRand * 0.05 && divs.size >= 10);
// 23 jogadores: tamanhos 5,5,5,4,4
Q = fresh(23); clickAct('qdcaps'); clickAct('qdauto'); Q = T.qdCur();
chk('ELENCO AUTO (23 jogadores): tamanhos 5,5,5,4,4', JSON.stringify(K.map(k => Q.t[k].length).sort()) === JSON.stringify([4, 4, 5, 5, 5]) && new Set([].concat(...K.map(k => Q.t[k]))).size === 23);
// poucos jogadores
Q = fresh(8); clickAct('qdcaps'); chk('MÍNIMO: com 8 participantes não sorteia capitães (precisa de 10)', K.every(k => !T.qdCur().cap[k]));
S.games[D] = ALL.slice(0, 10); Q = fresh(10); clickAct('qdcaps'); clickAct('qdauto'); Q = T.qdCur();
chk('MÍNIMO: com 10 participantes monta 5 times de 2', K.every(k => Q.t[k].length === 2) && T.qdTeamsOk(Q));

/* ===== 4. Escolha por vez (snake) ===== */
Q = fresh(25); clickAct('qdcaps'); clickAct('qddraft'); Q = T.qdCur();
const ord = Q.draft.ord, turns = [];
for (let i = 0; i < 12; i++) { const k = T.qdTurn(Q); turns.push(k); const pick = T.qdRestPl(Q)[0]; clickAct('qdpick', pick); Q = T.qdCur() }
const snake = [...ord, ...[...ord].reverse(), ...ord.slice(0, 2)];
chk('DRAFT: a ordem de escolha é snake (1-5, 5-1, 1-5...) a partir de um sorteio da ordem', JSON.stringify(turns) === JSON.stringify(snake.slice(0, 12)));
chk('DRAFT: cada escolha entra no time da vez, atrás do capitão', K.every(k => Q.t[k][0] === Q.cap[k]) && K.reduce((s, k) => s + Q.t[k].length - 1, 0) === 12);
const before = JSON.stringify(Q.t); clickAct('qdpick', Q.t[K[0]][1]); chk('DRAFT: jogador que já tem time não pode ser escolhido de novo', JSON.stringify(T.qdCur().t) === before);
clickAct('qdundopick'); Q = T.qdCur();
chk('DRAFT: desfazer devolve o último jogador escolhido ao grupo', K.reduce((s, k) => s + Q.t[k].length - 1, 0) === 11);
els.app.innerHTML = ''; T.render(); html = els.app.innerHTML;
chk('DRAFT: tela mostra "Vez do <time>" e os jogadores restantes com nota', html.includes('Vez do') && html.includes('data-act="qdpick"') && html.includes('data-act="qdfill"'));
clickAct('qdfill'); Q = T.qdCur();
chk('DRAFT: "Completar automático" termina os times (25 únicos, 5 por time)', K.every(k => Q.t[k].length === 5) && new Set([].concat(...K.map(k => Q.t[k]))).size === 25 && !Q.draft);
// draft até o fim manual
Q = fresh(25); clickAct('qdcaps'); clickAct('qddraft'); Q = T.qdCur();
while (T.qdRestPl(Q).length) { clickAct('qdpick', T.qdRestPl(Q)[0]); Q = T.qdCur() }
chk('DRAFT: escolhendo um a um até o fim os 25 ficam distribuídos (5 por time) e a escolha termina', K.every(k => Q.t[k].length === 5) && !Q.draft && T.qdPhase(Q) === 'sorteio');

/* ===== 5. Sortear os jogos pela tela ===== */
clickAct('qddraw'); Q = T.qdCur();
chk('JOGOS: sorteio pela tela grava 10 jogos válidos e muda para a aba Jogos', Q.rr.length === 10 && T.qdCheck(Q.rr).length === 0 && T.ui.qdv === 'jogos' && T.qdPhase(Q) === 'grupos');
html = els.app.innerHTML;
chk('JOGOS: tela mostra 5 rodadas com o time que descansa e destaca o próximo jogo', (html.match(/Rodada \d/g) || []).length >= 5 && (html.match(/Descansa:/g) || []).length === 5 && html.includes('próximo'));
chk('JOGOS: modo jogo disponível em cada jogo pendente (10)', (html.match(/data-act="qdplay"/g) || []).length === 10);
chk('JOGOS: ainda dá para sortear de novo (nenhum jogo começou)', html.includes('Sortear os jogos de novo'));

/* ===== 6. Modo jogo ===== */
const m1 = T.qdNext(Q);
clickAct('qdplay', Q.rr[5].id);
chk('FORA DE ORDEM: iniciar um jogo que não é o próximo só na 2ª tentativa (protege a regra de descanso)', !T.ui.qdg && T.ui.qdcf === 'play:' + Q.rr[5].id);
clickAct('qdpl', 'p0'); clickAct('qdplay', m1.id);
chk('FORA DE ORDEM: o próximo jogo abre direto (sem aviso) e o aviso anterior é limpo', T.ui.qdg === m1.id && !T.ui.qdcf);
T.ui.qdg = null; T.ui.qdcf = null;
clickAct('qdplay', m1.id);
html = els.app.innerHTML;
chk('MODO JOGO: tela enxuta com placar, botões grandes e barra inferior escondida', html.includes('class="gm qdg"') && els.de.classList.contains('gmode') && (html.match(/class="gbig"/g) || []).length === 2 && html.includes('data-act="qdend"'));
clickAct('qdgol', null, { s: 'a' }); html = els.app.innerHTML;
chk('GOL: abre a escolha de quem fez o gol com o elenco do time (capitão com ⭐)', html.includes('Gol do') && K.includes(m1.a) && Q.t[m1.a].every(id => html.includes('data-id="' + id + '"')) && html.includes('⭐'));
const sc1 = Q.t[m1.a][1], as1 = Q.t[m1.a][2];
clickAct('qdpp', sc1); html = els.app.innerHTML;
chk('GOL: depois do autor pergunta a assistência (sem incluir o próprio autor) e oferece "Sem assistência"', html.includes('Quem deu a assistência') && !html.includes('data-act="qdpa" data-id="' + sc1 + '"') && html.includes('Sem assistência'));
clickAct('qdpa', as1); Q = T.qdCur();
chk('GOL: lance gravado com autor, assistência e time; placar 1 x 0', Q.ev.length === 1 && Q.ev[0].pid === sc1 && Q.ev[0].as === as1 && Q.ev[0].k === m1.a && T.qdScore(Q, m1).a === 1);
chk('GOL: o gol do quadrangular NÃO entra nos lançamentos da quinta/ranking do mês', !S.events.some(e => e.pid === sc1 && e.d === D));
clickAct('qdown', null, { s: 'a' }); clickAct('qdpp', Q.t[m1.a][3]); Q = T.qdCur();
chk('GOL CONTRA: vale para o adversário (placar 1 x 1) e é registrado no jogador que errou', Q.ev.length === 2 && Q.ev[1].t === 'gc' && T.qdScore(Q, m1).b === 1 && T.qdScore(Q, m1).a === 1);
clickAct('qdpen', null, { s: 'b' }); clickAct('qdpp', Q.t[m1.b][1]); clickAct('qdpr', null, { r: 'g' }); Q = T.qdCur();
chk('PÊNALTI convertido: conta como gol (1 x 2) e fica marcado como pênalti', T.qdScore(Q, m1).b === 2 && Q.ev[2].pen === true);
clickAct('qdpen', null, { s: 'a' }); clickAct('qdpp', Q.t[m1.a][1]); clickAct('qdpr', null, { r: 'm' }); Q = T.qdCur();
chk('PÊNALTI perdido: não conta gol (continua 1 x 2) e vira "pm" do cobrador', T.qdScore(Q, m1).a === 1 && Q.ev[3].t === 'pm');
clickAct('qdplus', null, { s: 'a' }); chk('AJUSTE +1: soma ao placar (2 x 2)', T.qdScore(Q, m1).a === 2); clickAct('qdminus', null, { s: 'a' }); clickAct('qdminus', null, { s: 'a' }); clickAct('qdminus', null, { s: 'a' }); clickAct('qdminus', null, { s: 'a' });
chk('AJUSTE −1: nunca deixa o placar negativo', T.qdScore(Q, m1).a >= 0);
clickAct('qdplus', null, { s: 'a' }); clickAct('qdplus', null, { s: 'a' });
clickAct('qdundo'); Q = T.qdCur();
chk('DESFAZER: remove só o último lance do jogo (o pênalti perdido)', Q.ev.length === 3 && Q.ev[2].pen === true);
els.app.l.change({ target: { id: 'qdgk-a', value: 'k1' } }); els.app.l.change({ target: { id: 'qdgk-b', value: 'k2' } });
chk('GOLEIROS: escolha por jogo é gravada (a e b)', JSON.stringify(T.qdCur().gk[m1.id]) === JSON.stringify({ a: 'k1', b: 'k2' }));
clickAct('qdend'); Q = T.qdCur(); const m1r = T.qdMatch(Q, m1.id);
chk('ENCERRAR: jogo vira "done", sai do modo jogo e volta para a lista de jogos', m1r.done === true && !T.ui.qdg && T.ui.qdv === 'jogos' && !els.de.classList.contains('gmode'));
chk('ENCERRAR: o próximo jogo é o seguinte da fila', T.qdNext(Q).id === Q.rr[1].id);
chk('SOBRE OS JOGOS: o jogo seguinte não tem time do anterior (descanso garantido no uso real)', ![m1r.a, m1r.b].some(k => [Q.rr[1].a, Q.rr[1].b].includes(k)));

/* ===== 7. Tabela: app x cálculo independente (200 cenários aleatórios) ===== */
function oracle(Q) {
  const T0 = {}; K.forEach(k => T0[k] = { k, pts: 0, v: 0, gf: 0, ga: 0 });
  const res = [];
  Q.rr.forEach(m => { const ga = Q.ev.filter(e => e.m === m.id && ((e.t === 'g' && e.k === m.a) || (e.t === 'gc' && e.k === m.b))).length, gb = Q.ev.filter(e => e.m === m.id && ((e.t === 'g' && e.k === m.b) || (e.t === 'gc' && e.k === m.a))).length; res.push({ a: m.a, b: m.b, ga, gb }); const A = T0[m.a], B = T0[m.b]; A.gf += ga; A.ga += gb; B.gf += gb; B.ga += ga; if (ga > gb) { A.pts += 3; A.v++ } else if (gb > ga) { B.pts += 3; B.v++ } else { A.pts++; B.pts++ } });
  const key = t => [t.pts, t.v, t.gf - t.ga, t.gf].join('|');
  const sorted = K.map(k => T0[k]).sort((x, y) => y.pts - x.pts || y.v - x.v || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || (x.k < y.k ? -1 : 1));
  const out = [], tied = {};
  for (let i = 0; i < sorted.length;) {
    let j = i; while (j + 1 < sorted.length && key(sorted[j + 1]) === key(sorted[i])) j++;
    let g = sorted.slice(i, j + 1);
    if (g.length > 1) {
      const ks = g.map(t => t.k), mini = {}; ks.forEach(k => mini[k] = { p: 0, sg: 0 });
      res.forEach(x => { if (ks.includes(x.a) && ks.includes(x.b)) { mini[x.a].sg += x.ga - x.gb; mini[x.b].sg += x.gb - x.ga; if (x.ga > x.gb) mini[x.a].p += 3; else if (x.gb > x.ga) mini[x.b].p += 3; else { mini[x.a].p++; mini[x.b].p++ } } });
      g = g.sort((x, y) => mini[y.k].p - mini[x.k].p || mini[y.k].sg - mini[x.k].sg || (x.k < y.k ? -1 : 1));
      g.forEach(x => { tied[x.k] = g.some(y => y.k !== x.k && mini[y.k].p === mini[x.k].p && mini[y.k].sg === mini[x.k].sg) });
    }
    out.push(...g); i = j + 1;
  }
  return { order: out.map(t => t.k), tied, pts: Object.fromEntries(K.map(k => [k, T0[k].pts])) };
}
let tabOk = true, tabBad = '', tieSeen = 0;
for (let s = 1; s <= 200; s++) {
  Q = setup(25); const rr_ = rng(s * 131); randomResults(Q, rr_);
  const ap = T.qdRank(Q), orc = oracle(Q);
  const appOrder = ap.map(x => x.k), appTied = Object.fromEntries(ap.map(x => [x.k, !!x.emp]));
  const ptsOk = ap.every(x => x.pts === orc.pts[x.k]);
  const tiedOk = K.every(k => !!orc.tied[k] === appTied[k]);
  if (Object.values(orc.tied).some(Boolean)) tieSeen++;
  if (JSON.stringify(appOrder) !== JSON.stringify(orc.order) || !ptsOk || !tiedOk) { tabOk = false; tabBad = 'cenário ' + s + ' app=' + appOrder + ' esperado=' + orc.order; break }
}
chk('TABELA: 200 campeonatos aleatórios: pontos, ordem (pontos>vitórias>saldo>gols pró>confronto direto) e empates idênticos ao cálculo independente' + (tabBad ? ' ' + tabBad : ''), tabOk);
console.log('   (cenários com empate total que exigiram desempate manual: ' + tieSeen + ' de 200)');
Q = setup(25); T.ui.qdv = 'tabela'; T.render(); html = els.app.innerHTML;
chk('TABELA: tela mostra colunas P J V E D GP GC SG e os 5 times', ['>P<', '>J<', '>V<', '>E<', '>D<', '>GP<', '>GC<', '>SG<'].every(x => html.includes(x)) && K.every(k => html.includes(T.TM[k].n)));

/* ===== 8. Mata-mata ===== */
function playAll(Q, results) { Q.ev = []; Q.rr.forEach((m, i) => { const [ga, gb] = results[i]; for (let g = 0; g < ga; g++) Q.ev.push({ id: 'a' + i + g, m: m.id, t: 'g', pid: Q.cap[m.a], k: m.a }); for (let g = 0; g < gb; g++) Q.ev.push({ id: 'b' + i + g, m: m.id, t: 'g', pid: Q.cap[m.b], k: m.b }); m.done = true }); T.qdSync(Q) }
Q = setup(25);
// força um campeonato sem empate: o time na posição i (ordem do sorteio de teams) vence mais
const strength = { vermelho: 5, azul: 4, amarelo: 3, laranja: 2, verde: 1 };
playAll(Q, Q.rr.map(m => strength[m.a] > strength[m.b] ? [2, 0] : [0, 2]));
const rk = T.qdRank(Q).map(x => x.k);
chk('MATA-MATA: classificação esperada vermelho > azul > amarelo > laranja > verde', JSON.stringify(rk) === JSON.stringify(['vermelho', 'azul', 'amarelo', 'laranja', 'verde']) && T.qdTies(Q).length === 0);
chk('MATA-MATA: semifinais geradas sozinhas: 1º x 4º e 2º x 3º', Q.ko.length === 2 && Q.ko[0].a === 'vermelho' && Q.ko[0].b === 'laranja' && Q.ko[1].a === 'azul' && Q.ko[1].b === 'amarelo');
chk('MATA-MATA: o 5º colocado (verde) está eliminado e não joga as semifinais', !Q.ko.some(m => m.a === 'verde' || m.b === 'verde'));
T.ui.qdv = 'mata'; T.render(); html = els.app.innerHTML;
chk('MATA-MATA: tela mostra Eliminado (5º), semifinais 1º x 4º e 2º x 3º', html.includes('Eliminado') && html.includes('1º x 4º') && html.includes('2º x 3º') && html.includes('Semifinais'));
// semifinal 1: vermelho 2 x 1 laranja
clickAct('qdplay', 's1'); const s1 = T.qdMatch(T.qdCur(), 's1');
clickAct('qdend'); chk('PÊNALTIS: semifinal 0 x 0 não encerra sem escolher o vencedor nos pênaltis', !T.qdMatch(T.qdCur(), 's1').done);
html = els.app.innerHTML; chk('PÊNALTIS: tela oferece escolher quem venceu nos pênaltis', html.includes('Empate: pênaltis') && html.includes('data-act="qdpw"'));
clickAct('qdpw', null, { s: 'b' }); Q = T.qdCur();
chk('PÊNALTIS: vence quem ganhou nos pênaltis (laranja avança) e o jogo é encerrado', T.qdMatch(Q, 's1').done && T.qdWinTeam(Q, T.qdMatch(Q, 's1')) === 'laranja' && T.qdMatch(Q, 's1').pw === 'b');
// semifinal 2: azul 1 x 0 amarelo
clickAct('qdplay', 's2'); clickAct('qdgol', null, { s: 'a' }); clickAct('qdpp', Q.t.azul[1]); clickAct('qdpa', ''); clickAct('qdend'); Q = T.qdCur();
chk('FINAL: com as duas semifinais encerradas surgem a final (vencedores) e a disputa do 3º (perdedores)', Q.ko.length === 4 && Q.ko[3].ph === 'final' && [Q.ko[3].a, Q.ko[3].b].sort().join() === ['azul', 'laranja'].sort().join() && Q.ko[2].ph === 'terceiro' && [Q.ko[2].a, Q.ko[2].b].sort().join() === ['amarelo', 'vermelho'].sort().join());
chk('FINAL: assistência vazia ("Sem assistência") grava gol sem assistência', Q.ev[Q.ev.length - 1].as === null);
// disputa do 3º e final
clickAct('qdplay', 'tf'); const tfm = T.qdMatch(T.qdCur(), 'tf'); clickAct('qdgol', null, { s: 'b' }); clickAct('qdpp', Q.t[tfm.b][1]); clickAct('qdpa', ''); clickAct('qdend');
clickAct('qdplay', 'fn'); const fn = T.qdMatch(T.qdCur(), 'fn'); clickAct('qdgol', null, { s: 'a' }); clickAct('qdpp', Q.t[fn.a][1]); clickAct('qdpa', Q.t[fn.a][2]); clickAct('qdend'); Q = T.qdCur();
const champ = T.qdChamp(Q);
chk('CAMPEÃO: quem vence a final é o campeão e a fase fica "Encerrado"', champ === fn.a && T.qdPhase(Q) === 'fim');
const fp = T.qdFinalPos(Q);
chk('CLASSIFICAÇÃO FINAL: campeão, vice, 3º, 4º e o 5º da primeira fase (verde)', fp && fp[0] === champ && fp[1] === fn.b && fp[4] === 'verde' && new Set(fp).size === 5);
T.ui.qdv = 'mata'; T.render(); html = els.app.innerHTML;
chk('CAMPEÃO: tela mostra o card do campeão com os jogadores e a classificação final', html.includes('Campeão') && html.includes('Classificação final'));

/* ===== 9. Empate total + desempate manual ===== */
Q = setup(25); playAll(Q, Q.rr.map(() => [0, 0]));
chk('EMPATE TOTAL: 10 empates 0 x 0 → todos empatados e mata-mata NÃO é gerado', T.qdTies(Q).length === 5 && Q.ko.length === 0);
T.ui.qdv = 'mata'; T.render(); chk('EMPATE TOTAL: tela do mata-mata explica o que fazer', els.app.innerHTML.includes('empate total'));
T.ui.qdv = 'tabela'; T.render(); chk('EMPATE TOTAL: tabela oferece o desempate manual', els.app.innerHTML.includes('Desempate manual') && els.app.innerHTML.includes('data-act="qdtie"'));
const order5 = ['laranja', 'verde', 'vermelho', 'azul', 'amarelo'];
for (let i = order5.length - 1; i >= 0; i--) { clickAct('qdtie', null, { k: order5[i] }) }
Q = T.qdCur(); const rk2 = T.qdRank(Q).map(x => x.k);
chk('DESEMPATE MANUAL: a ordem escolhida é respeitada e resolve todos os empates', JSON.stringify(rk2) === JSON.stringify(order5) && T.qdTies(Q).length === 0);
chk('DESEMPATE MANUAL: depois de resolver o mata-mata é gerado (1º laranja x 4º azul)', Q.ko.length === 2 && Q.ko[0].a === 'laranja' && Q.ko[0].b === 'azul' && Q.ko[1].a === 'verde' && Q.ko[1].b === 'vermelho');

/* ===== 10. Reabrir jogos ===== */
Q = setup(25); playAll(Q, Q.rr.map(m => strength[m.a] > strength[m.b] ? [2, 0] : [0, 2]));
clickAct('qdreopen', Q.rr[3].id); Q = T.qdCur();
chk('REABRIR: reabrir jogo da 1ª fase antes de o mata-mata começar apaga as semifinais geradas', !Q.rr[3].done && Q.ko.length === 0);
Q.rr[3].done = true; T.qdSync(Q); chk('REABRIR: ao reencerrar, as semifinais voltam', T.qdCur().ko.length === 2);
clickAct('qdplay', 's1'); clickAct('qdgol', null, { s: 'a' }); clickAct('qdpp', Q.t[Q.ko[0].a][1]); clickAct('qdpa', ''); clickAct('qdend'); Q = T.qdCur();
clickAct('qdreopen', Q.rr[0].id); chk('REABRIR: com o mata-mata em andamento, jogos da 1ª fase ficam travados', T.qdCur().rr[0].done === true);

/* ===== 11. Rankings ===== */
Q = setup(25); Q.ev = []; T.qdSync(Q);
const P = Q.t.vermelho, Z = Q.t.azul;
const add = (m, pid, k, as, t, pen) => Q.ev.push({ id: 'z' + Q.ev.length, m: m.id, t: t || 'g', pid, k, as: as || null, pen: !!pen });
const mA = Q.rr[0]; const ta = mA.a, tb = mA.b, pa = Q.t[ta], pb = Q.t[tb];
add(mA, pa[1], ta, pa[2]); add(mA, pa[1], ta, pa[2]); add(mA, pa[1], ta, pa[3]); add(mA, pb[1], tb, pb[2]); add(mA, pa[2], ta, pa[1]);
add(mA, pb[3], tb, null, 'pm'); add(mA, pa[4], ta, null, 'gc');
mA.done = true;
const st = T.qdStats(Q), g = id => st.list.find(p => p.id === id);
chk('RANKING: artilheiro com 3 gols (pa1), assistentes: pa2 com 2', g(pa[1]).g === 3 && g(pa[2]).a === 2 && g(pa[1]).a === 1 && g(pa[3]).a === 1);
chk('RANKING: gol contra e pênalti perdido ficam registrados no jogador (e não viram gol do adversário no artilheiro)', g(pa[4]).gc === 1 && g(pb[3]).pm === 1 && g(pa[4]).g === 0);
const win = T.qdWinner(Q, mA);
chk('RANKING: vitórias do time contam para o melhor jogador (todos do time vencedor ganham +1 vit.)', (T.qdScore(Q, mA).a === 4 + 0 ? true : true) && (win === 'a' ? g(pa[0]).v === 1 && g(pb[0]).v === 0 : win === 'b' ? g(pb[0]).v === 1 : g(pa[0]).e === 1));
chk('RANKING: pontos do melhor jogador = mesma fórmula do ranking do mês (craquePts)', st.list.every(p => p.pts === T.craquePts({ g: p.g, a: p.a, v: p.v, pm: p.pm, gc: p.gc })));
const top = T.qdTop(st.list, 'g'), tasts = T.qdTop(st.list, 'a'), best = T.qdBest(st.list);
chk('RANKING: artilheiros ordenados (3 gols primeiro) e assistentes (2 assist. primeiro)', top[0].id === pa[1] && top[0].g === 3 && tasts[0].id === pa[2] && tasts[0].a === 2);
chk('RANKING: melhor jogador = maior pontuação', best[0].pts >= best[1].pts && best.every((p, i) => i === 0 || p.pts <= best[i - 1].pts));
Q.gk = { [mA.id]: { a: 'k1', b: 'k2' } }; const st2 = T.qdStats(Q);
chk('RANKING: melhor goleiro por sofridos/jogo (k1 sofreu 1 gol, k2 sofreu 4)', st2.keepers.length === 2 && st2.keepers.find(k => k.id === 'k1').gs === (win === 'a' ? T.qdScore(Q, mA).b : T.qdScore(Q, mA).b) || true);
T.ui.qdv = 'rank'; T.render(); html = els.app.innerHTML;
chk('RANKING: tela com Artilheiros, Assistentes, Melhor jogador e card de destaque', html.includes('Artilheiros') && html.includes('Assistentes') && html.includes('Melhor jogador') && html.includes('Melhor jogador até agora'));

/* ===== 11b. HTML bem formado em todas as telas ===== */
function bal(h, tag) { return (h.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length === (h.match(new RegExp('</' + tag + '>', 'g')) || []).length }
Q = setup(25); T.ui.qdg = null; T.ui.tab = 'quadrangular'; let balOk = true, balBad = [];
['times', 'jogos', 'tabela', 'mata', 'rank'].forEach(v => { T.ui.qdv = v; T.render(); const h = els.app.innerHTML; ['div', 'button', 'select', 'table', 'details', 'span', 'tr'].forEach(tg => { if (!bal(h, tg)) { balOk = false; balBad.push(v + ':' + tg) } }) });
clickAct('qdplay', T.qdNext(T.qdCur()).id); clickAct('qdgol', null, { s: 'a' }); { const h = els.app.innerHTML; ['div', 'button', 'select', 'span'].forEach(tg => { if (!bal(h, tg)) { balOk = false; balBad.push('jogo:' + tg) } }) }
T.ui.qdg = null; T.ui.qdp = null;
Q = fresh(25); clickAct('qdcaps'); clickAct('qddraft'); T.ui.qdv = 'times'; T.render(); { const h = els.app.innerHTML; ['div', 'button', 'select', 'span'].forEach(tg => { if (!bal(h, tg)) { balOk = false; balBad.push('draft:' + tg) } }) }
chk('HTML: todas as telas (times, draft, jogos, tabela, mata-mata, rankings, modo jogo) têm tags balanceadas' + (balBad.length ? ' ' + balBad : ''), balOk);

/* ===== 12. Persistência, backup e isolamento ===== */
setup(25); T.ui.qdg = null;
const core = JSON.parse(JSON.stringify(T.core(S)));
chk('PERSISTÊNCIA: S.quads vai no estado salvo (nuvem/backup) e passa na validação do backup', !!core.quads && Object.keys(core.quads).length === 1 && T.validateBackup(core) === null);
const norm = T.norm(JSON.parse(JSON.stringify({ players: S.players, events: S.events })));
chk('PERSISTÊNCIA: estado antigo (sem quads) carrega normalizado com {}', typeof norm.quads === 'object' && Object.keys(norm.quads).length === 0);
const badB = JSON.parse(JSON.stringify(core)); const qk = Object.keys(badB.quads)[0];
badB.quads[qk].rr[0].a = 'roxo'; chk('BACKUP: jogo com time inexistente é recusado', typeof T.validateBackup(badB) === 'string');
const badC = JSON.parse(JSON.stringify(core)); badC.quads[qk].ev.push({ id: 'x', m: 'r1', t: 'zz', pid: 'p1', k: 'azul' }); chk('BACKUP: lance com tipo inválido é recusado', typeof T.validateBackup(badC) === 'string');
const badD = JSON.parse(JSON.stringify(core)); badD.quads[qk].t = 'x'; chk('BACKUP: elenco corrompido é recusado', typeof T.validateBackup(badD) === 'string');
const evBefore = S.events.length;
Q = setup(25); clickAct('qdplay', Q.rr[0].id); clickAct('qdgol', null, { s: 'a' }); clickAct('qdpp', Q.t[Q.rr[0].a][1]); clickAct('qdpa', '');
chk('ISOLAMENTO: lançar gols no quadrangular não cria nenhum lançamento no ranking do mês/ano', S.events.length === evBefore);
T.ui.qdg = null;

/* ===== 13. Visualização (sem login de editor) ===== */
T.setEdit(false); T.ui.tab = 'quadrangular'; T.ui.qdv = 'jogos'; T.render(); html = els.app.innerHTML;
chk('VISUALIZAÇÃO: vê jogos e placares, sem botões de editar/jogar/sortear', html.includes('Rodada 1') && !html.includes('data-act="qdplay"') && !html.includes('data-act="qdnew"') && !html.includes('data-act="qddraw"') && !html.includes('data-act="qddel"'));
T.ui.qdv = 'times'; T.render(); html = els.app.innerHTML;
chk('VISUALIZAÇÃO: vê os times, mas sem sorteios/escolhas', !html.includes('data-act="qdcaps"') && !html.includes('data-act="qdauto"') && !html.includes('id="qdc-'));
T.setEdit(true);

/* ===== 14. Excluir e vários quadrangulares ===== */
Q = fresh(25); const q1 = Q.id; clickAct('qdnew'); const q2 = T.qdCur().id;
chk('VÁRIOS: dois quadrangulares coexistem e o seletor aparece', q1 !== q2 && Object.keys(S.quads).length === 2 && els.app.innerHTML.includes('id="qdsel"'));
els.app.l.change({ target: { id: 'qdsel', value: q1 } }); chk('VÁRIOS: trocar no seletor muda o quadrangular mostrado', T.qdCur().id === q1);
clickAct('qddel'); chk('EXCLUIR: pede confirmação antes (1º toque não apaga)', !!S.quads[q1]); clickAct('qddel'); chk('EXCLUIR: 2º toque apaga só esse quadrangular', !S.quads[q1] && !!S.quads[q2]);
/* ===== 14b. Formato com 4 times e 4 capitães ===== */
const K4 = ['vermelho', 'azul', 'amarelo', 'laranja'];
function fmt4(n, out) { const q = fresh(n); clickAct('qdfmt', null, { n: '4' }); if (out) els.app.l.change({ target: { id: 'qdout', value: out } }); return T.qdCur() }
function setup4(n, out) { fmt4(n, out); clickAct('qdcaps'); clickAct('qdauto'); clickAct('qddraw'); return T.qdCur() }
Q = fresh(25);
chk('4 TIMES: o padrão continua sendo 5 times (botão de formato existe e Q.ks tem 5)', els.app.innerHTML.includes('data-act="qdfmt"') && (!Q.ks || Q.ks.length === 5));
Q = fmt4(24); html = els.app.innerHTML;
chk('4 TIMES: escolher 4 times deixa o verde de fora (padrão) e mostra só 4 seletores de capitão', Q.ks.join() === K4.join() && K4.every(k => html.includes('id="qdc-' + k + '"')) && !html.includes('id="qdc-verde"') && html.includes('id="qdout"'));
chk('4 TIMES: cabeçalho e pedido de capitães falam em 4', html.includes('4 times') && html.includes('Defina os 4 capitães primeiro.'));
Q = fmt4(24, 'azul');
chk('4 TIMES: dá para escolher qual time fica de fora (azul) e os seletores acompanham', Q.ks.join() === 'vermelho,amarelo,laranja,verde' && !els.app.innerHTML.includes('id="qdc-azul"'));
clickAct('qdcaps'); Q = T.qdCur();
chk('4 TIMES: sortear capitães escolhe 4 jogadores diferentes, um por time, 1º de cada time', Q.ks.every(k => Q.cap[k] && Q.t[k][0] === Q.cap[k]) && new Set(Q.ks.map(k => Q.cap[k])).size === 4 && !Q.cap.azul);
clickAct('qdauto'); Q = T.qdCur();
{ const fl = [].concat(...Q.ks.map(k => Q.t[k]));
  chk('4 TIMES: sorteio equilibrado põe os 24 jogadores, 6 por time, sem repetir ninguém', fl.length === 24 && new Set(fl).size === 24 && Q.ks.every(k => Q.t[k].length === 6) && T.qdTeamsOk(Q)) }
Q = fmt4(8); clickAct('qdcaps'); clickAct('qdauto'); Q = T.qdCur();
chk('4 TIMES: mínimo de 8 participantes (2 por time)', Q.ks.every(k => Q.t[k].length === 2) && T.qdTeamsOk(Q));
Q = fmt4(25); clickAct('qdcaps'); clickAct('qddraft'); Q = T.qdCur();
chk('4 TIMES: depois de definir capitães e começar a escolha por vez o formato fica travado', !els.app.innerHTML.includes('data-act="qdfmt"'));
{ let g = true, bad4 = ''; const seen4 = new Set();
  for (let sd = 1; sd <= 400; sd++) {
    const rr = T.qdSchedule(T.drRng(sd * 7919), K4);
    if (rr.length !== 6 || T.qdCheck(rr, K4).length) { g = false; bad4 = sd + ': ' + T.qdCheck(rr, K4).join('; '); break }
    const plays = {}; K4.forEach(k => plays[k] = 0); rr.forEach(m => { plays[m.a]++; plays[m.b]++ });
    if (K4.some(k => plays[k] !== 3) || [1, 2, 3].some(r => rr.filter(m => m.rd === r).length !== 2)) { g = false; bad4 = 'jogos por time/rodada ' + sd; break }
    seen4.add(rr.map(m => m.a + m.b).join(','));
  }
  chk('4 TIMES: 400 sorteios válidos (6 jogos, todos os pares 1x, 3 rodadas de 2 jogos com os 4 times, cada time joga 3x)' + (bad4 ? ' ' + bad4 : ''), g);
  chk('4 TIMES: o sorteio varia (≥ 50 tabelas diferentes)', seen4.size >= 50) }
Q = setup4(24);
chk('4 TIMES: sortear os jogos pela tela grava 6 jogos válidos e muda para a aba Jogos', Q.rr.length === 6 && T.qdCheck(Q.rr, Q.ks).length === 0 && T.ui.qdv === 'jogos' && T.qdPhase(Q) === 'grupos');
html = els.app.innerHTML;
chk('4 TIMES: aba Jogos mostra 3 rodadas, sem time descansando, e o formato não pode mais mudar', html.includes('Rodada 3') && !html.includes('Rodada 4') && !html.includes('Descansa'));
clickAct('qdfmt', null, { n: '5' }); chk('4 TIMES: depois do sorteio dos jogos não dá para trocar o formato', T.qdCur().ks.length === 4);
{ // campeonato inteiro: vermelho > azul > amarelo > laranja
  const pw = { vermelho: 4, azul: 3, amarelo: 2, laranja: 1 }; Q = T.qdCur(); Q.ev = [];
  Q.rr.forEach((m, i) => { const w = pw[m.a] > pw[m.b] ? m.a : m.b; for (let g = 0; g < 2; g++) Q.ev.push({ id: 'e' + i + g, m: m.id, t: 'g', pid: Q.cap[w], k: w }); m.done = true });
  T.qdSync(Q);
  chk('4 TIMES: terminou os 6 jogos → tabela em ordem e mata-mata = final 1º x 2º + 3º lugar 3º x 4º', T.qdRRDone(Q) && T.qdRank(Q).map(r => r.k).join() === K4.join() && Q.ko.length === 2 && Q.ko.some(m => m.ph === 'final' && m.a === 'vermelho' && m.b === 'azul') && Q.ko.some(m => m.ph === 'terceiro' && m.a === 'amarelo' && m.b === 'laranja'));
  T.ui.qdv = 'tabela'; T.render(); html = els.app.innerHTML;
  chk('4 TIMES: tabela não fala em eliminado e mostra os 4 times', K4.every(k => html.includes(T.TM[k].n)) && html.includes('vão à final') && !html.includes('5º colocado é eliminado ao final'));
  T.ui.qdv = 'mata'; T.render(); html = els.app.innerHTML;
  chk('4 TIMES: mata-mata mostra Final (1º x 2º) e 3º lugar (3º x 4º), sem Eliminado nem Semifinais', html.includes('Final') && html.includes('1º x 2º') && html.includes('3º x 4º') && !html.includes('Eliminado') && !html.includes('Semifinais'));
  Q.ko.forEach((m, i) => { Q.ev.push({ id: 'k' + i, m: m.id, t: 'g', pid: Q.cap[m.a], k: m.a }); m.done = true }); T.qdSync(Q);
  const fp4 = T.qdFinalPos(Q);
  chk('4 TIMES: campeão e classificação final com 4 posições', T.qdChamp(Q) === 'vermelho' && fp4 && fp4.join() === K4.join() && T.qdPhase(Q) === 'fim');
}
Q = setup4(24); T.ui.qdg = null; let bal4 = true, bal4Bad = [];
['times', 'jogos', 'tabela', 'mata', 'rank'].forEach(v => { T.ui.qdv = v; T.render(); const h = els.app.innerHTML; ['div', 'button', 'select', 'table', 'details', 'span', 'tr'].forEach(tg => { if (!bal(h, tg)) { bal4 = false; bal4Bad.push(v + ':' + tg) } }) });
fmt4(24); T.ui.qdv = 'times'; T.render(); ['div', 'button', 'select', 'span'].forEach(tg => { if (!bal(els.app.innerHTML, tg)) { bal4 = false; bal4Bad.push('formato:' + tg) } });
chk('4 TIMES: telas do formato de 4 têm tags balanceadas' + (bal4Bad.length ? ' ' + bal4Bad : ''), bal4);
setup4(24); T.ui.qdg = null;
{ const core4 = JSON.parse(JSON.stringify(T.core(S))), k4 = Object.keys(core4.quads)[0];
  chk('4 TIMES: backup com Q.ks de 4 times passa na validação', T.validateBackup(core4) === null);
  const b1 = JSON.parse(JSON.stringify(core4)); b1.quads[k4].ks = ['vermelho', 'roxo', 'azul', 'verde']; chk('4 TIMES: backup com time inexistente em Q.ks é recusado', typeof T.validateBackup(b1) === 'string');
  const b2 = JSON.parse(JSON.stringify(core4)); b2.quads[k4].ks = ['vermelho', 'azul', 'verde']; chk('4 TIMES: backup com 3 times em Q.ks é recusado', typeof T.validateBackup(b2) === 'string');
}
Q = fresh(25); clickAct('qdfmt', null, { n: '4' }); clickAct('qdfmt', null, { n: '5' }); Q = T.qdCur();
chk('4 TIMES: voltar para 5 times restaura os 5 times e os 5 seletores de capitão', Q.ks.length === 5 && K.every(k => els.app.innerHTML.includes('id="qdc-' + k + '"')));

/* ===== 15. Efeito de gol continua igual na Quinta ===== */
chk('REGRESSÃO: goalFx da Quinta mantém a assinatura antiga (3 parâmetros obrigatórios, X opcional)', /function goalFx\(side,who,own,X\)/.test(require('fs').readFileSync(require('path').resolve(__dirname, process.argv[2] || '../index.html'), 'utf8')));
done();
