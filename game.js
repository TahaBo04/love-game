/* ===== Mini Love Game — fresh build (v5) =====
   - Starts directly in PLAY
   - Modal show/hide is forced (no CSS race)
   - Surprise link is chosen ONLY by score (your custom songs)
*/
const $ = (s) => document.querySelector(s);

// DOM
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const scoreEl = $('#score');
const timeEl  = $('#time');
const modal   = $('#modal');
const finalScoreEl = $('#finalScore');
const secretLink = $('#secretLink');
const replayBtn  = $('#replay');
const youEl = $('#you');
const herEl = $('#her');
const her2El = $('#her2');

// Canvas size (fixed to match HTML width/height attrs)
const W = canvas.width;
const H = canvas.height;

// Personalization via URL params (names only)
const params = new URLSearchParams(location.search);
const YOU  = params.get('you')  || 'Taha';
const HER  = params.get('her')  || 'Soumaya';
youEl.textContent = YOU;
herEl.textContent = HER;
her2El.textContent = HER;

// Game state
const GAME_DURATION = 30; // seconds
let player, hearts, score, t, keys, spawnTimer;
let over = false;
let frameId = null;
let lastTs = 0;

// ---------------- Utils ----------------
function rnd(a,b){ return a + Math.random()*(b-a); }
function dist(ax,ay,bx,by){ return Math.hypot(ax-bx, ay-by); }

function forceShowModal(){
  modal.classList.remove('hidden');
  modal.style.display = 'flex';    // force visible regardless of CSS
}
function forceHideModal(){
  modal.classList.add('hidden');
  modal.style.display = 'none';    // force hidden regardless of CSS
}

// Your custom score → video mapping
function pickVideoByScore(s) {
  if (s <= 5)
    return "https://www.youtube.com/watch?v=NwFVSclD_uc";  // The Walters – I Love You So
  if (s <= 10)
    return "https://www.youtube.com/watch?v=8xg3vE8Ie_E";  // Taylor Swift – Love Story
  if (s <= 15)
    return "https://www.youtube.com/watch?v=xUT3ZcbVWmQ";  // James Arthur – Car’s Outside (Lyric)
  if (s <= 20)
    return "https://www.youtube.com/watch?v=Kpc31pvHjMM";  // Angham – Yaretak Fahemni
  if (s <= 25)
    return "https://www.youtube.com/watch?v=sElE_BfQ67s";  // Cigarettes After Sex – Apocalypse
  return "https://www.youtube.com/watch?v=vx4kLgnFexo";    // Mitski – My Love Mine All Mine
}

