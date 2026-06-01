/* global React */
const { useState: useTState, useMemo: useTMemo, useEffect: useTEffect } = React;

/* =========================
   TEACHER SHELL — sidebar + topbar
   ========================= */

function TeacherSidebar() {
  const { page, setPage, setWizardOpen } = useStore();
  const items = [
    { id: 'home',     label: 'Albumjaim',              icon: 'collections_bookmark', section: 'Műhely' },
    { id: 'plan',     label: 'Albumterv',              icon: 'edit_note' },
    { id: 'stickers', label: 'Matricák',               icon: 'bookmark_added' },
    { id: 'teams',    label: 'Csapatok',               icon: 'groups' },
    { id: 'evidence', label: 'Evidence-portfólió',     icon: 'photo_library' },
    { id: 'feedback', label: 'Visszajelzési sor',      icon: 'rate_review', section: 'Pedagógia' },
    { id: 'quality',  label: 'Kreatív tanulási ellenőrző', icon: 'verified' },
    { id: 'diff',     label: 'Differenciálás',         icon: 'tune' },
    { id: 'closure',  label: 'Projektzárás',           icon: 'flag' },
  ];

  return (
    <aside className="sidebar">
      <Brand />

      <button className="btn btn-primary" style={{margin: '4px 4px 10px', justifyContent: 'flex-start'}} onClick={() => setWizardOpen(true)}>
        <Icon name="add" /> Új album tervezése
      </button>

      {items.map((it, i) => (
        <React.Fragment key={it.id}>
          {it.section && <div className="nav-section">{it.section}</div>}
          <button className={`nav-item ${page===it.id ? 'active' : ''}`} onClick={() => setPage(it.id)}>
            <Icon name={it.icon} /> {it.label}
            {it.id==='feedback' && <span className="pill">3</span>}
          </button>
        </React.Fragment>
      ))}

      <div style={{flex: 1}} />
      <div className="divider" />
      <button className="nav-item">
        <Icon name="help" /> Pedagógiai súgó
      </button>
      <button className="nav-item">
        <Icon name="settings" /> Beállítások
      </button>
    </aside>
  );
}

function TopBar({ crumbs }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i>0 && <Icon name="chevron_right" className="ic-sm" style={{color:'var(--n-300)'}} />}
            {c.strong ? <strong>{c.label}</strong> : c.label}
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      <RoleSwitcher />
      <button className="btn btn-ghost btn-icon" aria-label="Súgó"><Icon name="help" /></button>
      <button className="btn btn-ghost btn-icon" aria-label="Értesítések"><Icon name="notifications" /></button>
      <div className="avatar">NA</div>
    </div>
  );
}

/* =========================
   1. TEACHER DASHBOARD — "Albumjaim"
   ========================= */
