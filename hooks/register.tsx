import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, ThemeSetArgs } from 'claude-code'

const isOn = atom({ plugin: 'tema-natalizio', key: 'isOn' } as const, true)
// il seme della scena di questa chat: scelto all'apertura, resta lo stesso fino a "/natale nuova"
const seme = atom({ plugin: 'tema-natalizio', key: 'seme' } as const, 0)

const GIORNO = 24 * 60 * 60 * 1000

function countdown(now: number): string {
  const today = new Date(now)
  const year = today.getFullYear()
  const start = new Date(year, today.getMonth(), today.getDate()).getTime()
  let natale = new Date(year, 11, 25).getTime()
  if (start > natale) natale = new Date(year + 1, 11, 25).getTime()
  const days = Math.round((natale - start) / GIORNO)

  if (days === 0) return 'Oggi è Natale! Buon Natale! 🎄🎁'
  if (days === 1) return 'Domani è Natale! 🎅'
  return `Mancano ${days} giorni a Natale`
}

// --- Sfondo animato: una notte di Natale diversa per ogni chat -------------
// Regole imparate provando nell'app:
//  - niente "infinite": l'app lo scarta; 10 milioni di ripetizioni funzionano;
//  - la scena deve restare sotto i 64 KB una volta spedita (JSON): oltre, l'app
//    la ferma dopo un paio di secondi. Per questo niente decimali e stili in classi.

function rng(seed) {
  // mescola il seme, così anche semi vicini danno notti molto diverse
  let h = Math.abs(Math.floor(seed)) % 2147483647
  for (let i = 0; i < 3; i++) h = (Math.imul(h ^ (h >>> 15), 2246822519) ^ Math.imul(h ^ (h >>> 13), 3266489917)) >>> 0
  let s = (h % 2147483646) + 1
  const next = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  for (let i = 0; i < 8; i++) next()
  return next
}

const W = 1600
const H = 900
const N = 10000000
const R = Math.round

const CIELI = [
  { cielo: ['#050f24', '#12305a', '#2b5a8a'], au: null, colle: '#c4d8ee', monti: '#2a4a78', monti2: '#1d3a60', neveMonti: '#d3e2f2' },
  { cielo: ['#03101c', '#0b2a3d', '#1d5260'], au: ['#5cffc0', '#2fd0ff'], colle: '#c9e3e8', monti: '#1f4656', monti2: '#16384a', neveMonti: '#d6eef0' },
  { cielo: ['#0d0824', '#2a1650', '#5a3a7a'], au: ['#c08cff', '#ff8cc8'], colle: '#d8cfee', monti: '#3a2a62', monti2: '#2b1f4c', neveMonti: '#e6ddf5' },
  { cielo: ['#0a1430', '#33356a', '#b0708a'], au: null, colle: '#e6dcef', monti: '#4a4478', monti2: '#363262', neveMonti: '#efe6f5' },
  { cielo: ['#02060f', '#0a1a33', '#163a5c'], au: ['#7affd4', '#5cffc0'], colle: '#bfd6ea', monti: '#1b3352', monti2: '#122640', neveMonti: '#cfe0f0' },
]

