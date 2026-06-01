/* global React */
/* Reusable UI primitives — depend on data.jsx for PHASES/STATES */

function Icon({ name, size, weight, className='', style={} }) {
  const s = { fontVariationSettings: weight ? `"wght" ${weight}` : undefined, fontSize: size, ...style };
  return <span className={`material-symbols-rounded ${className}`} style={s}>{name}</span>;
}

function Btn({ children, variant='secondary', icon, iconRight, onClick, disabled, size, className='' }) {
  const cls = ['btn', `btn-${variant}`, size==='sm' && 'btn-sm', className].filter(Boolean).join(' ');
  return (
    <button className={cls} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </button>
  );
}

function Chip({ children, tone='neutral', icon }) {
  return (
    <span className={`chip chip-${tone}`}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

function PhaseChip({ phase }) {
  const p = PHASES[phase];
  if (!p) return null;
  return <span className={`chip chip-phase-${p.color}`}><Icon name={p.icon} /> {p.label}</span>;
}

function StatePill({ state }) {
  const s = STATES[state];
  if (!s) return null;
  return <span className={`state-pill ${s.cls}`}>{s.label}</span>;
}

function StickerCard({ sticker, onClick, compact=false }) {
  const phase = PHASES[sticker.phase];
  const stateLabel = STATES[sticker.state]?.label;
  return (
    <div className={`sticker phase-${phase.color}`} onClick={onClick}>
      <div className="sticker-phase-bar" />
      <div className="sticker-row">
        <div className="sticker-icon">
          <Icon name={phase.icon} />
        </div>
        <div style={{minWidth: 0, flex: 1}}>
          <div className="t-title" style={{color: 'var(--n-900)'}}>{sticker.title}</div>
          <div className="t-body-sm muted" style={{marginTop: 4, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: compact ? 1 : 2, overflow: 'hidden'}}>
            {sticker.short}
          </div>
        </div>
      </div>
      <div className="row-between" style={{marginTop: 4}}>
        <PhaseChip phase={sticker.phase} />
        <StatePill state={sticker.state} />
      </div>
    </div>
  );
}

function StickerStamp({ phase, size=96 }) {
  const p = PHASES[phase];
  return (
    <div className={`sticker-stamp stamp-${p.color}`} style={{width: size, height: size}}>
      <Icon name={p.icon} />
    </div>
  );
}

function AICard({ children, label='AI javaslat', icon='auto_awesome' }) {
  return (
    <div className="ai-card">
      <div className="ai-icon"><Icon name={icon} /></div>
      <div style={{flex: 1, minWidth: 0}}>
        <div className="ai-label">{label}</div>
        <div className="t-body" style={{color: 'var(--n-800)'}}>{children}</div>
      </div>
    </div>
  );
}

function CheckRow({ label, status }) {
  // status: 'igen' | 'figyelmet' | 'hianyzik'
  let tone, icon, text;
  if (status === 'igen') { tone='success'; icon='check_circle'; text='Rendben'; }
  else if (status === 'figyelmet') { tone='warning'; icon='warning'; text='Figyelmet kér'; }
  else { tone='danger'; icon='error'; text='Hiányzik'; }
  return (
    <div className="check-row">
      <div>{label}</div>
      <Chip tone={tone} icon={icon}>{text}</Chip>
    </div>
  );
}

function Field({ label, children, help }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="value">{children}</div>
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}

function TeamChip({ team }) {
  return (
    <span className="team-chip">
      <span className="avatars">
        {team.members.slice(0, 4).map((m, i) => (
          <span key={i} style={{background: team.color}}>{m[0]}</span>
        ))}
      </span>
      {team.name}
    </span>
  );
}

function Drawer({ open, onClose, children, width }) {
  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={width ? {width} : undefined}>
        {children}
      </div>
    </>
  );
}

function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="toast">
      <Icon name={toast.icon} />
      {toast.msg}
    </div>
  );
}