function DashboardPage() {
  const { setPage, stickers, evidence, microStickerProposed, microStickerAccepted, ALBUM, setWizardOpen, setActiveStickerId, setPrintOpen } = useStore();

  const stats = useTMemo(() => {
    const total = stickers.length;
    const completed = stickers.filter(s => s.state==='reflektalt' || s.state==='elkeszult').length;
    const waiting = evidence.filter(e => e.status==='varakozik').length;
    return { total, completed, waiting, evidenceCount: 12, weekNum: 2, totalWeeks: 4 };
  }, [stickers, evidence]);

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <Chip tone="primary" icon="auto_stories">Aktív album</Chip>
          <h1 style={{marginTop: 14}}>Albumjaim</h1>
          <div className="sub">A matrica nem jutalom, hanem egy lezárt tanulási epizód bizonyítékkal és reflexióval. Jelenleg egy aktív projekt fut a 7.B osztályban.</div>
        </div>
        <div className="row">
          <Btn icon="print" variant="secondary" onClick={() => setPrintOpen('weekly')}>Heti összefoglaló</Btn>
          <Btn icon="add" variant="primary" onClick={() => setWizardOpen(true)}>Új album</Btn>
        </div>
      </div>

      {/* Hero: aktiv album */}
      <div className="card" style={{padding: 0, overflow: 'hidden', marginBottom: 32}}>
        <div style={{padding: '36px 40px 32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'flex-start'}}>
          <div style={{minWidth: 0}}>
            <div className="row" style={{marginBottom: 10}}>
              <Chip tone="neutral" icon="calendar_month">4 hétből 2. hét</Chip>
              <Chip tone="neutral" icon="group">7.B • 24 diák • 4 csapat</Chip>
            </div>
            <div style={{fontSize: 32, lineHeight: '40px', fontWeight: 500, letterSpacing: '-0.5px', marginTop: 12}}>{ALBUM.title}</div>
            <div className="muted" style={{marginTop: 12, fontSize: 16, lineHeight: '24px', maxWidth: 560}}>
              Vezérkérdés: „{ALBUM.drivingQ}”
            </div>
            <div style={{marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap'}}>
              <Btn variant="primary" icon="open_in_new" onClick={() => setPage('plan')}>Album megnyitása</Btn>
              <Btn variant="secondary" icon="rate_review" onClick={() => setPage('feedback')}>Visszajelzési sor (3)</Btn>
            </div>
          </div>
          <div style={{textAlign: 'right', minWidth: 220}}>
            <div className="muted" style={{fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase'}}>Album-haladás</div>
            <div style={{fontSize: 48, lineHeight: '56px', fontWeight: 500, letterSpacing: '-0.6px', color: 'var(--primary-700)', marginTop: 6}}>48%</div>
            <div style={{width: 220, marginTop: 8}}>
              <div className="progress"><div style={{width: '48%'}} /></div>
            </div>
            <div className="muted" style={{fontSize: 13, marginTop: 10}}>2. hét közepén járunk</div>
          </div>
        </div>
        <div style={{borderTop: '1px solid var(--n-200)', padding: '24px 40px', background: 'var(--n-50)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28}}>
          <KPI icon="forum"        label="Beküldött bizonyíték" value="12" sub="ebből 3 új ma" />
          <KPI icon="rate_review"  label="Visszajelzésre vár"   value="3" sub="3. heti mérések" tone="warning" />
          <KPI icon="psychology"   label="Reflexió-arány"       value="86%" sub="csapatonkénti átlag" tone="success" />
        </div>
      </div>

      {/* Two column row: AI alerts + Next teacher action */}
      <div className="grid-auto-2" style={{marginBottom: 32}}>
        <div className="card">
          <div className="row-between" style={{marginBottom: 18}}>
            <div>
              <div className="t-title-lg">AI minőségellenőrzés</div>
              <div className="muted t-body-sm" style={{marginTop: 4}}>Az AI javasol, a tanár dönt.</div>
            </div>
            <Chip tone="primary" icon="verified_user">Tanári jóváhagyás</Chip>
          </div>
          <div className="stack">
            <AICard label="AI javaslat • adaptív micro-matrica">
              Több csapat (Kőkutatók, Felhőfigyelők) bizonytalan a mérés pontosságában.
              Javasolt egy <strong>15 perces „Mérési gyorstalpaló”</strong> a 3. hét előtt.
              {microStickerAccepted
                ? <div style={{marginTop: 10}}><Chip tone="success" icon="check">Beillesztve a 2. hét végére</Chip></div>
                : <div style={{marginTop: 14}}><Btn size="sm" variant="primary" onClick={() => setPage('plan')}>Megnézem az albumtervben</Btn></div>}
            </AICard>
            <AICard label="AI ellenőrzés • 3. heti matrica" icon="inventory_2">
              A 3. heti matrica eszközigénye magas: minden csapatnak hőmérő kellene.
              <div style={{marginTop: 6}}><strong>Javaslat:</strong> low-resource változat — árnyék-nap összehasonlító megfigyelési lap.</div>
            </AICard>
          </div>
        </div>

        <div className="card">
          <div style={{marginBottom: 18}}>
            <div className="t-title-lg">Következő tanári lépés</div>
            <div className="muted t-body-sm" style={{marginTop: 4}}>A következő lépés attól függ, milyen bizonyítékokat hoztak a csapatok.</div>
          </div>
          <div className="stack-sm">
            <NextAction
              icon="rate_review"
              title="3 csapat mérési bizonyítékát kell áttekinteni"
              detail="Árnyékkommandó, Kőkutatók, Felhőfigyelők."
              cta="Visszajelzési sor"
              onClick={() => setPage('feedback')}
            />
            <NextAction
              icon="auto_awesome"
              title="„Mérési gyorstalpaló” – elfogadás"
              detail="AI által javasolt micro-matrica. Te döntesz, beilleszted-e."
              cta="Megnézem"
              onClick={() => setPage('plan')}
            />
          </div>
        </div>
      </div>

      {/* Sticker map */}
      <div className="card">
        <div className="row-between" style={{marginBottom: 22}}>
          <div>
            <div className="t-title-lg">Album-térkép</div>
            <div className="muted t-body-sm" style={{marginTop: 4}}>Négy fázis, négy hét. Kattints bármelyik matricára a részletekért.</div>
          </div>
          <Btn variant="ghost" icon="open_in_new" onClick={() => setPage('plan')}>Idővonal nézet</Btn>
        </div>
        <div className="grid-4" style={{alignItems: 'stretch'}}>
          {stickers.map(s => (
            <StickerCard key={s.id} sticker={s} compact onClick={() => setActiveStickerId(s.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, sub, tone }) {
  const colorMap = { warning: 'var(--warning)', success: '#047857' };
  return (
    <div style={{display: 'flex', alignItems: 'flex-start', gap: 12}}>
      <div style={{width: 36, height: 36, borderRadius: 12, background: 'white', border: '1px solid var(--n-200)', display: 'grid', placeItems: 'center', color: tone ? colorMap[tone] : 'var(--n-700)', flexShrink: 0}}>
        <Icon name={icon} />
      </div>
      <div style={{minWidth: 0}}>
        <div className="muted" style={{fontSize: 12}}>{label}</div>
        <div style={{fontSize: 20, fontWeight: 500, marginTop: 2, color: tone ? colorMap[tone] : 'var(--n-900)'}}>{value}</div>
        <div className="muted" style={{fontSize: 11, marginTop: 2}}>{sub}</div>
      </div>
    </div>
  );
}

function NextAction({ icon, title, detail, cta, onClick }) {
  return (
    <div style={{display: 'flex', gap: 12, padding: 12, border: '1px solid var(--n-200)', borderRadius: 14, background: 'var(--n-50)'}}>
      <div style={{width: 32, height: 32, borderRadius: 10, background: 'white', border: '1px solid var(--n-200)', display: 'grid', placeItems: 'center', flexShrink: 0}}>
        <Icon name={icon} className="ic-sm" />
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div className="t-title" style={{fontSize: 14}}>{title}</div>
        <div className="muted t-body-sm" style={{marginTop: 2}}>{detail}</div>
      </div>
      {cta && <Btn size="sm" variant="ghost" iconRight="arrow_forward" onClick={onClick}>{cta}</Btn>}
    </div>
  );
}

/* =========================
   2. ALBUM CREATION WIZARD
   ========================= */
function AlbumWizard() {
  const { wizardOpen, setWizardOpen, showToast } = useStore();
  const [step, setStep] = useTState(0);
  const [data, setData] = useTState({
    title: 'Városi mikroklíma nyomában',
    subject: 'Integrált természettudomány',
    grade: '7. évfolyam',
    duration: '4 hét',
    drivingQ: 'Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?',
    finalProduct: 'Diákok által készített mikroklíma-javaslatcsomag makettel, mérési adatokkal és nyilvános bemutatóval',
    audience: 'Osztálytársak, természettudomány-tanárok, iskola vezetése',
    dispositions: ['Kíváncsiság','Képzelőerő','Együttműködés','Kitartás','Fegyelem'],
    assessment: 'Portfólió + bemutató + társértékelés',
    classSize: 24,
    tools: ['Telefon (csapatonként 1)','Mérőszalag','Nyomtatott térkép','Krétatábla'],
    autonomy: 'kozepes',
    risk: 'alacsony',
    materialPref: 'vegyes',
  });

  if (!wizardOpen) return null;

  const steps = [
    { id: 0, label: 'Projekt alapjai',         icon: 'edit_document' },
    { id: 1, label: 'Cél és produktum',        icon: 'flag' },
    { id: 2, label: 'Osztálykörnyezet',        icon: 'apartment' },
    { id: 3, label: 'AI albumvázlat',          icon: 'auto_awesome' },
  ];

  const close = () => { setWizardOpen(false); setStep(0); };
  const finish = () => {
    setWizardOpen(false);
    setStep(0);
    showToast('Albumterv elmentve — a publikálás tanári döntés marad.', 'check_circle');
  };

  return (
    <div className="drawer-backdrop" style={{padding: 0}}>
      <div style={{
        position: 'fixed', inset: 24, background: 'var(--n-50)',
        borderRadius: 26, display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
        zIndex: 51, maxWidth: 1280, margin: '0 auto',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{background: 'white', padding: '18px 28px', borderBottom: '1px solid var(--n-200)', display: 'flex', alignItems: 'center', gap: 16}}>
          <button className="btn btn-ghost btn-icon" onClick={close}><Icon name="close" /></button>
          <div>
            <div className="t-title-lg">Új album tervezése</div>
            <div className="muted t-body-sm">Az AI csak javaslatot tesz. A publikálás tanári döntés.</div>
          </div>
          <div style={{flex: 1}} />
          <div className="muted t-body-sm">{step+1} / {steps.length}</div>
        </div>

        {/* Stepper */}
        <div style={{padding: '20px 28px 0'}}>
          <div className="stepper">
            {steps.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`step ${i===step ? 'active' : i<step ? 'done' : ''}`}>
                  <div className="step-num">{i<step ? <Icon name="check" className="ic-sm" /> : i+1}</div>
                  {s.label}
                </div>
                {i < steps.length-1 && <Icon name="chevron_right" className="step-sep ic-sm" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex: 1, overflow: 'auto', padding: '8px 28px 100px'}}>
          {step === 0 && <WStep1 data={data} onChange={setData} />}
          {step === 1 && <WStep2 data={data} onChange={setData} />}
          {step === 2 && <WStep3 data={data} onChange={setData} />}
          {step === 3 && <WStep4 data={data} />}
        </div>

        {/* Footer */}
        <div style={{background: 'white', borderTop: '1px solid var(--n-200)', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
          <div className="t-body-sm muted">
            <Icon name="info" className="ic-sm" style={{verticalAlign: -3, marginRight: 4}} />
            Ellenőrzés: van tanulói döntés, produktum, bizonyíték és reflexió minden héten.
          </div>
          <div className="row">
            <Btn variant="ghost" onClick={close}>Mégse</Btn>
            {step > 0 && <Btn variant="secondary" icon="arrow_back" onClick={() => setStep(step-1)}>Vissza</Btn>}
            {step < 3 && <Btn variant="primary" iconRight="arrow_forward" onClick={() => setStep(step+1)}>Tovább</Btn>}
            {step === 3 && <Btn variant="primary" icon="check" onClick={finish}>Albumterv mentése</Btn>}
          </div>
        </div>
      </div>
    </div>
  );
}

function WStep1({ data, onChange }) {
  const set = (k, v) => onChange({...data, [k]: v});
  return (
    <div className="card" style={{maxWidth: 880, margin: '20px auto'}}>
      <div className="t-title-lg" style={{marginBottom: 4}}>Projekt alapjai</div>
      <div className="muted t-body-sm" style={{marginBottom: 18}}>A vezérkérdés kötelező — ez fogja meghatározni a matricák szellemiségét.</div>
      <div className="stack">
        <Field label="Cím">
          <input className="input" value={data.title} onChange={e => set('title', e.target.value)} />
        </Field>
        <div className="grid-3">
          <Field label="Tantárgy">
            <input className="input" value={data.subject} onChange={e => set('subject', e.target.value)} />
          </Field>
          <Field label="Évfolyam">
            <select className="select" value={data.grade} onChange={e => set('grade', e.target.value)}>
              <option>5. évfolyam</option><option>6. évfolyam</option><option>7. évfolyam</option><option>8. évfolyam</option>
            </select>
          </Field>
          <Field label="Időtáv">
            <select className="select" value={data.duration} onChange={e => set('duration', e.target.value)}>
              <option>2 hét</option><option>3 hét</option><option>4 hét</option><option>6 hét</option>
            </select>
          </Field>
        </div>
        <Field label="Vezérkérdés" help="Egy nyitott, élhető, közeli kérdés, amire a diákok bizonyítékkal válaszolhatnak.">
          <textarea className="textarea" value={data.drivingQ} onChange={e => set('drivingQ', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function WStep2({ data, onChange }) {
  const set = (k, v) => onChange({...data, [k]: v});
  const allDisp = ['Kíváncsiság','Képzelőerő','Együttműködés','Kitartás','Fegyelem','Kritikai gondolkodás','Reflexió'];
  const toggle = d => set('dispositions', data.dispositions.includes(d) ? data.dispositions.filter(x => x!==d) : [...data.dispositions, d]);
  return (
    <div className="card" style={{maxWidth: 880, margin: '20px auto'}}>
      <div className="t-title-lg" style={{marginBottom: 4}}>Tanulási cél és produktum</div>
      <div className="muted t-body-sm" style={{marginBottom: 18}}>A projekt végére nem csak egy plakát készül, hanem egy bizonyítékokra épülő javaslatcsomag.</div>
      <div className="stack">
        <Field label="Végső produktum">
          <textarea className="textarea" value={data.finalProduct} onChange={e => set('finalProduct', e.target.value)} />
        </Field>
        <Field label="Közönség" help="Kinek készül a produktum? Külső közönség nélkül a projekt nem zárul nyilvánosan.">
          <input className="input" value={data.audience} onChange={e => set('audience', e.target.value)} />
        </Field>
        <Field label="Kreatív diszpozíciók" help="Válassz 3-5 fókuszt, amit szeretnél láthatóvá tenni a projekt során.">
          <div className="row wrap">
            {allDisp.map(d => (
              <button key={d} className={`chip ${data.dispositions.includes(d) ? 'chip-primary' : 'chip-neutral'}`}
                style={{cursor: 'pointer'}} onClick={() => toggle(d)}>
                {data.dispositions.includes(d) && <Icon name="check" className="ic-sm" />}
                {d}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Értékelési mód">
          <select className="select" value={data.assessment} onChange={e => set('assessment', e.target.value)}>
            <option>Portfólió + bemutató + társértékelés</option>
            <option>Portfólió + tanári rubrika</option>
            <option>Csak bemutató + reflexió</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function WStep3({ data, onChange }) {
  const set = (k, v) => onChange({...data, [k]: v});
  const opts = {
    autonomy: [
      { id: 'alacsony', title: 'Alacsony', sub: 'Strukturált utasítások, kevés választás.' },
      { id: 'kozepes',  title: 'Közepes',  sub: 'Kötött keret, csapaton belüli döntések.' },
      { id: 'magas',    title: 'Magas',    sub: 'Nyitott vezérkérdés, csapat tervezi a lépéseket.' },
    ],
    risk: [
      { id: 'alacsony', title: 'Alacsony', sub: 'Iskolán belüli megfigyelés, ismert környezet.' },
      { id: 'kozepes',  title: 'Közepes',  sub: 'Iskola környéke, könnyű terepi munka.' },
      { id: 'magas',    title: 'Magas',    sub: 'Külső terepmunka, külső közönség.' },
    ],
    materialPref: [
      { id: 'nyomtatott', title: 'Nyomtatás-első', sub: 'A diákok offline is dolgozhatnak.' },
      { id: 'vegyes',     title: 'Vegyes',         sub: 'Telefon + papír együtt.' },
      { id: 'digitalis',  title: 'Digitális-első', sub: 'Min. 1 telefon csapatonként.' },
    ],
  };

  return (
    <div className="card" style={{maxWidth: 980, margin: '20px auto'}}>
      <div className="t-title-lg" style={{marginBottom: 4}}>Osztálykörnyezet</div>
      <div className="muted t-body-sm" style={{marginBottom: 18}}>Ez segít az AI-nak abban, hogy ne javasoljon megvalósíthatatlan ötleteket.</div>

      <div className="stack">
        <div className="grid-2">
          <Field label="Osztálylétszám">
            <input className="input" type="number" value={data.classSize} onChange={e => set('classSize', +e.target.value)} />
          </Field>
          <Field label="Elérhető eszközök">
            <input className="input" value={data.tools.join(', ')} onChange={e => set('tools', e.target.value.split(',').map(s => s.trim()))} />
          </Field>
        </div>

        <Field label="Tanulói önállóság szintje">
          <div className="grid-3">
            {opts.autonomy.map(o => (
              <div key={o.id} className={`choice-card ${data.autonomy===o.id ? 'selected' : ''}`} onClick={() => set('autonomy', o.id)}>
                <div className="choice-title">{o.title}</div>
                <div className="choice-sub">{o.sub}</div>
              </div>
            ))}
          </div>
        </Field>

        <Field label="Kockázati szint">
          <div className="grid-3">
            {opts.risk.map(o => (
              <div key={o.id} className={`choice-card ${data.risk===o.id ? 'selected' : ''}`} onClick={() => set('risk', o.id)}>
                <div className="choice-title">{o.title}</div>
                <div className="choice-sub">{o.sub}</div>
              </div>
            ))}
          </div>
        </Field>

        <Field label="Anyaghasználati elv">
          <div className="grid-3">
            {opts.materialPref.map(o => (
              <div key={o.id} className={`choice-card ${data.materialPref===o.id ? 'selected' : ''}`} onClick={() => set('materialPref', o.id)}>
                <div className="choice-title">{o.title}</div>
                <div className="choice-sub">{o.sub}</div>
              </div>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

function WStep4({ data }) {
  const [accepted, setAccepted] = useTState([false, false, false, false]);
  const stickers = INITIAL_STICKERS;

  return (
    <div style={{maxWidth: 1100, margin: '20px auto'}}>
      <div className="ai-card" style={{marginBottom: 18, alignItems: 'center'}}>
        <div className="ai-icon"><Icon name="auto_awesome" /></div>
        <div style={{flex: 1}}>
          <div className="ai-label">AI albumvázlat</div>
          <div className="t-body">
            Az AI az osztálykörnyezet és a vezérkérdés alapján 4 heti vázlatot javasol.
            <strong> A publikálás tanári döntés.</strong>
          </div>
        </div>
        <Btn variant="secondary" icon="refresh">Új vázlat generálása</Btn>
      </div>

      <div className="card" style={{marginBottom: 18, background: 'var(--success-bg)', borderColor: '#a7f3d0'}}>
        <div className="row" style={{gap: 14}}>
          <Icon name="verified" style={{color: '#047857'}} />
          <div style={{flex: 1}}>
            <div className="t-title" style={{color: '#065f46'}}>Ellenőrzés rendben</div>
            <div className="t-body-sm" style={{color: '#047857'}}>Van tanulói döntés, produktum, bizonyíték és reflexió minden héten.</div>
          </div>
        </div>
      </div>

      <div className="stack">
        {stickers.map((s, i) => {
          const p = PHASES[s.phase];
          return (
            <div key={s.id} className="card" style={{padding: 18}}>
              <div className="row-between" style={{marginBottom: 12}}>
                <div className="row">
                  <div className="muted t-label" style={{fontSize: 11}}>{i+1}. HÉT</div>
                  <div className="t-title-lg">{s.title}</div>
                  <PhaseChip phase={s.phase} />
                </div>
                <div className="row">
                  <Btn size="sm" variant="ghost" icon="refresh">Újragenerálás</Btn>
                  <Btn size="sm" variant="ghost" icon="edit">Szerkesztés</Btn>
                  <Btn size="sm" variant={accepted[i] ? 'primary' : 'secondary'} icon={accepted[i] ? 'check' : 'thumb_up'}
                    onClick={() => setAccepted(prev => prev.map((v, idx) => idx===i ? !v : v))}>
                    {accepted[i] ? 'Jóváhagyva' : 'Jóváhagyom'}
                  </Btn>
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <div className="card-section-title">Tanulói instrukció</div>
                  <div className="t-body">{s.studentInstruction}</div>
                </div>
                <div>
                  <div className="card-section-title">Várható produktum</div>
                  <div className="t-body">{s.expectedProduct}</div>
                  <div className="card-section-title" style={{marginTop: 10}}>Reflektív kérdés</div>
                  <div className="t-body">„{s.reflection}”</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   3. TEACHER ALBUM TIMELINE — "Albumterv"
   ========================= */
function AlbumPlanPage() {
  const { stickers, microStickerProposed, microStickerAccepted, acceptMicroSticker, setMicroProposed, showToast, ALBUM, setActiveStickerId, setPrintOpen } = useStore();
  const weeks = [1, 2, 3, 4];
  const microStillProposed = microStickerProposed && !microStickerAccepted;

  const stickerByWeek = w => stickers.filter(s => s.week === w);

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <Chip tone="primary" icon="auto_awesome" >Aktív album</Chip>
          <h1 style={{marginTop: 8}}>{ALBUM.title}</h1>
          <div className="sub">{ALBUM.subject} • {ALBUM.grade} • {ALBUM.duration} • {ALBUM.finalProduct.split(' ').slice(0, 6).join(' ')}…</div>
        </div>
        <div className="row">
          <Btn variant="secondary" icon="print" onClick={() => setPrintOpen('weekly')}>Heti összefoglaló</Btn>
          <Btn variant="secondary" icon="visibility">Diák-nézet előnézet</Btn>
          <Btn variant="primary" icon="publish">Frissítések publikálása</Btn>
        </div>
      </div>

      {/* Driving question banner */}
      <div className="card" style={{marginBottom: 32, background: 'var(--primary-50)', borderColor: 'var(--primary-200)', padding: '28px 32px'}}>
        <div className="row" style={{gap: 20, alignItems: 'flex-start'}}>
          <div style={{width: 56, height: 56, borderRadius: 18, background: 'white', display: 'grid', placeItems: 'center', color: 'var(--primary-700)', flexShrink: 0}}>
            <Icon name="question_mark" className="ic-xl" />
          </div>
          <div style={{flex: 1}}>
            <div className="card-section-title" style={{color: 'var(--primary-700)', marginBottom: 6}}>Vezérkérdés</div>
            <div style={{fontSize: 22, lineHeight: '30px', fontWeight: 500, color: 'var(--n-900)', letterSpacing: '-0.2px', maxWidth: 720}}>„{ALBUM.drivingQ}”</div>
            <div className="muted t-body-sm" style={{marginTop: 12}}>{ALBUM.grade} • {ALBUM.subject} • Közönség: {ALBUM.audience}</div>
          </div>
          <div className="pill-row" style={{maxWidth: 240, justifyContent: 'flex-end'}}>
            {ALBUM.dispositions.map(d => <Chip key={d} tone="primary">{d}</Chip>)}
          </div>
        </div>
      </div>

      {/* Adaptive micro-sticker proposal */}
      {microStillProposed && (
        <div className="ai-card" style={{marginBottom: 32, background: 'white', padding: '26px 28px'}}>
          <div className="ai-icon"><Icon name="auto_awesome" /></div>
          <div style={{flex: 1}}>
            <div className="ai-label">AI javaslat • adaptív micro-matrica • tanári jóváhagyás szükséges</div>
            <div className="t-title" style={{marginTop: 2}}>„Mérési gyorstalpaló” — 15 perc, beillesztés a 2. hét végére</div>
            <div className="t-body" style={{marginTop: 6}}>
              Több csapat bizonytalan a mérés pontosságában (Kőkutatók, Felhőfigyelők, Árnyékkommandó visszajelzései alapján).
              Javasolt egy 15 perces mérési gyorstalpaló a 3. hét előtt: hőmérő használat, ismétlés, jegyzetelés.
            </div>
            <div className="row" style={{marginTop: 12, flexWrap: 'wrap'}}>
              <Btn variant="primary" icon="add" onClick={acceptMicroSticker}>Beillesztem a 2. hét végére</Btn>
              <Btn variant="secondary" icon="bookmark">Csak tanári jegyzetként mentem</Btn>
              <Btn variant="ghost" icon="close" onClick={() => { setMicroProposed(false); showToast('Javaslat elutasítva, az album nem változott.'); }}>Elutasítom</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className={`timeline-grid ${microStickerAccepted ? 'with-micro' : ''}`}>
        {weeks.map((w, idx) => (
          <React.Fragment key={w}>
            <WeekColumn week={w} title={ALBUM.weekTitles[w-1]} stickers={stickerByWeek(w)} current={w === ALBUM.currentWeek} onSticker={setActiveStickerId} />
            {microStickerAccepted && w === 2 && (
              <div className="micro-col">
                <div className="week-head" style={{borderColor: 'var(--primary-300)', background: 'var(--primary-50)'}}>
                  <div className="week-num" style={{color: 'var(--primary-700)'}}>Adaptív • 2. hét vége</div>
                  <div className="week-title">Mérési gyorstalpaló</div>
                </div>
                <div className="sticker phase-cselekves" style={{cursor: 'default'}}>
                  <div className="sticker-phase-bar" />
                  <div className="sticker-row">
                    <div className="sticker-icon"><Icon name="speed" /></div>
                    <div style={{flex: 1}}>
                      <div className="t-title">Mérési gyorstalpaló</div>
                      <div className="t-body-sm muted" style={{marginTop: 4}}>15 perces gyors gyakorlat: hőmérő használat, ismétlés, jegyzetelés.</div>
                    </div>
                  </div>
                  <Chip tone="primary" icon="auto_awesome">AI által javasolt micro-matrica</Chip>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div style={{marginTop: 24}} className="ai-card">
        <div className="ai-icon"><Icon name="info" /></div>
        <div>
          <div className="ai-label">Pedagógiai elv</div>
          <div className="t-body">Az AI javasol, a tanár dönt. A következő lépés attól függ, milyen bizonyítékokat hoztak a csapatok.</div>
        </div>
      </div>
    </div>
  );
}

function WeekColumn({ week, title, stickers, current, onSticker }) {
  const { showToast } = useStore();
  return (
    <div className="week-col">
      <div className="week-head" style={current ? {borderColor: 'var(--primary-500)', background: 'var(--primary-50)'} : undefined}>
        <div className="row-between">
          <div>
            <div className="week-num">{week}. hét{current ? ' • most' : ''}</div>
            <div className="week-title">{title}</div>
          </div>
          {current && <Chip tone="primary" icon="play_arrow">Aktív</Chip>}
        </div>
      </div>
      {stickers.map(s => (
        <StickerCard key={s.id} sticker={s} onClick={() => onSticker(s.id)} />
      ))}
      <button className="btn btn-ghost btn-sm" style={{justifyContent: 'center', color: 'var(--n-500)', border: '1px dashed var(--n-300)', borderRadius: 14, padding: '10px 0'}}
        onClick={() => showToast('Új matrica vázlata — AI javaslat indítása…', 'auto_awesome')}>
        <Icon name="add" /> Új matrica
      </button>
    </div>
  );
}

/* =========================
   4. STICKER DETAIL DRAWER
   ========================= */
function StickerDetailDrawer() {
  const { activeStickerId, setActiveStickerId, stickers, updateSticker, showToast, setPage } = useStore();
  const sticker = stickers.find(s => s.id === activeStickerId);
  const [tab, setTab] = useTState('pedagogy');

  useTEffect(() => { setTab('pedagogy'); }, [activeStickerId]);

  if (!sticker) return null;
  const p = PHASES[sticker.phase];

  const publish = () => {
    updateSticker(sticker.id, { state: 'aktiv' });
    showToast('Matrica publikálva a diákoknak.');
  };
  const accept = () => {
    updateSticker(sticker.id, { state: 'elkeszult' });
    showToast('Matrica lezárva: elkészült.');
  };

  return (
    <Drawer open={!!activeStickerId} onClose={() => setActiveStickerId(null)}>
      <div className="drawer-header">
        <div className="row-between">
          <div className="row">
            <button className="btn btn-ghost btn-icon" onClick={() => setActiveStickerId(null)}><Icon name="close" /></button>
            <StickerStamp phase={sticker.phase} size={60} />
            <div>
              <div className="row" style={{marginBottom: 4}}>
                <PhaseChip phase={sticker.phase} />
                <StatePill state={sticker.state} />
                <Chip tone="neutral" icon="calendar_today">{sticker.week}. hét</Chip>
              </div>
              <div className="t-title-lg">{sticker.title}</div>
              <div className="muted t-body-sm">{sticker.short}</div>
            </div>
          </div>
        </div>
        <div className="tabs" style={{marginTop: 18, marginBottom: -1}}>
          <button className={tab==='pedagogy' ? 'active' : ''} onClick={() => setTab('pedagogy')}><Icon name="school" /> Pedagógia</button>
          <button className={tab==='evidence' ? 'active' : ''} onClick={() => setTab('evidence')}><Icon name="photo_library" /> Bizonyítékok</button>
          <button className={tab==='ai' ? 'active' : ''} onClick={() => setTab('ai')}><Icon name="auto_awesome" /> AI ellenőrzés</button>
          <button className={tab==='diff' ? 'active' : ''} onClick={() => setTab('diff')}><Icon name="tune" /> Differenciálás</button>
        </div>
      </div>

      <div className="drawer-body">
        {tab === 'pedagogy' && <DetailPedagogy sticker={sticker} />}
        {tab === 'evidence' && <DetailEvidence stickerId={sticker.id} />}
        {tab === 'ai' && <DetailAI sticker={sticker} />}
        {tab === 'diff' && <DetailDiff sticker={sticker} />}
      </div>

      <div className="drawer-footer">
        <div className="row">
          <Btn variant="ghost" icon="content_copy">Duplikálás</Btn>
          <Btn variant="ghost" icon="edit">Szerkesztés</Btn>
        </div>
        <div className="row">
          {sticker.state === 'tervezett' && <Btn variant="primary" icon="publish" onClick={publish}>Publikálás diákoknak</Btn>}
          {sticker.state === 'bekuldve' && <Btn variant="primary" icon="rate_review" onClick={() => { setPage('feedback'); setActiveStickerId(null); }}>Visszajelzések áttekintése</Btn>}
          {(sticker.state === 'varakozik' || sticker.state === 'javitas') && <Btn variant="primary" icon="check" onClick={accept}>Matrica lezárása</Btn>}
          {sticker.state === 'elkeszult' && <Btn variant="primary" icon="psychology" onClick={() => { updateSticker(sticker.id, { state: 'reflektalt'}); showToast('Reflexió lezárva.'); }}>Reflexió lezárása</Btn>}
          {sticker.state === 'reflektalt' && <Chip tone="success" icon="check_circle">Lezárt tanulási epizód</Chip>}
        </div>
      </div>
    </Drawer>
  );
}

function DetailPedagogy({ sticker }) {
  return (
    <>
      <div className="card">
        <div className="card-section-title">Tanulói instrukció</div>
        <div className="t-body" style={{color: 'var(--n-800)'}}>{sticker.studentInstruction}</div>
      </div>
      <div className="card">
        <div className="card-section-title">Tanári facilitáció (lépésről lépésre)</div>
        <ol style={{margin: 0, paddingLeft: 22}}>
          {sticker.teacherSteps.map((s, i) => <li key={i} className="t-body" style={{marginBottom: 6}}>{s}</li>)}
        </ol>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-section-title">Tanulói döntési pont</div>
          <div className="t-body">{sticker.studentChoice}</div>
        </div>
        <div className="card">
          <div className="card-section-title">Várható produktum</div>
          <div className="t-body">{sticker.expectedProduct}</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <div className="card-section-title">Evidence típus</div>
          <div className="t-body"><Icon name="photo_library" className="ic-sm" style={{verticalAlign: -3, marginRight: 6}} />{sticker.evidenceType}</div>
        </div>
        <div className="card">
          <div className="card-section-title">Reflektív kérdés</div>
          <div className="t-body" style={{fontStyle: 'italic', color: 'var(--primary-700)'}}>„{sticker.reflection}”</div>
        </div>
      </div>
      <div className="card" style={{background: '#fff7ed', borderColor: '#fed7aa'}}>
        <div className="card-section-title" style={{color: '#9a3412'}}>B terv — ha nem így alakul</div>
        <div className="t-body">{sticker.bPlan}</div>
      </div>
      <div className="card" style={{background: '#ecfdf5', borderColor: '#a7f3d0'}}>
        <div className="card-section-title" style={{color: '#047857'}}>Low-resource változat</div>
        <div className="t-body">{sticker.lowResource}</div>
      </div>
    </>
  );
}

function DetailEvidence({ stickerId }) {
  const { evidence } = useStore();
  const items = evidence.filter(e => e.stickerId === stickerId);
  if (items.length === 0) {
    return <Empty icon="photo_library" title="Még nincs beküldött bizonyíték" body="Amint egy csapat feltölt anyagot, itt jelenik meg." />;
  }
  return (
    <>
      {items.map(e => <EvidenceCard key={e.id} evidence={e} />)}
    </>
  );
}

function DetailAI({ sticker }) {
  return (
    <>
      <AICard label="Minőségellenőrzés">
        Az AI a pedagógiai elvek alapján ellenőrzi a matrica struktúráját. A jelölések nem osztályzatok — figyelmeztetések a tanárnak.
      </AICard>
      <div className="card">
        {sticker.aiCheck.map((c, i) => (
          <CheckRow key={i} label={c.label} status={c.ok} />
        ))}
      </div>
      <AICard label="Javasolt B terv" icon="alt_route">{sticker.bPlan}</AICard>
      <AICard label="Low-resource változat" icon="eco">{sticker.lowResource}</AICard>
    </>
  );
}

function DetailDiff({ sticker }) {
  const paths = [
    { id: 'tamogatott', title: 'Támogatott út', icon: 'support', desc: 'A tanár előkészített megfigyelési ellenőrzőlistát ad. A csapat csak válaszol a kérdésekre.' },
    { id: 'alap',       title: 'Alap út',       icon: 'route',   desc: 'A csapat választ két helyszínt és önállóan ír egy hipotézist.' },
    { id: 'kihivas',    title: 'Kihívás út',    icon: 'rocket_launch', desc: 'A csapat három helyszínt hasonlít össze és mérési protokollt javasol.' },
  ];
  return (
    <>
      <AICard label="Differenciálási elv">
        A különbség ne több munka legyen, hanem más típusú támasz.
      </AICard>
      {paths.map(p => (
        <div key={p.id} className="diff-card">
          <div className="row">
            <Icon name={p.icon} style={{color: 'var(--primary-700)'}} />
            <div className="t-title">{p.title}</div>
          </div>
          <div className="t-body muted-strong">{p.desc}</div>
        </div>
      ))}
    </>
  );
}

/* =========================
   5. TEACHER FEEDBACK QUEUE
   ========================= */
function FeedbackPage() {
  const { evidence, setActiveEvidenceId } = useStore();
  const pending = evidence.filter(e => e.status === 'varakozik');
  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <h1>Visszajelzési sor</h1>
          <div className="sub">3 csapat mérési bizonyítéka vár tanári visszajelzésre — 3. hét, mikroklíma-kísérlet.</div>
        </div>
        <div className="row">
          <Btn variant="secondary" icon="filter_list">Szűrés</Btn>
          <Btn variant="secondary" icon="auto_awesome">Mind: AI-összegzés</Btn>
        </div>
      </div>

      <div className="ai-card" style={{marginBottom: 18}}>
        <div className="ai-icon"><Icon name="auto_awesome" /></div>
        <div>
          <div className="ai-label">AI összegzés tanári ellenőrzéshez</div>
          <div className="t-body">
            Három csapat (Árnyékkommandó, Kőkutatók, Felhőfigyelők) küldött mérési bizonyítékot. A közös minta:
            mindegyik csapat <strong>bizonytalan a mérés pontosságában</strong>. Az AI nem osztályoz — a visszajelzés tanári döntés.
          </div>
        </div>
      </div>

      <div className="stack">
        {pending.map(e => <FeedbackRow key={e.id} evidence={e} onOpen={() => setActiveEvidenceId(e.id)} />)}
      </div>
    </div>
  );
}

function FeedbackRow({ evidence, onOpen }) {
  const team = TEAMS.find(t => t.id === evidence.teamId);
  return (
    <div className="card" style={{padding: 26}}>
      <div className="row-between" style={{alignItems: 'flex-start', gap: 24}}>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="row" style={{marginBottom: 10}}>
            <TeamChip team={team} />
            <Chip tone="warning" icon="schedule">Visszajelzésre vár</Chip>
            <span className="muted t-body-sm">Beküldve: {evidence.submittedAt}</span>
          </div>
          <div className="t-title-lg" style={{marginBottom: 8, fontSize: 19}}>{evidence.title}</div>
          <div className="muted t-body" style={{marginBottom: 12, maxWidth: 640}}>{evidence.description}</div>
          {evidence.helpRequest && (
            <div style={{padding: '12px 14px', background: '#fff7ed', borderRadius: 12, marginTop: 8, borderLeft: '3px solid #f97316'}}>
              <Icon name="back_hand" className="ic-sm" style={{color: '#9a3412', verticalAlign: -3, marginRight: 6}} />
              <span className="t-body-sm" style={{color: '#9a3412'}}><strong>Segítségkérés:</strong> {evidence.helpRequest}</span>
            </div>
          )}
        </div>
        <div className="stack-sm" style={{minWidth: 240}}>
          <Btn variant="primary" icon="rate_review" onClick={onOpen}>Visszajelzés írása</Btn>
          <Btn variant="ghost" size="sm" icon="visibility">Mellékletek</Btn>
        </div>
      </div>
    </div>
  );
}

function FeedbackDrawer() {
  const { activeEvidenceId, setActiveEvidenceId, evidence, updateEvidence, updateSticker, showToast, stickers } = useStore();
  const e = evidence.find(x => x.id === activeEvidenceId);
  const [feedback, setFeedback] = useTState('');
  const [nextStep, setNextStep] = useTState('jovahagy');

  useTEffect(() => {
    if (!e) return;
    setFeedback(e.teacherFeedback || 'Jó megfigyelés, hogy nem csak az árnyékot, hanem a burkolatot is figyeltétek. A következő körben írjátok le pontosabban, mikor mértetek, és ugyanazzal az eszközzel mértetek-e mindkét helyen.');
    setNextStep('javitas');
  }, [activeEvidenceId]);

  if (!e) return null;
  const team = TEAMS.find(t => t.id === e.teamId);
  const sticker = stickers.find(s => s.id === e.stickerId);
  const isPending = e.status === 'varakozik';

  const sendFeedback = () => {
    const status = nextStep === 'lezar' ? 'elkeszult' : nextStep === 'javitas' ? 'javitas' : 'elkeszult';
    updateEvidence(e.id, { status, teacherFeedback: feedback });
    if (status === 'javitas') updateSticker(e.stickerId, { state: 'javitas' });
    if (status === 'elkeszult') updateSticker(e.stickerId, { state: 'elkeszult' });
    setActiveEvidenceId(null);
    showToast(nextStep === 'javitas' ? 'Visszajelzés elküldve, csapat javításra kapja vissza.' : 'Visszajelzés elküldve, matrica lezárva.');
  };

  return (
    <Drawer open={!!activeEvidenceId} onClose={() => setActiveEvidenceId(null)}>
      <div className="drawer-header">
        <div className="row-between">
          <div className="row">
            <button className="btn btn-ghost btn-icon" onClick={() => setActiveEvidenceId(null)}><Icon name="close" /></button>
            <div>
              <div className="row" style={{marginBottom: 4}}>
                <TeamChip team={team} />
                <StatePill state={e.status} />
              </div>
              <div className="t-title-lg">{e.title}</div>
              <div className="muted t-body-sm">Matrica: {sticker?.title}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="drawer-body">
        {/* The actual attachment artifact */}
        <EvidenceAttachment evidence={e} />

        <div className="card">
          <div className="card-section-title">Csapat által írt leírás</div>
          <div className="t-body" style={{marginBottom: 12}}>{e.description}</div>
          {e.helpRequest && (
            <>
              <div className="card-section-title">Segítségkérés</div>
              <div className="t-body" style={{color: '#9a3412'}}>{e.helpRequest}</div>
            </>
          )}
          {e.reflection && (
            <>
              <div className="card-section-title" style={{marginTop: 12}}>Csapat reflexiója</div>
              <div className="t-body" style={{fontStyle: 'italic'}}>„{e.reflection}”</div>
            </>
          )}
        </div>

        {isPending && (<>
        <AICard label="AI összegzés tanári ellenőrzéshez">
          A csapat azonosított egy fontos összefüggést (burkolat + árnyék), de a mérési körülmények nem dokumentáltak.
          Kérdés a tanárnak: kértek-e ismételt mérést, vagy fogadjuk el ezt a kvalitatív felismerést?
          <div style={{marginTop: 8}}><Chip tone="neutral" icon="info">Az AI nem osztályoz. A döntés a Tiéd.</Chip></div>
        </AICard>

        <div className="card">
          <div className="card-section-title">Rubrika-emlékeztető</div>
          <ul style={{margin: 0, paddingLeft: 22}}>
            <li className="t-body">Megfigyelés pontossága — látszik-e a módszer? <Chip tone="warning">Részben</Chip></li>
            <li className="t-body">Bizonyítékhasználat — összekötik-e az adatot és az állítást? <Chip tone="success">Igen</Chip></li>
            <li className="t-body">Reflexió — van-e meglepetés vagy nézőpontváltás? <Chip tone="success">Igen</Chip></li>
          </ul>
        </div>

        <Field label="Javasolt visszajelzés" help="Az AI által generált draft. Mindenképpen szerkeszd, hogy a Te hangod legyen.">
          <textarea className="textarea" rows={5} value={feedback} onChange={ev => setFeedback(ev.target.value)} />
        </Field>

        <Field label="Mi történjen a matricával?">
          <div className="grid-3">
            <div className={`choice-card ${nextStep==='javitas' ? 'selected' : ''}`} onClick={() => setNextStep('javitas')}>
              <div className="row" style={{gap: 8}}><Icon name="redo" /> <span className="choice-title">Visszaküldöm javításra</span></div>
              <div className="choice-sub">A csapat új mérést végez, a matrica „Javítás alatt”.</div>
            </div>
            <div className={`choice-card ${nextStep==='lezar' ? 'selected' : ''}`} onClick={() => setNextStep('lezar')}>
              <div className="row" style={{gap: 8}}><Icon name="check_circle" /> <span className="choice-title">Elfogadom és lezárom</span></div>
              <div className="choice-sub">A matrica „Elkészült” állapotba kerül, a portfólió frissül.</div>
            </div>
            <div className={`choice-card ${nextStep==='megj' ? 'selected' : ''}`} onClick={() => setNextStep('megj')}>
              <div className="row" style={{gap: 8}}><Icon name="bookmark" /> <span className="choice-title">Csak tanári jegyzet</span></div>
              <div className="choice-sub">Nem kap a csapat üzenetet, a megfigyelést csak Te látod.</div>
            </div>
          </div>
        </Field>
        </>)}

        {!isPending && e.teacherFeedback && (
          <div className="card" style={{background: 'var(--primary-50)', borderColor: 'var(--primary-200)'}}>
            <div className="card-section-title" style={{color: 'var(--primary-700)'}}>Tanári visszajelzés</div>
            <div className="t-body" style={{color: 'var(--n-800)'}}>{e.teacherFeedback}</div>
          </div>
        )}
      </div>
      <div className="drawer-footer">
        <Btn variant="ghost" onClick={() => setActiveEvidenceId(null)}>{isPending ? 'Mégse' : 'Bezárás'}</Btn>
        <div className="row">
          {isPending ? (<>
          <Btn variant="secondary" icon="edit">Szerkesztem és elküldöm</Btn>
          <Btn variant="primary" icon="send" onClick={sendFeedback}>
            {nextStep === 'javitas' ? 'Visszaküldöm javításra' : nextStep === 'lezar' ? 'Elfogadom és lezárom a matricát' : 'Mentés tanári jegyzetként'}
          </Btn>
          </>) : (
            <Btn variant="secondary" icon="download">Melléklet letöltése</Btn>
          )}
        </div>
      </div>
    </Drawer>
  );
}

/* =========================
   6. QUALITY PANEL — Lannert / kreatív tanulási ellenőrző
   ========================= */
function QualityPage() {
  const { QUALITY_DIMS } = useStore();
  const stateMap = { ok: { tone: 'success', icon: 'check_circle', label: 'Rendben' },
                     warn: { tone: 'warning', icon: 'warning', label: 'Figyelmet kér' },
                     miss: { tone: 'danger', icon: 'error', label: 'Hiányzik' } };

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <Chip tone="primary" icon="verified">Lannert-kompatibilis</Chip>
          <h1 style={{marginTop: 8}}>Kreatív tanulási ellenőrző</h1>
          <div className="sub">A panel arra figyel, hogy a matricás album valódi kreatív tanulást szolgáljon — nem felszínes gamifikációt.</div>
        </div>
        <div className="row">
          <Btn variant="secondary" icon="picture_as_pdf">Riport PDF</Btn>
        </div>
      </div>

      <div className="grid-auto-2" style={{alignItems: 'flex-start'}}>
        <div className="card">
          <div className="t-title-lg" style={{marginBottom: 22}}>Album minőségi dimenziók</div>
          {QUALITY_DIMS.map(d => {
            const s = stateMap[d.state];
            return (
              <div key={d.id} className="quality-row">
                <div className="t-body">{d.label}</div>
                <div className="quality-bar">
                  <div style={{width: `${d.score}%`, background: d.state==='ok' ? 'var(--success)' : d.state==='warn' ? 'var(--warning)' : 'var(--danger)'}} />
                </div>
                <Chip tone={s.tone} icon={s.icon}>{s.label}</Chip>
              </div>
            );
          })}
        </div>

        <div className="stack">
          <div className="card" style={{background: 'var(--success-bg)', borderColor: '#a7f3d0'}}>
            <div className="row" style={{gap: 10}}>
              <Icon name="check_circle" style={{color: '#047857'}} />
              <div className="t-title" style={{color: '#065f46'}}>Erősségek</div>
            </div>
            <ul style={{margin: '10px 0 0', paddingLeft: 22, color: '#065f46'}}>
              <li className="t-body">Reflexió: minden héten része a matricának.</li>
              <li className="t-body">Tanulói döntési pontok: minden matricán van valódi választás.</li>
              <li className="t-body">Nyilvános bemutatás: 4. hét meghívással zárul.</li>
            </ul>
          </div>
          <div className="card" style={{background: 'var(--warning-bg)', borderColor: '#fcd34d'}}>
            <div className="row" style={{gap: 10}}>
              <Icon name="warning" style={{color: 'var(--warning)'}} />
              <div className="t-title" style={{color: '#7c2d12'}}>Figyelmet kér</div>
            </div>
            <ul style={{margin: '10px 0 0', paddingLeft: 22, color: '#7c2d12'}}>
              <li className="t-body">Bizonyítékgyűjtés: több csapat mérési bizonytalansággal küzd → AI mikro-matricát javasol.</li>
              <li className="t-body">Low-resource változat: a 3. heti matrica eszközigényes — érdemes alternatívát publikálni.</li>
            </ul>
          </div>
          <AICard label="Pedagógiai elv emlékeztető">
            A matrica nem jutalom, hanem egy lezárt tanulási epizód bizonyítékkal és reflexióval.
            Nem az a cél, hogy minden csapat ugyanarra jusson, hanem hogy az érvelésük látható legyen.
          </AICard>
        </div>
      </div>
    </div>
  );
}

/* =========================
   7. DIFFERENTIATION PAGE
   ========================= */
function DiffPage() {
  const { stickers, setActiveStickerId } = useStore();
  const [stickerId, setStickerId] = useTState('s1');
  const sticker = stickers.find(s => s.id === stickerId);

  const paths = {
    s1: [
      { id: 'sup', title: 'Támogatott út', icon: 'support', tone: '#0f6b5e',
        desc: 'A tanár előkészített megfigyelési ellenőrzőlistát ad: helyszín, idő, hipotézis-keret.', who: 'Új a környékben járó, vagy bizonytalan diákok.' },
      { id: 'base', title: 'Alap út', icon: 'route', tone: '#6821a8',
        desc: 'A csapat választ két helyszínt és önállóan ír egy hipotézist a megfigyelési jegyzet alapján.', who: 'A csapatok többsége.' },
      { id: 'chal', title: 'Kihívás út', icon: 'rocket_launch', tone: '#b1391a',
        desc: 'A csapat három helyszínt hasonlít össze és javaslatot tesz egy ismételhető mérési protokollra.', who: 'Tapasztaltabb, gyors haladó csapatok.' },
    ],
    s2: [
      { id: 'sup', title: 'Támogatott út', icon: 'support', tone: '#0f6b5e',
        desc: 'Készen kapott szerepkártya teljes leírással, érvtérkép-sablon kitöltött példával.', who: 'Tanulók, akiknek az érveléshez támasz kell.' },
      { id: 'base', title: 'Alap út', icon: 'route', tone: '#6821a8',
        desc: 'A csapat húz egy szerepet, kitölti az érvtérképet és felkészül egy ütköztetésre.', who: 'A csapatok többsége.' },
      { id: 'chal', title: 'Kihívás út', icon: 'rocket_launch', tone: '#b1391a',
        desc: 'A csapat két szerep konfliktusát modellezi, és javaslatot tesz a vitát feloldó kompromisszumra.', who: 'Erős vitakultúrájú csapatok.' },
    ],
    s3: [
      { id: 'sup', title: 'Támogatott út', icon: 'support', tone: '#0f6b5e',
        desc: 'Előre kijelölt helyszín, papír alapú mérési táblázat, tanári segítés a méréshez.', who: 'Csapatok, akik a 2. hét végén bizonytalanok.' },
      { id: 'base', title: 'Alap út', icon: 'route', tone: '#6821a8',
        desc: 'A csapat választja a 3 helyszínt és vezeti a mérési táblázatot.', who: 'A csapatok többsége.' },
      { id: 'chal', title: 'Kihívás út', icon: 'rocket_launch', tone: '#b1391a',
        desc: 'A csapat saját mérési protokollt tervez, hibahatárt becsül és ismétlést szervez.', who: 'Természettudományos érdeklődésű csapatok.' },
    ],
    s4: [
      { id: 'sup', title: 'Támogatott út', icon: 'support', tone: '#0f6b5e',
        desc: 'Készen kapott bemutató-váz: 3 dia, sablon javaslattal.', who: 'Akik nehezen lépnek nyilvános bemutatóra.' },
      { id: 'base', title: 'Alap út', icon: 'route', tone: '#6821a8',
        desc: 'A csapat 3 perces bemutatót készít a választott média formátumban (makett / plakát / videó).', who: 'A csapatok többsége.' },
      { id: 'chal', title: 'Kihívás út', icon: 'rocket_launch', tone: '#b1391a',
        desc: 'A csapat moderálja a kérdés-válasz szakaszt és írásban összegzi a vezetőség visszajelzését.', who: 'Vezetésre kész csapatok.' },
    ],
  };

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <h1>Differenciálás</h1>
          <div className="sub">A különbség ne több munka legyen, hanem más típusú támasz.</div>
        </div>
      </div>

      <div className="card" style={{marginBottom: 18}}>
        <div className="row-between">
          <div className="t-title">Melyik matricához differenciálsz?</div>
          <div className="diff-tabs">
            {stickers.map(s => (
              <button key={s.id} className={stickerId===s.id ? 'active' : ''} onClick={() => setStickerId(s.id)}>{s.week}. hét</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{marginBottom: 18}}>
        <div className="row" style={{gap: 14}}>
          <StickerStamp phase={sticker.phase} size={64} />
          <div>
            <div className="t-title-lg">{sticker.title}</div>
            <div className="muted t-body-sm" style={{marginTop: 4}}>{sticker.short}</div>
            <button className="btn btn-ghost btn-sm" style={{marginTop: 8, padding: '4px 10px'}} onClick={() => setActiveStickerId(sticker.id)}>
              <Icon name="open_in_new" /> Matrica részletek
            </button>
          </div>
        </div>
      </div>

      <div className="grid-3">
        {paths[stickerId].map(p => (
          <div key={p.id} className="card" style={{borderTop: `4px solid ${p.tone}`}}>
            <div className="row" style={{marginBottom: 10}}>
              <Icon name={p.icon} style={{color: p.tone}} />
              <div className="t-title-lg" style={{color: 'var(--n-900)'}}>{p.title}</div>
            </div>
            <div className="t-body">{p.desc}</div>
            <div className="divider" />
            <div className="card-section-title">Kinek ajánljuk</div>
            <div className="t-body-sm muted-strong">{p.who}</div>
            <div style={{marginTop: 14}}>
              <Btn size="sm" variant="secondary" icon="edit">Testreszabás</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   8. STICKERS LIST PAGE (browse all stickers)
   ========================= */
function StickersPage() {
  const { stickers, setActiveStickerId, microStickerAccepted } = useStore();
  const groupedByPhase = ['kerdezes', 'kepzelet', 'cselekves', 'reflexio'].map(ph => ({
    phase: ph,
    items: stickers.filter(s => s.phase === ph),
  }));

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <h1>Matricák</h1>
          <div className="sub">Az album minden matricája egy lezárható tanulási epizód.</div>
        </div>
        <div className="row">
          <Btn variant="secondary" icon="filter_list">Szűrés</Btn>
          <Btn variant="primary" icon="add">Új matrica</Btn>
        </div>
      </div>

      <div className="stack">
        {groupedByPhase.map(g => (
          g.items.length > 0 && (
            <div key={g.phase}>
              <div className="row" style={{marginBottom: 10}}>
                <PhaseChip phase={g.phase} />
                <span className="muted t-body-sm">{g.items.length} matrica</span>
              </div>
              <div className="grid-3">
                {g.items.map(s => <StickerCard key={s.id} sticker={s} onClick={() => setActiveStickerId(s.id)} />)}
                {g.phase === 'cselekves' && microStickerAccepted && (
                  <div className="sticker phase-cselekves" style={{cursor: 'default'}}>
                    <div className="sticker-phase-bar" />
                    <div className="sticker-row">
                      <div className="sticker-icon"><Icon name="speed" /></div>
                      <div style={{flex: 1}}>
                        <div className="t-title">Mérési gyorstalpaló</div>
                        <div className="t-body-sm muted" style={{marginTop: 4}}>15 perces gyors gyakorlat — adaptív micro-matrica.</div>
                      </div>
                    </div>
                    <Chip tone="primary" icon="auto_awesome">AI által javasolt micro-matrica</Chip>
                  </div>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

/* =========================
   9. TEAMS PAGE
   ========================= */
function TeamsPage() {
  const { evidence, setActiveEvidenceId } = useStore();
  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <h1>Csapatok</h1>
          <div className="sub">7.B osztály — 4 csapat • Heti haladás csapatonként.</div>
        </div>
      </div>
      <div className="grid-2">
        {TEAMS.map(team => {
          const subs = evidence.filter(e => e.teamId === team.id);
          const pending = subs.filter(e => e.status === 'varakozik').length;
          return (
            <div key={team.id} className="card">
              <div className="row-between" style={{marginBottom: 14}}>
                <div className="row" style={{gap: 12}}>
                  <div style={{width: 44, height: 44, borderRadius: 14, background: team.color, color: 'white', display: 'grid', placeItems: 'center'}}>
                    <Icon name="groups" />
                  </div>
                  <div>
                    <div className="t-title-lg">{team.name}</div>
                    <div className="muted t-body-sm">{team.members.join(', ')}</div>
                  </div>
                </div>
                <Chip tone="neutral" icon="bookmark">{team.focus}</Chip>
              </div>
              <div className="grid-3" style={{gap: 12}}>
                <KPI icon="forum" label="Bizonyíték" value={subs.length} sub={`${pending} vár visszajelzésre`} tone={pending ? 'warning' : undefined} />
                <KPI icon="check" label="Lezárt matrica" value={subs.filter(s => s.status==='elkeszult').length} sub="hét 1 + 2" />
                <KPI icon="psychology" label="Reflexió" value={subs.filter(s => s.reflection).length > 0 ? 'Aktív' : '—'} sub="utolsó: 3. hét" />
              </div>
              {subs.length > 0 && (
                <div style={{marginTop: 14}}>
                  <div className="card-section-title">Legutóbbi bizonyíték</div>
                  <EvidenceCard evidence={subs[subs.length-1]} onClick={() => setActiveEvidenceId(subs[subs.length-1].id)} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   10. EVIDENCE PORTFOLIO PAGE
   ========================= */
function EvidencePage() {
  const { evidence, stickers, setActiveEvidenceId } = useStore();
  const [filter, setFilter] = useTState('all');
  const filtered = filter === 'all' ? evidence : evidence.filter(e => e.status === filter);

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <h1>Evidence-portfólió</h1>
          <div className="sub">A projekt során keletkezett bizonyítékok — fotó, jegyzet, mérési táblázat, reflexió.</div>
        </div>
        <div className="row">
          <Btn variant="secondary" icon="download">Export</Btn>
          <Btn variant="secondary" icon="print">Nyomtatható összegzés</Btn>
        </div>
      </div>

      <div className="diff-tabs" style={{marginBottom: 18}}>
        {[
          { id: 'all', label: 'Összes' },
          { id: 'varakozik', label: 'Vár visszajelzésre' },
          { id: 'javitas', label: 'Javítás alatt' },
          { id: 'elkeszult', label: 'Elkészült' },
        ].map(t => (
          <button key={t.id} className={filter===t.id ? 'active' : ''} onClick={() => setFilter(t.id)}>{t.label}</button>
        ))}
      </div>

      <div className="grid-2">
        {filtered.map(e => <EvidenceCard key={e.id} evidence={e} onClick={() => setActiveEvidenceId(e.id)} />)}
      </div>
    </div>
  );
}

function EvidenceCard({ evidence, onClick, compact }) {
  const { setActiveEvidenceId } = useStore();
  const handleClick = onClick || (() => setActiveEvidenceId(evidence.id));
  const team = TEAMS.find(t => t.id === evidence.teamId);
  const typeIcon = { foto: 'photo_camera', meres: 'thermostat', jegyzet: 'edit_note' }[evidence.type] || 'photo_library';
  return (
    <div className="card evidence-card" style={{cursor: 'pointer', padding: 18, display: 'flex', flexDirection: 'column', gap: 12}} onClick={handleClick}>
      <div className="row" style={{marginBottom: 0, justifyContent: 'space-between'}}>
        <div className="row">
          <TeamChip team={team} />
          <Chip tone="neutral" icon="calendar_today">{evidence.submittedAt}</Chip>
        </div>
        <StatePill state={evidence.status} />
      </div>
      <div className="row" style={{gap: 14, alignItems: 'flex-start'}}>
        <div className="thumb" style={{width: compact ? 48 : 64, height: compact ? 48 : 64, background: 'var(--n-100)', borderRadius: 12, display: 'grid', placeItems: 'center', color: 'var(--n-500)'}}>
          <Icon name={typeIcon} className="ic-lg" />
        </div>
        <div style={{flex: 1, minWidth: 0}}>
          <div className="t-title">{evidence.title}</div>
          <div className="muted t-body-sm" style={{marginTop: 4, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden'}}>{evidence.description}</div>
        </div>
      </div>
      {!compact && <AttachmentPreview evidence={evidence} onClick={handleClick} />}
      {evidence.teacherFeedback && (
        <div style={{padding: 12, background: 'var(--primary-50)', borderRadius: 12, borderLeft: '3px solid var(--primary-500)'}}>
          <div className="card-section-title" style={{color: 'var(--primary-700)'}}>Tanári visszajelzés</div>
          <div className="t-body-sm" style={{color: 'var(--n-800)'}}>{evidence.teacherFeedback}</div>
        </div>
      )}
    </div>
  );
}

function AttachmentChip({ icon, iconBg, iconColor, title, sub, onClick }) {
  return (
    <button
      type="button"
      className="attachment-chip"
      onClick={e => { e.stopPropagation(); if (onClick) onClick(e); }}
    >
      <div className="attachment-chip-icon" style={{background: iconBg, color: iconColor}}>
        <Icon name={icon} className="ic-sm" />
      </div>
      <div style={{flex: 1, minWidth: 0, textAlign: 'left'}}>
        <div className="t-label" style={{color: 'var(--n-800)'}}>{title}</div>
        <div className="muted" style={{fontSize: 11.5}}>{sub}</div>
      </div>
      <span className="attachment-chip-cta">
        <span className="t-body-sm" style={{fontWeight: 500, color: 'var(--primary-700)'}}>Megnyitás</span>
        <Icon name="chevron_right" className="ic-sm" style={{color: 'var(--primary-700)'}} />
      </span>
    </button>
  );
}

function AttachmentPreview({ evidence, onClick }) {
  const { setActiveEvidenceId } = useStore();
  const open = onClick || (() => setActiveEvidenceId(evidence.id));
  if (evidence.id === 'e2') {
    return <AttachmentChip icon="account_tree" iconBg="var(--primary-100)" iconColor="var(--primary-700)"
      title="Érvtérkép — alsós gyerek szerepe" sub="1 állítás • 3 indok • 3 példa" onClick={open} />;
  }
  if (evidence.id === 'e3' || evidence.id === 'e4' || evidence.id === 'e5') {
    return <AttachmentChip icon="table_chart" iconBg="#ffe7df" iconColor="#b1391a"
      title="Mérési táblázat — 6 sor" sub="3 helyszín • nap vs. árnyék átlag: +5,5°C" onClick={open} />;
  }
  if (evidence.id === 'e1') {
    return <AttachmentChip icon="photo_camera" iconBg="#fef3c7" iconColor="#a16207"
      title="Fotó + megfigyelési jegyzet" sub="1 fotó • hipotézis-mondat" onClick={open} />;
  }
  return null;
}

Object.assign(window, {
  TeacherSidebar, TopBar,
  DashboardPage, AlbumWizard, AlbumPlanPage,
  StickerDetailDrawer, FeedbackPage, FeedbackDrawer, QualityPage,
  DiffPage, StickersPage, TeamsPage, EvidencePage,
  EvidenceCard, INITIAL_STICKERS,
});