const LUCI = [
  ['#ff4d4d', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585'],
  ['#ffd166', '#fff3c4', '#ffb703', '#ffe8a3'],
  ['#ff4d4d', '#ffffff', '#2ecc71'],
  ['#4cc9f0', '#a0e7ff', '#ffffff', '#b8c0ff'],
]

function stile(volo) {
  return `
.fl{animation:fall linear ${N}}
@keyframes fall{from{transform:translate(0,-30px)}to{transform:translate(var(--dx),${H + 30}px)}}
.s1{--dx:-40px;animation-duration:8s}.s2{--dx:30px;animation-duration:11s}.s3{--dx:-15px;animation-duration:14s}
.s4{--dx:55px;animation-duration:18s}.s5{--dx:-55px;animation-duration:23s}.s6{--dx:12px;animation-duration:28s}
.tw{animation:tw ease-in-out ${N} alternate}
@keyframes tw{from{opacity:.15}to{opacity:1}}
.t1{animation-duration:1.6s}.t2{animation-duration:2.4s}.t3{animation-duration:3.3s}.t4{animation-duration:4.2s}
.lt{animation:bl ease-in-out ${N} alternate}
@keyframes bl{from{opacity:1}to{opacity:.2}}
.l1{animation-duration:.8s}.l2{animation-duration:1.15s}.l3{animation-duration:1.5s}
.sl{animation:fly 34s linear ${N}}
@keyframes fly{${volo}}
.bob{animation:bob .9s ease-in-out ${N} alternate}
.bob2{animation:bob .9s ease-in-out -.45s ${N} alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-7px)}}
.du{animation:du 1.6s ease-out ${N}}
@keyframes du{0%{transform:translate(0,0);opacity:1}100%{transform:translate(-100px,40px);opacity:0}}
.sm{transform-box:fill-box;transform-origin:center;animation:smoke 6s ease-out ${N}}
@keyframes smoke{0%{transform:translate(0,0) scale(.5);opacity:.75}100%{transform:translate(40px,-150px) scale(2.2);opacity:0}}
.win{animation:glow 2.6s ease-in-out ${N} alternate}
@keyframes glow{from{opacity:.7}to{opacity:1}}
.sh{animation:shoot 12s ease-in ${N}}
@keyframes shoot{0%,80%{transform:translate(0,0);opacity:0}81%{opacity:1}92%{transform:translate(-520px,260px);opacity:0}100%{opacity:0}}
.sway{transform-box:fill-box;transform-origin:50% 100%;animation:sway 5s ease-in-out ${N} alternate}
@keyframes sway{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}
.moon{animation:halo 6s ease-in-out ${N} alternate}
@keyframes halo{from{opacity:.55}to{opacity:.9}}
.pu{animation:halo 2.2s ease-in-out ${N} alternate}
.gl{transform-origin:0 ${H}px}.gr{transform-origin:${W}px ${H}px}
@media (max-aspect-ratio:16/10){.gl{transform:translateX(70px)}.gr{transform:translateX(-70px)}}
@media (max-aspect-ratio:3/2){.gl{transform:translateX(130px) scale(.92)}.gr{transform:translateX(-130px) scale(.92)}}
@media (max-aspect-ratio:4/3){.gl{transform:translateX(200px) scale(.85)}.gr{transform:translateX(-200px) scale(.85)}}
@media (max-aspect-ratio:6/5){.gl{transform:translateX(250px) scale(.8)}.gr{transform:translateX(-250px) scale(.8)}}
@media (max-aspect-ratio:1/1){.gl{transform:translateX(330px) scale(.7)}.gr{transform:translateX(-330px) scale(.7)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`
}

function stella5(cx, cy, a, b) {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const t = -Math.PI / 2 + (i * Math.PI) / 5
    const q = i % 2 ? b : a
    d += `${i ? 'L' : 'M'}${R(cx + Math.cos(t) * q)} ${R(cy + Math.sin(t) * q)}`
  }
  return d + 'Z'
}

function pino(x, base, h, col, sway, ritardo) {
  const hw = R(h * 0.3)
  let s = sway ? `<g class="sway" style="animation-delay:-${ritardo}s">` : ''
  s += `<rect x="${R(x - h * 0.04)}" y="${R(base - h * 0.16)}" width="${R(h * 0.08) || 1}" height="${R(h * 0.16)}" fill="#3b2416"/>`
  for (let i = 0; i < 3; i++) {
    const top = R(base - h + i * h * 0.24)
    const bot = R(top + h * 0.42)
    const w = R(hw * (0.6 + i * 0.25))
    s += `<path d="M${x} ${top}L${x - w} ${bot}H${x + w}Z" fill="${col}"/><path d="M${x} ${top}L${x - w} ${bot}l${R(w * 0.35)} -6L${x} ${top + 9}Z" fill="#eaf3ff" opacity=".8"/>`
  }
  return s + (sway ? '</g>' : '')
}