function RoleSwitcher() {
  const { role, setRole } = useStore();
  const items = [
    { id: 'teacher', label: 'Tanári nézet', icon: 'school' },
    { id: 'student', label: 'Diák nézet', icon: 'backpack' },
    { id: 'closure', label: 'Projektzáró nézet', icon: 'flag' },
  ];
  return (
    <div className="roleswitch">
      {items.map(it => (
        <button key={it.id} className={role===it.id ? 'active' : ''} onClick={() => setRole(it.id)}>
          <Icon name={it.icon} /> {it.label}
        </button>
      ))}
    </div>
  );
}

function Brand({ small=false }) {
  return (
    <div className="brand" style={small ? {borderBottom: 'none', marginBottom: 0, padding: 0} : undefined}>
      <img src={(typeof window !== 'undefined' && window.__resources?.butterflyMark) || "assets/butterfly-mark.svg"} className="mark" alt="lecke" />
      <div style={{display:'flex', flexDirection:'column', lineHeight:1}}>
        <span className="wordmark">lecke</span>
        <span className="dot" style={{marginTop:2, fontSize:9}}>MATRICÁS ALBUM</span>
      </div>
    </div>
  );
}

function Avatar({ name, color='var(--primary-500)', size=32 }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: color,
      color: 'white', fontSize: size*0.36, fontWeight: 500,
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>{initials}</div>
  );
}

function Empty({ icon='inbox', title, body }) {
  return (
    <div style={{textAlign:'center', padding:'48px 20px', color:'var(--n-500)'}}>
      <Icon name={icon} className="ic-xl" />
      <div className="t-title" style={{marginTop: 8, color: 'var(--n-700)'}}>{title}</div>
      {body && <div className="t-body-sm" style={{marginTop: 4, maxWidth: 360, margin: '4px auto 0'}}>{body}</div>}
    </div>
  );
}

/* =========================
   REAL EVIDENCE ATTACHMENTS
   ========================= */

function AttachmentFrame({ title, type, scribbles, children }) {
  return (
    <div style={{
      background: '#fbfaf6',
      border: '1px solid var(--n-200)',
      borderRadius: 18,
      padding: 22,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div className="row-between" style={{marginBottom: 14}}>
        <div>
          <div className="card-section-title" style={{marginBottom: 4}}>{type}</div>
          <div className="t-title">{title}</div>
        </div>
        <Chip tone="neutral" icon="attach_file">Melléklet</Chip>
      </div>
      {children}
    </div>
  );
}

function ArgumentMap({ compact=false }) {
  // Argument map for "Alsós gyerek" role-card evidence
  const claim = 'A déli szünetben nincs hová leülni az udvaron';
  const reasons = [
    { reason: 'A padok mind a napon vannak', example: 'Hétfőn a 3.a padjai annyira melegek voltak, hogy senki nem ült le.' },
    { reason: 'A fűre forró, és tűz a nap', example: '12:30-kor a műfüves rész túl forró volt mezítláb is.' },
    { reason: 'A fa alatti rész sáros eső után', example: 'Keddi eső után a hárs alatti pad körül 2 napig sár volt.' },
  ];
  const size = compact ? 0.65 : 1;
  return (
    <AttachmentFrame title="Érvtérkép – Alsós gyerek szerepe" type="Érvtérkép (Argument map)">
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 0, padding: '8px 4px 0',
      }}>
        {/* Claim */}
        <div style={{
          background: 'white',
          border: '2px solid var(--primary-500)',
          borderRadius: 14,
          padding: '14px 22px',
          textAlign: 'center',
          maxWidth: 380,
          fontSize: 15 * size,
          lineHeight: '22px',
          fontWeight: 500,
          color: 'var(--n-900)',
          boxShadow: '0 2px 0 var(--primary-200)',
        }}>
          <div className="card-section-title" style={{color: 'var(--primary-700)', marginBottom: 4, fontSize: 10}}>Állítás</div>
          {claim}
        </div>

        {/* Connector lines via SVG */}
        <svg width="100%" height="48" viewBox="0 0 600 48" preserveAspectRatio="none" style={{maxWidth: 580}}>
          <path d="M300 0 L300 16 M100 16 L500 16 M100 16 L100 48 M300 16 L300 48 M500 16 L500 48"
                stroke="#d4d4d4" strokeWidth="1.5" fill="none" strokeDasharray="0" />
        </svg>

        {/* Reasons row */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, width: '100%', maxWidth: 600, marginTop: -4}}>
          {reasons.map((r, i) => (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0}}>
              <div style={{
                background: 'white',
                border: '1px solid var(--n-300)',
                borderRadius: 12,
                padding: '10px 14px',
                textAlign: 'center',
                fontSize: 13 * size,
                lineHeight: '18px',
                color: 'var(--n-800)',
                width: '100%',
              }}>
                <div className="card-section-title" style={{marginBottom: 2, fontSize: 9}}>Indok</div>
                {r.reason}
              </div>
              <svg width="20" height="24"><path d="M10 0 L10 24" stroke="#d4d4d4" strokeWidth="1.5" fill="none" /></svg>
              <div style={{
                background: '#faf5ff',
                border: '1px dashed var(--primary-300)',
                borderRadius: 12,
                padding: '10px 14px',
                textAlign: 'left',
                fontSize: 12 * size,
                lineHeight: '17px',
                color: 'var(--n-700)',
                fontStyle: 'italic',
                width: '100%',
              }}>
                <div className="card-section-title" style={{color: 'var(--primary-700)', marginBottom: 2, fontSize: 9}}>Példa</div>
                „{r.example}"
              </div>
            </div>
          ))}
        </div>

        <div className="muted t-body-sm" style={{marginTop: 18, textAlign: 'center'}}>
          Készítette: <strong>Árnyékkommandó</strong> • 2. hét csütörtök • Szerep: alsós gyerek
        </div>
      </div>
    </AttachmentFrame>
  );
}

