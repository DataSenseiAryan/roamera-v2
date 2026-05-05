import { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ── Night ─────────────────────────────────────────────────────────────────────
const STAR_COLORS = ['#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0'];
const NEBULAE = [
  { cx: 0.15, cy: 0.20, rx: 380, ry: 220, color: 'rgba(100,120,220,0.06)' },
  { cx: 0.80, cy: 0.65, rx: 300, ry: 180, color: 'rgba(80,100,200,0.05)'  },
  { cx: 0.50, cy: 0.50, rx: 450, ry: 280, color: 'rgba(60,80,180,0.04)'   },
  { cx: 0.30, cy: 0.80, rx: 250, ry: 160, color: 'rgba(80,90,190,0.04)'   },
];


// ── Day: passport stamps ──────────────────────────────────────────────────────
const STAMP_DATA = [
  { country: 'FRANCE',    code: 'CDG', city: 'PARIS',       color: '#1e3a8a', shape: 'circle' },
  { country: 'JAPAN',     code: 'NRT', city: 'TOKYO',       color: '#dc2626', shape: 'circle' },
  { country: 'INDIA',     code: 'BOM', city: 'MUMBAI',      color: '#7c3aed', shape: 'circle' },
  { country: 'BRAZIL',    code: 'GRU', city: 'SÃO PAULO',   color: '#065f46', shape: 'rect'   },
  { country: 'EGYPT',     code: 'CAI', city: 'CAIRO',       color: '#92400e', shape: 'circle' },
  { country: 'AUSTRALIA', code: 'SYD', city: 'SYDNEY',      color: '#1e3a8a', shape: 'circle' },
  { country: 'THAILAND',  code: 'BKK', city: 'BANGKOK',     color: '#dc2626', shape: 'rect'   },
  { country: 'GERMANY',   code: 'FRA', city: 'FRANKFURT',   color: '#1f2937', shape: 'circle' },
  { country: 'MEXICO',    code: 'MEX', city: 'MEXICO CITY', color: '#7c3aed', shape: 'circle' },
  { country: 'KENYA',     code: 'NBO', city: 'NAIROBI',     color: '#065f46', shape: 'rect'   },
  { country: 'CANADA',    code: 'YYZ', city: 'TORONTO',     color: '#b91c1c', shape: 'circle' },
  { country: 'SINGAPORE', code: 'SIN', city: 'SINGAPORE',   color: '#1e3a8a', shape: 'circle' },
  { country: 'UAE',       code: 'DXB', city: 'DUBAI',       color: '#92400e', shape: 'rect'   },
  { country: 'USA',       code: 'JFK', city: 'NEW YORK',    color: '#1f2937', shape: 'circle' },
  { country: 'ITALY',     code: 'FCO', city: 'ROME',        color: '#b91c1c', shape: 'circle' },
  { country: 'SPAIN',     code: 'MAD', city: 'MADRID',      color: '#7c3aed', shape: 'circle' },
  { country: 'TÜRKIYE',   code: 'IST', city: 'ISTANBUL',    color: '#dc2626', shape: 'rect'   },
  { country: 'SOUTH KOREA', code:'ICN', city: 'INCHEON',    color: '#1e3a8a', shape: 'circle' },
];

// Generate a random-looking stamp date from seed
function stampDate(r) {
  const y = 2019 + Math.floor(r() * 6);
  const m = String(Math.floor(r() * 12) + 1).padStart(2, '0');
  const d = String(Math.floor(r() * 28) + 1).padStart(2, '0');
  return `${d} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][+m-1]} ${y}`;
}

// Draw text curved along an arc (top arc of circle stamp)
function drawArcText(ctx, text, cx, cy, radius, startAngle, endAngle) {
  const chars = text.split('');
  const totalAngle = endAngle - startAngle;
  const step = totalAngle / Math.max(chars.length - 1, 1);
  chars.forEach((ch, i) => {
    const angle = startAngle + i * step;
    ctx.save();
    ctx.translate(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

function drawStamp(ctx, st) {
  const { x, y, scale, rotation, opacity, data, dateStr, distress } = st;
  const col = data.color;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.globalAlpha = opacity;

  if (data.shape === 'circle') {
    const R = 54 * scale;

    // Outer ring
    ctx.strokeStyle = col;
    ctx.lineWidth = 3.5 * scale;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();

    // Inner ring
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath(); ctx.arc(0, 0, R * 0.82, 0, Math.PI * 2); ctx.stroke();

    // Country name along top arc
    ctx.fillStyle = col;
    ctx.font = `bold ${Math.round(8.5 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawArcText(ctx, data.country, 0, 0, R * 0.91, -Math.PI * 0.78, -Math.PI * 0.22);

    // Airport code — big center text
    ctx.font = `bold ${Math.round(22 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.code, 0, -5 * scale);

    // Divider line
    ctx.strokeStyle = col;
    ctx.lineWidth = 1 * scale;
    ctx.beginPath();
    ctx.moveTo(-R * 0.48, 10 * scale);
    ctx.lineTo( R * 0.48, 10 * scale);
    ctx.stroke();

    // City name
    ctx.font = `${Math.round(7.5 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.city, 0, 19 * scale);

    // Date along bottom arc
    ctx.font = `${Math.round(7 * scale)}px Arial`;
    drawArcText(ctx, dateStr, 0, 0, R * 0.91, Math.PI * 0.25, Math.PI * 0.75);

    // Small decorative dots between rings at sides
    ctx.fillStyle = col;
    [[-1, 0], [1, 0]].forEach(([sx]) => {
      const dx = sx * R * 0.91;
      ctx.beginPath(); ctx.arc(dx, 0, 2 * scale, 0, Math.PI * 2); ctx.fill();
    });

  } else {
    // Rectangular stamp
    const W = 70 * scale, H = 48 * scale;

    // Double border
    ctx.strokeStyle = col;
    ctx.lineWidth = 3 * scale;
    ctx.strokeRect(-W / 2, -H / 2, W, H);
    ctx.lineWidth = 1 * scale;
    const pad = 5 * scale;
    ctx.strokeRect(-W / 2 + pad, -H / 2 + pad, W - pad * 2, H - pad * 2);

    // Country name
    ctx.fillStyle = col;
    ctx.font = `bold ${Math.round(8 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(data.country, 0, -H * 0.28);

    // Code — big
    ctx.font = `bold ${Math.round(18 * scale)}px Arial`;
    ctx.fillText(data.code, 0, 0);

    // City + date
    ctx.font = `${Math.round(6.5 * scale)}px Arial`;
    ctx.fillText(data.city, 0, H * 0.24);
    ctx.font = `${Math.round(6 * scale)}px Arial`;
    ctx.fillText(dateStr, 0, H * 0.38);
  }

  // Distress overlay — random ink voids
  ctx.globalAlpha = opacity * 0.55;
  ctx.fillStyle = '#fff8f0';
  distress.forEach(([dx, dy, dr]) => {
    ctx.beginPath();
    ctx.arc(dx * scale, dy * scale, dr * scale, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function makeStamp(rand, startOnScreen = false) {
  const data  = STAMP_DATA[Math.floor(rand() * STAMP_DATA.length)];
  const r2    = seededRandom(Math.floor(rand() * 999999));
  const dateStr = stampDate(r2);
  // Distress dots
  const distress = Array.from({ length: 18 }, () => {
    const R = 58;
    const dx = (rand() - 0.5) * R * 2;
    const dy = (rand() - 0.5) * R * 2;
    return [dx, dy, rand() * 2.5 + 0.5];
  });
  const scale = rand() * 0.55 + 0.55;
  return {
    x:        startOnScreen ? rand() * window.innerWidth  : -120,
    y:        startOnScreen ? rand() * window.innerHeight : rand() * window.innerHeight,
    vx:       (rand() * 0.018 + 0.006) * (rand() > 0.3 ? 1 : -1),
    vy:       (rand() - 0.5) * 0.008,
    rotation: (rand() - 0.5) * Math.PI * 0.55,
    vrot:     (rand() - 0.5) * 0.00008,
    scale,
    opacity:  rand() * 0.22 + 0.52,
    data,
    dateStr,
    distress,
  };
}

export default function SpaceBackground() {
  const canvasRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animFrame;
    let w, h;

    const rand  = seededRandom(42);
    const rand3 = seededRandom(251);

    // ── Night: stars ─────────────────────────────────────────────────
    const layers = [
      Array.from({length:200}, ()=>({ x:rand(),y:rand(),r:rand()*0.6+0.2, speed:rand()*0.00015+0.00002, phase:rand()*Math.PI*2 })),
      Array.from({length:100}, ()=>({ x:rand(),y:rand(),r:rand()*0.9+0.3, speed:rand()*0.0003+0.00005,  phase:rand()*Math.PI*2 })),
      Array.from({length:40},  ()=>({ x:rand(),y:rand(),r:rand()*1.5+0.6, speed:rand()*0.0006+0.0001,   phase:rand()*Math.PI*2 })),
    ];

    let mx=0, my=0;
    function onMouse(e) {
      mx = e.clientX/window.innerWidth  - 0.5;
      my = e.clientY/window.innerHeight - 0.5;
    }
    window.addEventListener('mousemove', onMouse);

    // ── Day: passport stamps ─────────────────────────────────────────
    const stamps = Array.from({length: 14}, () => makeStamp(rand3, true));

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    let lastT = 0;

    function draw(t) {
      const dt = Math.min(t-lastT, 50);
      lastT = t;
      ctx.clearRect(0,0,w,h);

      if (theme === 'day') {
        // ── DAY: passport stamps on parchment ────────────────────────
        // Warm parchment background
        const bg = ctx.createLinearGradient(0, 0, w, h);
        bg.addColorStop(0,   '#fdf6e3');
        bg.addColorStop(0.5, '#fef9f0');
        bg.addColorStop(1,   '#fdf0d5');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, w, h);

        // Subtle grid lines like a passport page
        ctx.strokeStyle = 'rgba(180,150,100,0.07)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < w; gx += 48) {
          ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += 48) {
          ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
        }

        // Update & draw stamps
        stamps.forEach((st) => {
          st.x  += st.vx * dt;
          st.y  += st.vy * dt;
          st.rotation += st.vrot * dt;

          // Wrap horizontally, randomise vertically on re-entry
          if (st.vx > 0 && st.x > w + 120) {
            Object.assign(st, makeStamp(rand3, false));
            st.x = -110; st.y = rand3() * h;
          } else if (st.vx < 0 && st.x < -120) {
            Object.assign(st, makeStamp(rand3, false));
            st.vx = -Math.abs(st.vx);
            st.x = w + 110; st.y = rand3() * h;
          }
          if (st.y > h + 120) st.y = -110;
          if (st.y < -120)    st.y =  h + 110;

          drawStamp(ctx, st);
        });
        ctx.globalAlpha = 1;

      } else {
        // ── NIGHT: galaxy background ──────────────────────────────────
        const bg = ctx.createRadialGradient(w*0.5,h*0.2,0,w*0.5,h*0.7,Math.max(w,h));
        bg.addColorStop(0,'#0c1a2e'); bg.addColorStop(0.5,'#070f1c'); bg.addColorStop(1,'#040a14');
        ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);

        NEBULAE.forEach((n,i)=>{
          const drift=Math.sin(t*0.00025+i*1.3)*18, driftY=Math.cos(t*0.0002+i)*11;
          const cx=n.cx*w+drift, cy=n.cy*h+driftY;
          const g=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(n.rx,n.ry));
          g.addColorStop(0,n.color); g.addColorStop(1,'transparent');
          ctx.save(); ctx.scale(1,n.ry/n.rx);
          ctx.beginPath(); ctx.arc(cx,cy*(n.rx/n.ry),n.rx,0,Math.PI*2);
          ctx.fillStyle=g; ctx.fill(); ctx.restore();
        });

        layers.forEach((stars,li)=>{
          const alphaBase=[0.5,0.7,1][li];
          const px=mx*(li+1)*16, py=my*(li+1)*10;
          stars.forEach(s=>{
            const twinkle=0.4+0.6*Math.sin(t*s.speed*900+s.phase);
            ctx.globalAlpha=twinkle*alphaBase;
            const col=STAR_COLORS[Math.floor(Math.abs(Math.sin(s.phase*3))*STAR_COLORS.length)];
            const sx=(s.x*w+px+w)%w, sy=(s.y*h+py+h)%h;
            ctx.beginPath(); ctx.arc(sx,sy,s.r,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
            if (li===2&&s.r>1.4&&twinkle>0.8) {
              ctx.globalAlpha=twinkle*0.3; ctx.strokeStyle=col; ctx.lineWidth=0.5;
              ctx.beginPath();
              ctx.moveTo(sx-s.r*3.5,sy); ctx.lineTo(sx+s.r*3.5,sy);
              ctx.moveTo(sx,sy-s.r*3.5); ctx.lineTo(sx,sy+s.r*3.5);
              ctx.stroke();
            }
          });
        });
        ctx.globalAlpha=1;

      }

      animFrame = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    animFrame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [theme]);

  return <canvas ref={canvasRef} id="stars-canvas" className="opacity-100" />;
}