function monti(r, base, hmin, hmax, step, fill, neve) {
  const pts = [[-50, base]]
  const picchi = []
  let x = -50
  while (x < W + 50) {
    const vx = R(x + step * 0.5 * (0.6 + r() * 0.8))
    const vy = R(base - hmin * 0.35 * r())
    const px = R(vx + step * 0.5 * (0.6 + r() * 0.8))
    const py = R(base - hmin - (hmax - hmin) * r())
    pts.push([vx, vy], [px, py])
    picchi.push(pts.length - 1)
    x = px
  }
  pts.push([W + 50, base])
  let s = `<path d="M${pts.map(p => `${p[0]} ${p[1]}`).join('L')}L${W + 50} ${H}H-50Z" fill="${fill}"/>`
  if (!neve) return s
  for (const i of picchi) {
    const [P, A, B] = [pts[i], pts[i - 1], pts[i + 1]]
    const a = [R(P[0] + (A[0] - P[0]) * 0.3), R(P[1] + (A[1] - P[1]) * 0.3)]
    const b = [R(P[0] + (B[0] - P[0]) * 0.3), R(P[1] + (B[1] - P[1]) * 0.3)]
    const y = Math.max(a[1], b[1])
    s += `<path d="M${P[0]} ${P[1]}L${a[0]} ${a[1]}L${R(a[0] + (b[0] - a[0]) / 3)} ${y - 6}L${R(a[0] + ((b[0] - a[0]) * 2) / 3)} ${y + 4}L${b[0]} ${b[1]}Z" fill="${neve}"/>`
  }
  return s
}

function casa(x, b, w, h, muro, tetto, fumo, ritardo) {
  const rh = R(h * 0.7)
  let s = ''
  if (fumo) {
    const cx = R(x + w * 0.68)
    const cy = b - h - R(rh * 0.75)
    s += `<rect x="${cx}" y="${cy}" width="13" height="${R(rh * 0.6)}" fill="#3b2219"/>`
    for (let i = 0; i < 3; i++) s += `<circle class="sm" cx="${cx + 6}" cy="${cy - 10}" r="9" fill="#d8e3f0" style="animation-delay:-${ritardo + i * 2}s"/>`
  }
  s += `<rect x="${x}" y="${b - h}" width="${w}" height="${h}" fill="${muro}"/>`
  s += `<path d="M${x - 10} ${b - h}L${x + R(w / 2)} ${b - h - rh}L${x + w + 10} ${b - h}Z" fill="${tetto}"/>`
  s += `<path d="M${x - 14} ${b - h + 3}L${x + R(w / 2)} ${b - h - rh - 4}L${x + w + 14} ${b - h + 3}Q${x + R(w * 0.75)} ${b - h - 4} ${x + R(w / 2)} ${b - h - rh + 12}Q${x + R(w * 0.25)} ${b - h - 4} ${x - 14} ${b - h + 3}Z" fill="#f3f8ff"/>`
  const fin = w > 75 ? [0.27, 0.73] : [0.3]
  for (const k of fin) {
    const cx = R(x + w * k)
    const cy = R(b - h * 0.6)
    s += `<circle class="win" cx="${cx}" cy="${cy}" r="15" fill="url(#w)"/><rect class="win" x="${cx - 8}" y="${cy - 8}" width="16" height="16" fill="#ffcf73"/><path d="M${cx} ${cy - 8}v16M${cx - 8} ${cy}h16" stroke="${muro}" stroke-width="2"/>`
  }
  const dx = w > 75 ? x + R(w / 2) - 8 : x + R(w * 0.66)
  s += `<rect x="${dx}" y="${b - 24}" width="16" height="24" fill="#2b1810"/><circle cx="${dx + 8}" cy="${b - 16}" r="5" fill="none" stroke="#2e8b57" stroke-width="2.5"/>`
  return s + `<ellipse cx="${x + R(w / 2)}" cy="${b + 3}" rx="${R(w * 0.85)}" ry="9" fill="#e6eff9"/>`
}

function chiesa(x, b) {
  let s = `<rect x="${x}" y="${b - 90}" width="74" height="90" fill="#8a6f5a"/>`
  s += `<path d="M${x - 8} ${b - 90}L${x + 37} ${b - 130}L${x + 82} ${b - 90}Z" fill="#4a3426"/>`
  s += `<path d="M${x - 11} ${b - 88}L${x + 37} ${b - 134}L${x + 85} ${b - 88}Q${x + 60} ${b - 98} ${x + 37} ${b - 120}Q${x + 14} ${b - 98} ${x - 11} ${b - 88}Z" fill="#f3f8ff"/>`
  s += `<rect x="${x + 22}" y="${b - 185}" width="30" height="80" fill="#9a7d66"/>`
  s += `<path d="M${x + 16} ${b - 185}L${x + 37} ${b - 250}L${x + 58} ${b - 185}Z" fill="#4a3426"/><path d="M${x + 14} ${b - 183}L${x + 37} ${b - 252}L${x + 26} ${b - 200}Z" fill="#f3f8ff"/>`
  s += `<path d="${stella5(x + 37, b - 262, 8, 3)}" fill="#ffd84d"/>`
  s += `<circle class="win" cx="${x + 37}" cy="${b - 158}" r="20" fill="url(#w)"/><circle class="win" cx="${x + 37}" cy="${b - 158}" r="8" fill="#ffcf73"/>`
  s += `<path d="M${x + 27} ${b}V${b - 30}Q${x + 37} ${b - 42} ${x + 47} ${b - 30}V${b}Z" fill="#2b1810"/>`
  for (const k of [13, 61]) s += `<path class="win" d="M${x + k - 6} ${b - 40}V${b - 58}Q${x + k} ${b - 66} ${x + k + 6} ${b - 58}V${b - 40}Z" fill="#ffcf73"/>`
  return s + `<ellipse cx="${x + 37}" cy="${b + 3}" rx="70" ry="9" fill="#e6eff9"/>`
}