function MeasurementTable() {
  const rows = [
    { hely: 'Műfüves pálya, déli oldal', burkolat: 'Műfű, nap', ido: '12:30', mert: '34°C', jegyzet: 'Tűzött a nap, szél nem volt' },
    { hely: 'Műfüves pálya, déli oldal', burkolat: 'Műfű, nap', ido: '12:45', mert: '34°C', jegyzet: 'Ismétlő mérés' },
    { hely: 'Hárs alatt, kerékpártároló', burkolat: 'Fű, árnyék', ido: '12:35', mert: '28°C', jegyzet: 'Sűrű lombozat' },
    { hely: 'Hárs alatt, kerékpártároló', burkolat: 'Fű, árnyék', ido: '12:50', mert: '29°C', jegyzet: 'Néha napsugár átszűrődött' },
    { hely: 'Beton lépcső, főbejárat', burkolat: 'Beton, fél napon', ido: '12:40', mert: '32°C', jegyzet: 'Délutáni napszak előtt' },
    { hely: 'Beton lépcső, főbejárat', burkolat: 'Beton, fél napon', ido: '12:55', mert: '33°C', jegyzet: '15 perc alatt 1°C-ot melegedett' },
  ];
  return (
    <AttachmentFrame title="Hőmérséklet-mérési táblázat – 3. hét" type="Mérési adatlap (Excel-szerű)">
      <div style={{background: 'white', borderRadius: 12, border: '1px solid var(--n-200)', overflow: 'hidden'}}>
        <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
          <thead>
            <tr style={{background: 'var(--n-50)', borderBottom: '1px solid var(--n-200)'}}>
              <th style={{textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--n-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>Helyszín</th>
              <th style={{textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--n-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>Burkolat</th>
              <th style={{textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--n-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>Idő</th>
              <th style={{textAlign: 'right', padding: '10px 14px', fontWeight: 600, color: 'var(--n-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>Mért érték</th>
              <th style={{textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--n-600)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5}}>Jegyzet</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{borderBottom: i < rows.length-1 ? '1px solid var(--n-100)' : 'none'}}>
                <td style={{padding: '10px 14px', color: 'var(--n-800)'}}>{r.hely}</td>
                <td style={{padding: '10px 14px', color: 'var(--n-700)'}}>{r.burkolat}</td>
                <td style={{padding: '10px 14px', color: 'var(--n-700)', fontFamily: 'ui-monospace, monospace'}}>{r.ido}</td>
                <td style={{padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: r.mert.startsWith('34') ? '#b1391a' : r.mert.startsWith('28') || r.mert.startsWith('29') ? '#0f6b5e' : 'var(--n-900)', fontFamily: 'ui-monospace, monospace'}}>{r.mert}</td>
                <td style={{padding: '10px 14px', color: 'var(--n-600)', fontSize: 12.5}}>{r.jegyzet}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{background: 'var(--n-50)', borderTop: '1px solid var(--n-200)'}}>
              <td style={{padding: '10px 14px', color: 'var(--n-700)', fontWeight: 500}} colSpan={3}>Átlag különbség nap vs. árnyék</td>
              <td style={{padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: 'var(--primary-700)', fontFamily: 'ui-monospace, monospace'}}>+5,5°C</td>
              <td style={{padding: '10px 14px', color: 'var(--n-500)', fontSize: 12.5}}>6 mérés alapján</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="row" style={{marginTop: 12, gap: 8}}>
        <Chip tone="warning" icon="info">Csapat: nem biztos, hogy mindenhol ugyanazt az eszközt használtuk</Chip>
        <Chip tone="neutral" icon="schedule">12:30–12:55</Chip>
      </div>
    </AttachmentFrame>
  );
}

function PhotoAttachment() {
  return (
    <AttachmentFrame title="Hely-fotó és megfigyelési jegyzet" type="Fotó + jegyzet">
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
        <div style={{
          aspectRatio: '4 / 3',
          borderRadius: 12,
          background: 'linear-gradient(180deg, #fef3c7 0%, #fbbf24 50%, #d97706 100%)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--n-200)',
        }}>
          {/* Stylized sun + ground SVG */}
          <svg viewBox="0 0 200 150" style={{width: '100%', height: '100%'}}>
            <circle cx="160" cy="30" r="18" fill="#fef9c3" opacity="0.9" />
            <rect x="0" y="105" width="200" height="45" fill="#854d0e" opacity="0.6" />
            <rect x="0" y="100" width="200" height="10" fill="#92400e" opacity="0.8" />
            {/* fence */}
            <g stroke="#262626" strokeWidth="1.5" fill="none" opacity="0.5">
              <line x1="20" y1="60" x2="20" y2="105" />
              <line x1="50" y1="60" x2="50" y2="105" />
              <line x1="80" y1="60" x2="80" y2="105" />
              <line x1="110" y1="60" x2="110" y2="105" />
              <line x1="140" y1="60" x2="140" y2="105" />
              <line x1="170" y1="60" x2="170" y2="105" />
              <line x1="15" y1="68" x2="175" y2="68" />
              <line x1="15" y1="95" x2="175" y2="95" />
            </g>
          </svg>
          <div style={{position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '3px 8px', borderRadius: 6, fontSize: 11}}>Műfüves pálya déli oldala • 12:30</div>
        </div>
        <div style={{
          background: 'white',
          border: '1px solid var(--n-200)',
          borderRadius: 12,
          padding: 14,
          fontFamily: 'ui-monospace, "SFMono-Regular", monospace',
          fontSize: 12.5,
          lineHeight: '18px',
          color: 'var(--n-800)',
        }}>
          <div style={{color: 'var(--n-500)', fontSize: 10, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600}}>Megfigyelési jegyzet</div>
          „A déli oldalon álló műfüves felületnél a járda is forró volt.
          A fűz fa körüli rész lényegesen hűvösebbnek tűnt.
          <br /><br />
          <strong>Hipotézis:</strong> az árnyék és a sötét burkolat együtt változtatja meg, mennyire melegszik fel a környezet."
        </div>
      </div>
    </AttachmentFrame>
  );
}

function EvidenceAttachment({ evidence }) {
  if (evidence.id === 'e1') return <PhotoAttachment />;
  if (evidence.id === 'e2') return <ArgumentMap />;
  if (evidence.id === 'e3') return <MeasurementTable />;
  if (evidence.id === 'e4' || evidence.id === 'e5') return <MeasurementTable />;
  return null;
}

Object.assign(window, {
  Icon, Btn, Chip, PhaseChip, StatePill, StickerCard, StickerStamp,
  AICard, CheckRow, Field, TeamChip, Drawer, Toast, RoleSwitcher, Brand, Avatar, Empty,
  AttachmentFrame, ArgumentMap, MeasurementTable, PhotoAttachment, EvidenceAttachment,
});
