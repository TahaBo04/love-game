/* ===== Mini Love Game (no images needed) ===== */
const q = (s) => document.querySelector(s);
const canvas = q('#game');
const ctx = canvas.getContext('2d');
const scoreEl = q('#score');
const timeEl  = q('#time');
const modal   = q('#modal');
const finalScoreEl = q('#finalScore');
const secretLink = q('#secretLink');
const replayBtn  = q('#replay');
const youEl = q('#you'); const herEl = q('#her'); const her2El = q('#her2');

const params = new URLSearchParams(location.search);
/* Personalize via URL:
   ?her=Soumaya&you=Taha&link=https://your-secret
*/
const YOU = params.get('you') || 'Taha';
const HER = params.get('her') || 'Soumaya';
const LINK = params.get('link') || 'https://example.com/your-secret';
youEl.textContent = YOU; herEl.textContent = HER; her2El.textContent = HER; secretLink.href = LINK;

const W = canvas.width, H = canvas.height;
let player, hearts, t, score, over, keys = {}, spawnTimer, music;

function reset(){
  player = {x:W/2, y:H/2, r:14, speed:4};
  hearts = [];
  score = 0; over = false;
  t = 30; spawnTimer = 0;
  scoreEl.textContent = score; timeEl.textContent = t;
  modal.classList.add('hidden');
  loop(0);
}

function heart(){
  return {
    x: Math.random()*(W-60)+30,
    y: Math.random()*(H-60)+30,
    r: 12 + Math.random()*8,
    wob: Math.random()*6.28
  }
}

function drawHeart(x,y,r){
  // parametric heart (smooth and cute)
  ctx.save();
  ctx.translate(x,y); ctx.scale(r/20, r/20);
  ctx.beginPath();
  for(let a=0; a<=Math.PI; a+=0.02){
    const px = 16*Math.pow(Math.sin(a),3);
    const py = -(13*Math.cos(a)-5*Math.cos(2*a)-2*Math.cos(3*a)-Math.cos(4*a));
    if(a===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
  }
  const grd = ctx.createLinearGradient(-20,-20,20,20);
  grd.addColorStop(0,'#58f7bf'); grd.addColorStop(1,'#2bdc94');
  ctx.fillStyle = grd; ctx.shadowColor = '#38f0a3'; ctx.shadowBlur = 18;
  ctx.fill(); ctx.restore();
}

function circle(x,y,r,color){
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=10; ctx.fill();
}

function dist(a,b,x,y){ const dx=a-x, dy=b-y; return Math.hypot(dx,dy); }

let last = 0;
function loop(ts){
  if(over) return;
  const dt = Math.min(33, ts-last)/1000; last = ts;

  // timer
  spawnTimer += dt;
  if(spawnTimer > 0.6){ hearts.push(heart()); spawnTimer = 0; }
  t -= dt; if(t<=0){ t=0; end(); }
  timeEl.textContent = t.toFixed(0);

  // move
  const sp = player.speed * (keys['Shift']?1.5:1);
  const vx = (keys['ArrowRight']||keys['d']?1:0) - (keys['ArrowLeft']||keys['a']?1:0);
  const vy = (keys['ArrowDown'] ||keys['s']?1:0) - (keys['ArrowUp']  ||keys['w']?1:0);
  player.x = Math.min(W-player.r, Math.max(player.r, player.x + vx*sp*60*dt));
  player.y = Math.min(H-player.r, Math.max(player.r, player.y + vy*sp*60*dt));

  // collect
  for(let i=hearts.length-1;i>=0;i--){
    const h = hearts[i];
    h.wob += dt*4;
    if(dist(player.x,player.y,h.x,h.y) < player.r + h.r){
      hearts.splice(i,1);
      score++; scoreEl.textContent = score;
      pop(player.x, player.y);
    }
  }

  // draw
  ctx.clearRect(0,0,W,H);
  // sparkle background
  for(let i=0;i<22;i++){
    ctx.globalAlpha = 0.06;
    circle(Math.sin(ts*0.0006+i)*W*0.45 + W/2, (i*27 + ts*0.04)%H, 2.5, '#38f0a3');
  }
  ctx.globalAlpha = 1;
  // hearts
  hearts.forEach(h=> drawHeart(h.x, h.y + Math.sin(h.wob)*3, h.r));
  // player (glowing orb)
  circle(player.x, player.y, player.r, '#e8f8f0');
  ctx.strokeStyle = '#38f0a3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x,player.y,player.r+4,0,Math.PI*2); ctx.stroke();

  requestAnimationFrame(loop);
}

function end(){
  over = true;
  finalScoreEl.textContent = score;
  modal.classList.remove('hidden');
}

function pop(x,y){
  // tiny particle burst
  for(let i=0;i<10;i++){
    setTimeout(()=>{ circle(x+Math.cos(i)*10, y+Math.sin(i)*10, 2, '#38f0a3'); }, i*8);
  }
}

/* controls */
addEventListener('keydown',e=>{ keys[e.key]=true; if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault(); });
addEventListener('keyup',e=>{ keys[e.key]=false; });

/* touch */
q('#touch').addEventListener('touchstart', e=>{
  const b = e.target.closest('button'); if(!b) return;
  const dx = Number(b.dataset.dx), dy = Number(b.dataset.dy);
  const id = setInterval(()=>{ player.x += dx*player.speed*3; player.y += dy*player.speed*3; }, 16);
  b.dataset.pid = id;
}, {passive:true});
q('#touch').addEventListener('touchend', e=>{
  const b = e.target.closest('button'); if(!b) return; clearInterval(Number(b.dataset.pid));
});

/* replay */
replayBtn.addEventListener('click', reset);

/* start */
reset();