// ---------------- Drawing ----------------
function drawHeart(x,y,r){
  ctx.save();
  ctx.translate(x,y);
  ctx.scale(r/20, r/20);
  ctx.beginPath();
  for(let a=0; a<=Math.PI; a+=0.02){
    const px = 16*Math.pow(Math.sin(a),3);
    const py = -(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));
    if(a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  const g = ctx.createLinearGradient(-20,-20,20,20);
  g.addColorStop(0,'#58f7bf'); g.addColorStop(1,'#2bdc94');
  ctx.fillStyle = g; ctx.shadowColor = '#38f0a3'; ctx.shadowBlur = 18;
  ctx.fill();
  ctx.restore();
}

function dot(x,y,r,color){
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fill();
}

function makeHeart(){
  return { x:rnd(30, W-30), y:rnd(30, H-30), r:rnd(12,20), wob:rnd(0,6.28) };
}

// ---------------- Control ----------------
function startLoop(){
  if(frameId !== null) cancelAnimationFrame(frameId);
  lastTs = performance.now();
  frameId = requestAnimationFrame(loop);
}

function stopLoop(){
  if(frameId !== null){ cancelAnimationFrame(frameId); frameId = null; }
}

function reset(){
  // hide results, (re)start state
  forceHideModal();

  player = { x: W/2, y: H/2, r: 14, speed: 4 };
  hearts = [];
  score = 0;
  t = GAME_DURATION;
  keys = {};
  spawnTimer = 0;
  over = false;

  scoreEl.textContent = score.toString();
  timeEl.textContent = t.toFixed(0);

  startLoop();
}

function end(){
  over = true;
  stopLoop();

  finalScoreEl.textContent = score.toString();

  // Set final surprise link strictly from score
  const url = pickVideoByScore(score);
  // Make absolutely sure the anchor points to the new URL
  secretLink.removeAttribute('data-old'); // nuke any custom attrs if present
  secretLink.href = url;
  secretLink.rel = 'noopener noreferrer';
  // (target is set in HTML; no need to change here)

  forceShowModal();
}

// ---------------- Loop ----------------
function loop(ts){
  if(over) return;

  const dt = Math.min(0.033, (ts - lastTs) / 1000);
  lastTs = ts;

  // spawn hearts
  spawnTimer += dt;
  if(spawnTimer > 0.6){ hearts.push(makeHeart()); spawnTimer = 0; }

  // timer
  t -= dt;
  if(t <= 0){
    timeEl.textContent = '0';
    end();
    return;
  }
  timeEl.textContent = Math.ceil(t).toString();

  // movement
  const accel = player.speed * (keys['Shift']?1.5:1);
  const vx = (keys['ArrowRight']||keys['d']?1:0) - (keys['ArrowLeft']||keys['a']?1:0);
  const vy = (keys['ArrowDown'] ||keys['s']?1:0) - (keys['ArrowUp']  ||keys['w']?1:0);
  player.x = Math.min(W-player.r, Math.max(player.r, player.x + vx*accel*60*dt));
  player.y = Math.min(H-player.r, Math.max(player.r, player.y + vy*accel*60*dt));

  // collect hearts
  for(let i=hearts.length-1;i>=0;i--){
    const h = hearts[i]; h.wob += dt*4;
    if(dist(player.x,player.y,h.x,h.y) < player.r + h.r){
      hearts.splice(i,1);
      score++;
      scoreEl.textContent = score.toString();
      burst(player.x, player.y);
    }
  }

  // draw frame
  ctx.clearRect(0,0,W,H);

  // subtle twinkles
  for(let i=0;i<22;i++){
    ctx.globalAlpha = 0.06;
    dot(Math.sin(ts*0.0006+i)*W*0.45 + W/2, (i*27 + ts*0.04)%H, 2.5, '#38f0a3');
  }
  ctx.globalAlpha = 1;

  // hearts
  hearts.forEach(h => drawHeart(h.x, h.y + Math.sin(h.wob)*3, h.r));

  // player
  dot(player.x, player.y, player.r, '#e8f8f0');
  ctx.strokeStyle = '#38f0a3'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(player.x, player.y, player.r+4, 0, Math.PI*2); ctx.stroke();

  frameId = requestAnimationFrame(loop);
}

function burst(x,y){
  for(let i=0;i<10;i++){
    setTimeout(()=>{ dot(x+Math.cos(i)*10, y+Math.sin(i)*10, 2, '#38f0a3'); }, i*8);
  }
}

// ---------------- Controls ----------------
addEventListener('keydown', e=>{
  keys[e.key] = true;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
addEventListener('keyup', e=>{ keys[e.key] = false; });

// Mobile touch arrows (if present)
const touch = document.getElementById('touch');
if (touch) {
  touch.addEventListener('touchstart', e=>{
    const b = e.target.closest('button'); if(!b) return;
    const dx = Number(b.dataset.dx), dy = Number(b.dataset.dy);
    const id = setInterval(()=>{
      player.x = Math.min(W-player.r, Math.max(player.r, player.x + dx*player.speed*3));
      player.y = Math.min(H-player.r, Math.max(player.r, player.y + dy*player.speed*3));
    }, 16);
    b.dataset.pid = id;
  }, {passive:true});

  touch.addEventListener('touchend', e=>{
    const b = e.target.closest('button'); if(!b) return;
    clearInterval(Number(b.dataset.pid));
  });
}

// Replay
replayBtn.addEventListener('click', reset);

// Boot
document.addEventListener('DOMContentLoaded', ()=>{
  // force-hide modal at boot (in case CSS showed it)
  forceHideModal();
  reset();
  // Console version so you can verify you’re on the new JS:
  console.log("Love game loaded · build v5 · " + new Date().toISOString());
});