function renna(x, cls, guida) {
  const c = '#a8714a'
  const d = '#734a2e'
  let s = `<g class="${cls}"><g transform="translate(${x} -30)">`
  s += `<path d="M-20 4L-32 16L-44 16M-26 4L-30 20L-40 26M20 4L34 14L44 10M14 6L22 20L32 24" stroke="${d}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
  s += `<ellipse cy="-4" rx="32" ry="14" fill="${c}"/><ellipse cx="2" cy="3" rx="22" ry="6" fill="#d9b48a"/><ellipse cx="-32" cy="-12" rx="6" ry="4" fill="#f3e6d3"/>`
  s += `<path d="M20 -8Q30 -18 36 -34" stroke="${c}" stroke-width="13" fill="none" stroke-linecap="round"/>`
  s += `<ellipse cx="44" cy="-38" rx="12" ry="8" fill="${c}" transform="rotate(15 44 -38)"/><circle cx="45" cy="-41" r="2" fill="#1a0f08"/>`
  s += `<path d="M38 -46C34 -58 30 -64 22 -70M33 -60L26 -58M42 -47C44 -60 48 -66 56 -72M46 -60L54 -62" stroke="#ecd9b8" stroke-width="3" fill="none" stroke-linecap="round"/>`
  s += `<path d="M22 -16Q29 -5 38 -20" stroke="#c0392b" stroke-width="4" fill="none"/><circle cx="30" cy="-10" r="3" fill="#f4c542"/>`
  s += guida ? `<circle class="tw t1" cx="56" cy="-35" r="11" fill="#ff5a5a" opacity=".5"/><circle cx="56" cy="-35" r="4" fill="#ff3b3b"/>` : `<circle cx="56" cy="-35" r="3" fill="#2a1a10"/>`
  return s + '</g></g>'
}

function slitta(destra) {
  let s = '<g class="sl">' + (destra ? '' : '<g transform="scale(-1 1)">')
  for (let i = 0; i < 8; i++) s += `<circle class="du" cx="${-6 - (i % 4) * 8}" cy="${-8 - ((i * 13) % 40)}" r="${2 + (i % 2)}" fill="${i % 3 ? '#ffe9a8' : '#fff'}" style="animation-delay:-${(i * 0.2).toFixed(1)}s"/>`
  s += `<path d="M133 -73Q210 -58 291 -69M133 -73Q270 -66 421 -69" stroke="#f4c542" stroke-width="1.6" fill="none"/>`
  s += renna(260, 'bob2', false) + renna(390, 'bob', true)
  s += '<g class="bob2">'
  s += `<rect x="28" y="-120" width="20" height="20" fill="#2e8b57"/><rect x="36" y="-120" width="4" height="20" fill="#ffd166"/><rect x="50" y="-114" width="16" height="16" fill="#4cc9f0"/>`
  s += `<path d="M18 -62C4 -90 30 -112 50 -104C70 -110 80 -84 66 -62Z" fill="#8a5a3b"/>`
  s += `<ellipse cx="98" cy="-80" rx="22" ry="24" fill="#d62828"/><rect x="77" y="-77" width="42" height="7" fill="#1a1a1a"/>`
  s += `<path d="M110 -90Q124 -86 132 -74" stroke="#d62828" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="133" cy="-73" r="5" fill="#1a1a1a"/>`
  s += `<circle cx="104" cy="-110" r="12" fill="#f6d1b1"/><path d="M92 -110C92 -92 104 -84 112 -92C118 -98 117 -106 116 -110C110 -104 98 -104 92 -110Z" fill="#fff"/>`
  s += `<path d="M92 -118C96 -136 114 -136 117 -120Z" fill="#d62828"/><path d="M97 -130C86 -137 78 -131 74 -122" stroke="#d62828" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="73" cy="-120" r="5" fill="#fff"/><rect x="90" y="-123" width="29" height="7" rx="3" fill="#fff"/>`
  s += `<path d="M14 -62H118C140 -62 150 -40 146 -16L140 -6H24C8 -6 2 -24 6 -44C8 -56 10 -62 14 -62Z" fill="#c62f26"/><path d="M14 -62H118" stroke="#f4c542" stroke-width="5" stroke-linecap="round"/>`
  s += `<path d="M44 -34c10 -14 30 -14 34 0c4 12 -14 16 -16 6M140 -10C160 -22 168 -54 156 -66C148 -74 136 -66 144 -58M-4 8H150C176 8 184 -8 174 -22M34 -6V8M118 -6V8" stroke="#f4c542" stroke-width="4" fill="none" stroke-linecap="round"/>`
  return s + '</g>' + (destra ? '' : '</g>') + '</g>'
}

function albero(x0, by, th, colori, r) {
  let s = `<circle class="pu" cx="${x0}" cy="${by - th - 10}" r="55" fill="url(#g)"/>`
  s += `<rect x="${x0 - 14}" y="${by - 40}" width="28" height="44" fill="#4a2b1a"/>`
  const lati = []
  for (let i = 0; i < 5; i++) {
    const ty = R(by - th + i * th * 0.16)
    const bh = R(ty + th * 0.3)
    const hw = 40 + i * 34
    lati.push([ty, bh, hw])
    s += `<path d="M${x0} ${ty}L${x0 - hw} ${bh}Q${x0} ${bh + 16} ${x0 + hw} ${bh}Z" fill="${i % 2 ? '#1a5e3c' : '#174f33'}"/>`
    s += `<path d="M${x0 - hw} ${bh}Q${x0} ${bh + 16} ${x0 + hw} ${bh}Q${x0} ${bh + 4} ${x0 - hw + 6} ${bh - 8}Z" fill="#eef5fd"/>`
  }
  const palle = ['#d62828', '#f4c542', '#3a86ff', '#c77dff']
  for (let n = 0; n < 10; n++) {
    const [ty, bh, hw] = lati[n % 5]
    const a = 0.45 + r() * 0.45
    s += `<circle cx="${R(x0 + (r() * 2 - 1) * hw * a * 0.75)}" cy="${R(ty + (bh - ty) * a)}" r="${6 + (n % 3)}" fill="${palle[n % 4]}"/>`
  }
  let k = 0
  lati.forEach(([ty, bh, hw], i) => {
    const L = [x0 - hw * 0.85, ty + (bh - ty) * 0.85]
    const Rr = [x0 + hw * 0.85, ty + (bh - ty) * 0.6]
    const C = [x0, Math.max(L[1], Rr[1]) + 18]
    const n = 3 + i
    for (let j = 1; j < n; j++) {
      const t = j / n
      const u = 1 - t
      const px = R(u * u * L[0] + 2 * u * t * C[0] + t * t * Rr[0])
      const py = R(u * u * L[1] + 2 * u * t * C[1] + t * t * Rr[1])
      s += `<circle class="lt l${(k % 3) + 1}" cx="${px}" cy="${py}" r="4" fill="${colori[k % colori.length]}"/>`
      k++
    }
  })
  s += `<path class="pu" d="${stella5(x0, by - th - 10, 22, 9)}" fill="#ffd84d" stroke="#fff2a8" stroke-width="2"/>`
  s += `<rect x="${x0 - 110}" y="${by - 30}" width="40" height="32" fill="#c0392b"/><rect x="${x0 - 94}" y="${by - 30}" width="8" height="32" fill="#f4c542"/>`
  s += `<rect x="${x0 + 60}" y="${by - 26}" width="36" height="28" fill="#2a9d8f"/><rect x="${x0 + 74}" y="${by - 26}" width="7" height="28" fill="#f4f1de"/>`
  return s + `<ellipse cx="${x0}" cy="${by + 4}" rx="190" ry="11" fill="#e6eff9"/>`
}

function pupazzo(x, b) {
  let s = `<ellipse cx="${x}" cy="${b + 2}" rx="44" ry="8" fill="#c9d9ec"/><circle cx="${x}" cy="${b - 30}" r="34" fill="#f7fbff"/><circle cx="${x}" cy="${b - 82}" r="24" fill="#f7fbff"/><circle cx="${x}" cy="${b - 120}" r="18" fill="#f7fbff"/>`
  s += `<path d="M${x - 20} ${b - 104}Q${x} ${b - 96} ${x + 20} ${b - 104}L${x + 18} ${b - 98}Q${x} ${b - 90} ${x - 18} ${b - 98}ZM${x + 10} ${b - 100}l8 26l8 -2l-6 -24Z" fill="#c0392b"/>`
  s += `<path d="M${x - 2} ${b - 120}l20 5l-20 2Z" fill="#f08a24"/>`
  s += `<path d="M${x - 6} ${b - 126}h.1M${x + 6} ${b - 126}h.1M${x} ${b - 86}h.1M${x} ${b - 72}h.1M${x} ${b - 42}h.1" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>`
  s += `<path d="M${x - 22} ${b - 86}l-30 -22m12 9l-6 -12M${x + 22} ${b - 86}l30 -20m-12 8l6 -12" stroke="#5a3a22" stroke-width="3" fill="none" stroke-linecap="round"/>`
  return s + `<rect x="${x - 20}" y="${b - 140}" width="40" height="5" fill="#1a1a1a"/><rect x="${x - 13}" y="${b - 164}" width="26" height="26" fill="#1a1a1a"/><rect x="${x - 13}" y="${b - 146}" width="26" height="5" fill="#c0392b"/>`
}

function scena(seed) {
  const r = rng(seed)
  const P = CIELI[Math.floor(r() * CIELI.length)]
  const luci = LUCI[Math.floor(r() * LUCI.length)]
  const lunaSx = r() < 0.5
  const piena = r() < 0.6
  const destra = r() < 0.5
  const conMonti = r() < 0.7
  const paeseSx = r() < 0.5
  const conPupazzo = r() < 0.65
  // abbastanza in basso da non essere tagliato in alto (cappello a -136) nemmeno su finestre larghe
  const y1 = R(300 + r() * 40)
  const y2 = R(255 + r() * 45)
  const volo = destra
    ? `0%{transform:translate(-560px,${y1}px)}100%{transform:translate(${W + 120}px,${y2}px)}`
    : `0%{transform:translate(${W + 560}px,${y1}px)}100%{transform:translate(-120px,${y2}px)}`

  let s =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">` +
    `<style>${stile(volo)}</style><defs>` +
    `<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.cielo[0]}"/><stop offset=".55" stop-color="${P.cielo[1]}"/><stop offset="1" stop-color="${P.cielo[2]}"/></linearGradient>` +
    `<radialGradient id="a"><stop offset="0" stop-color="#fff6d6" stop-opacity=".6"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="w"><stop offset="0" stop-color="#ffcf73" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf73" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="g"><stop offset="0" stop-color="#fff2a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffd84d" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="z" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
    (P.au ? `<linearGradient id="u" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.au[0]}" stop-opacity="0"/><stop offset=".5" stop-color="${P.au[0]}" stop-opacity=".4"/><stop offset="1" stop-color="${P.au[1]}" stop-opacity="0"/></linearGradient>` : '') +
    `</defs><rect width="${W}" height="${H}" fill="url(#c)"/>`

  // aurora (ferma, solo in alcune notti)
  if (P.au) {
    s += `<path d="M-100 ${R(200 + r() * 40)}C200 120 400 270 700 180S1200 110 1700 220V360C1300 270 1000 400 700 320S200 270 -100 350Z" fill="url(#u)"/>`
    s += `<path d="M-100 140C250 60 500 200 800 120S1300 60 1700 140V260C1350 190 1050 300 800 240S250 200 -100 270Z" fill="url(#u)" opacity=".6"/>`
  }

  // stelle: molte brillano, alcune ferme, poche scintille a quattro punte
  for (let i = 0; i < 100; i++) {
    const x = R(r() * W)
    const y = R(r() * H * 0.58)
    const rr = r() < 0.75 ? 1 : 2
    s += i % 4 === 3
      ? `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity=".6"/>`
      : `<circle class="tw t${1 + (i % 4)}" cx="${x}" cy="${y}" r="${rr}" fill="#fff" style="animation-delay:-${R(r() * 4)}s"/>`
  }
  for (let i = 0; i < 7; i++) {
    const x = R(r() * W)
    const y = R(r() * H * 0.45)
    s += `<path class="tw t${1 + (i % 4)}" d="M${x} ${y - 9}L${x + 2} ${y - 2}L${x + 9} ${y}L${x + 2} ${y + 2}L${x} ${y + 9}L${x - 2} ${y + 2}L${x - 9} ${y}L${x - 2} ${y - 2}Z" fill="#fff"/>`
  }
  s += `<g class="sh"><line x1="1400" y1="80" x2="1520" y2="40" stroke="url(#z)" stroke-width="3" stroke-linecap="round"/><circle cx="1400" cy="80" r="3" fill="#fff"/></g>`

  // luna: piena o falce, a destra o a sinistra
  // (gl/gr: gruppi laterali che su finestre strette si stringono verso il centro)
  const mx = lunaSx ? 300 : 1300
  s += `<g class="${lunaSx ? 'gl' : 'gr'}"><circle class="moon" cx="${mx}" cy="200" r="150" fill="url(#a)"/>`
  s += piena
    ? `<circle cx="${mx}" cy="200" r="60" fill="#fdf3cf"/><circle cx="${mx - 20}" cy="185" r="9" fill="#efe1b4"/><circle cx="${mx + 18}" cy="222" r="6" fill="#efe1b4"/>`
    : `<path d="M${mx} 140A60 60 0 1 0 ${mx} 260A46 60 0 1 1 ${mx} 140Z" fill="#fdf3cf"/>`
  s += '</g>'

  // neve lontana
  for (let i = 0; i < 45; i++) {
    s += `<circle class="fl s${4 + (i % 3)}" cx="${R(r() * W)}" r="${1 + (i % 2)}" fill="#fff" opacity=".55" style="animation-delay:-${R(r() * 28)}s"/>`
  }

  s += slitta(destra)

  // montagne o colline lontane
  if (conMonti) {
    s += monti(r, H - 300, 90, 200, 280, P.monti, P.neveMonti)
    s += monti(r, H - 250, 40, 110, 220, P.monti2, null)
  }

  // collina con bosco
  s += `<path d="M0 ${H - 240}Q300 ${H - 340} 650 ${H - 260}T1250 ${H - 250}T${W} ${H - 290}V${H}H0Z" fill="${P.colle}"/>`
  const paeseX = paeseSx ? 40 : W - 470
  const alberoX = paeseSx ? 1370 : 230
  const lato = { sx: '', dx: '', centro: '' }
  const metti = (x, pezzo) => {
    if (x < 560) lato.sx += pezzo
    else if (x > 1040) lato.dx += pezzo
    else lato.centro += pezzo
  }
  for (let i = 0; i < 13; i++) {
    const x = R(40 + i * 120 + r() * 50)
    if (Math.abs(x - (paeseX + 210)) < 230) continue
    metti(x, pino(x, R(H - 150 + r() * 30), R(100 + r() * 80), i % 2 ? '#0f3d2e' : '#14503a', i % 3 === 0, R(r() * 5)))
  }

  // paesino
  const paese =
    casa(paeseX, H - 230, 92, 60, '#7a3e2e', '#4a2a20', true, 0) +
    casa(paeseX + 118, H - 246, 66, 50, '#3e5c7a', '#2a3a50', false, 0) +
    chiesa(paeseX + 206, H - 254) +
    casa(paeseX + 312, H - 250, 84, 56, '#6b4a2f', '#3b2a1a', true, 3)
  if (paeseSx) lato.sx += paese
  else lato.dx += paese
  s += `<g class="gl">${lato.sx}</g><g class="gr">${lato.dx}</g>`

  // bosco più fitto al centro, piccolo e lontano
  for (let i = 0; i < 7; i++) {
    const x = R(600 + i * 62 + r() * 30)
    s += pino(x, R(H - 175 + r() * 20), R(60 + r() * 35), i % 2 ? '#123f35' : '#17473b', false, 0)
  }
  s += lato.centro

  // terreno davanti
  s += `<path d="M0 ${H - 130}Q400 ${H - 200} 820 ${H - 140}T${W} ${H - 160}V${H}H0Z" fill="#f3f8ff"/>`

  // albero di Natale e pupazzo, dal lato opposto al paesino
  s += `<g class="${paeseSx ? 'gr' : 'gl'}">${albero(alberoX, H - 122, 330, luci, r)}${conPupazzo ? pupazzo(paeseSx ? 1160 : 450, H - 104) : ''}</g>`

  // ghirlanda in alto
  s += `<path d="M0 16Q200 70 400 16Q600 70 800 16Q1000 70 1200 16Q1400 70 1600 16" stroke="#1d2b1f" stroke-width="2.5" fill="none"/>`
  let k = 0
  for (let sw = 0; sw < 4; sw++) {
    for (let j = 1; j < 10; j++) {
      const t = j / 10
      const u = 1 - t
      const x = R(sw * 400 + 400 * t)
      const y = R(u * u * 16 + 2 * u * t * 70 + t * t * 16) + 12
      const c = luci[k % luci.length]
      s += `<g class="lt l${(k % 3) + 1}"><circle cx="${x}" cy="${y}" r="13" fill="${c}" opacity=".3"/><ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="${c}"/></g>`
      k++
    }
  }

  // neve vicina
  for (let i = 0; i < 85; i++) {
    const big = r() < 0.25
    s += `<circle class="fl s${1 + (i % 4)}" cx="${R(r() * W)}" r="${big ? 3 + (i % 3) : 2}" fill="#fff" opacity="${big ? '.9' : '.75'}" style="animation-delay:-${R(r() * 25)}s"/>`
  }

  return s + '</svg>'
}

// una scena per seme, calcolata una volta sola
const scene = new Map<number, string>()
function scenaDi(n: number): string {
  let s = scene.get(n)
  if (s === undefined) {
    s = scena(n)
    scene.set(n, s)
  }
  return s
}

const SFONDO: ThemeSetArgs = {
  backdrop: { scene: 'notte-natale', glass: { blur: 0, opacity: 0.25 } },
  overrideColorScheme: 'dark',
}

// Una nuova chat dell'app desktop parte "pre-riscaldata": la sessione si avvia
// (session.start) mentre l'app non ci è ancora collegata, e la finestra della
// chat, quando si collega al primo messaggio, non riceve il tema messo prima.
// Per questo il tema si rimette quando l'app si collega (session.attach) e,
// per sicurezza, una volta al primo messaggio della chat.
let rimessoDopoAvvio = false

async function accendi($: EngineInterface) {
  $.ui.status(`🎄 ${countdown(await $.clock.now())}`)
  await $.theme.set(SFONDO)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    rimessoDopoAvvio = false
    await $.command.register({
      name: 'natale',
      description: 'Accende o spegne il tema natalizio; "/natale nuova" cambia la scena di questa chat',
    })
    if ((await read($, seme)) === 0) {
      const t = Math.floor(await $.clock.now()) % 2147483647
      await update($, seme, () => t || 1)
    }
    if (await read($, isOn)) {
      await accendi($)
    }

    return next(e)
  })

  on('session.attach', async ($, e, next) => {
    const r = await next(e)
    if ((e.surface === 'desktop' || e.surface === 'mobile') && (await read($, isOn))) {
      await accendi($)
    }

    return r
  })

  on('prompt.submit', async ($, e, next) => {
    if (!rimessoDopoAvvio) {
      rimessoDopoAvvio = true
      // il tema non deve mai bloccare l'invio del messaggio
      await (async () => {
        if (await read($, isOn)) await accendi($)
      })().catch(() => undefined)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== 'notte-natale') {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)
    const n = (await read($, seme)) || 1

    return <Svg source={scenaDi(n)} alt="Animazione: notte di Natale con neve, slitta, paesino e albero" isInteractive />
  })

  on('command.run', { command: 'natale' }, async ($, e) => {
    rimessoDopoAvvio = true
    if (e.args.trim().toLowerCase() === 'nuova') {
      const t = Math.floor(await $.clock.now()) % 2147483647
      await update($, seme, () => t || 1)
      await update($, isOn, () => true)
      $.ui.status(`🎄 ${countdown(await $.clock.now())}`)
      await $.theme.set(SFONDO)

      return { text: '🎄 Nuova scena natalizia per questa chat!' }
    }
    const acceso = !(await read($, isOn))
    await update($, isOn, () => acceso)
    $.ui.status(acceso ? `🎄 ${countdown(await $.clock.now())}` : undefined)
    if (acceso) await $.theme.set(SFONDO)
    else await $.theme.clear()

    return { text: acceso ? '🎄 Tema natalizio acceso!' : 'Tema natalizio spento.' }
  })

  on('turn.complete', async ($, e, next) => {
    if (await read($, isOn)) {
      $.ui.status(`🎄 ${countdown(await $.clock.now())}`)
    }

    return next(e)
  })
}
