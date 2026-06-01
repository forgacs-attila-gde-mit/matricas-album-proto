/* global React */
const { useState: useSState, useMemo: useSMemo, useEffect: useSEffect } = React;

/* =========================
   STUDENT SHELL — same chrome, different content
   ========================= */

function StudentSidebar() {
  const { studentPage, setStudentPage } = useStore();
  const items = [
    { id: 'current', label: 'Aktuális matrica', icon: 'bookmark' },
    { id: 'team',    label: 'Csapatunk', icon: 'groups' },
    { id: 'evidence',label: 'Bizonyítékaink', icon: 'photo_library' },
    { id: 'feedback',label: 'Visszajelzések', icon: 'rate_review' },
    { id: 'reflection', label: 'Reflexió', icon: 'self_improvement' },
  ];
  return (
    <aside className="sidebar">
      <Brand />
      <div className="nav-section">Csapat</div>
      <div style={{padding: '4px 8px 8px'}}>
        <TeamChip team={TEAMS[0]} />
        <div className="muted t-body-sm" style={{marginTop: 8}}>Választott fókusz: <strong>Növényzet és árnyék</strong></div>
      </div>
      <div className="nav-section">Album</div>
      {items.map(it => (
        <button key={it.id} className={`nav-item ${studentPage===it.id ? 'active' : ''}`} onClick={() => setStudentPage(it.id)}>
          <Icon name={it.icon} /> {it.label}
        </button>
      ))}
      <div style={{flex: 1}} />
      <div className="divider" />
      <button className="nav-item"><Icon name="help" /> Segítség</button>
    </aside>
  );
}

/* =========================
   1. STUDENT ALBUM VIEW
   ========================= */
function StudentAlbumPage() {
  const { stickers, ALBUM, setActiveStickerId, setEvidenceFlowOpen, evidence, teamId, microStickerAccepted, studentPage } = useStore();
  const teamEvidence = evidence.filter(e => e.teamId === teamId);
  const team = TEAMS[0];

  const active = stickers.find(s => s.state === 'aktiv' || s.state === 'varakozik' || s.state === 'javitas') || stickers.find(s => s.state === 'bekuldve') || stickers[2];
  const done = stickers.filter(s => s.state === 'elkeszult' || s.state === 'reflektalt');
  const upcoming = stickers.filter(s => s.state === 'tervezett');

  return (
    <div className="student-bg">
      <div className="content" style={{background: 'transparent'}}>
        <div className="content-narrow">
          {/* Album poster */}
          <div className="album-poster" style={{marginBottom: 24}}>
            <div className="row" style={{marginBottom: 14}}>
              <Chip tone="primary" icon="auto_stories">Matricás album</Chip>
              <Chip tone="neutral" icon="calendar_month">3. hét • {ALBUM.duration}</Chip>
              <Chip tone="neutral" icon="groups">{team.name}</Chip>
            </div>
            <div className="muted t-body-sm" style={{textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 600}}>{ALBUM.subject}</div>
            <div className="t-headline" style={{marginTop: 6, fontSize: 28}}>{ALBUM.title}</div>
            <div className="driving-q" style={{marginTop: 14, color: 'var(--n-800)'}}>
              „{ALBUM.drivingQ}”
            </div>
            <div className="qmark">?</div>
            <div style={{marginTop: 22}}>
              <div className="muted t-body-sm" style={{textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 8}}>Album-térkép</div>
              <StudentAlbumMap stickers={stickers} microAccepted={microStickerAccepted} />
            </div>
          </div>

          {studentPage === 'current' && <StudentCurrentSection active={active} done={done} upcoming={upcoming} onSubmit={() => setEvidenceFlowOpen(true)} onInspect={setActiveStickerId} />}
          {studentPage === 'team' && <StudentTeamSection />}
          {studentPage === 'evidence' && <StudentEvidenceSection items={teamEvidence} />}
          {studentPage === 'feedback' && <StudentFeedbackSection items={teamEvidence} />}
          {studentPage === 'reflection' && <StudentReflectionSection />}
        </div>
      </div>
      <EvidenceFlow />
    </div>
  );
}

function StudentAlbumMap({ stickers, microAccepted }) {
  // Render a 4-step (or 5 if micro) horizontal map
  const items = [...stickers];
  if (microAccepted) {
    items.splice(2, 0, { id: 'micro', title: 'Mérési gyorstalpaló', phase: 'cselekves', state: 'tervezett', short: 'AI által javasolt micro-matrica.' });
  }
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '8px 0'}}>
      {items.map((s, i) => {
        const done = s.state === 'elkeszult' || s.state === 'reflektalt';
        const active = s.state === 'aktiv' || s.state === 'bekuldve' || s.state === 'varakozik' || s.state === 'javitas';
        const phase = PHASES[s.phase];
        return (
          <React.Fragment key={s.id}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100, gap: 8}}>
              <div className={`sticker-stamp stamp-${phase.color}`} style={{
                width: 64, height: 64,
                opacity: done ? 1 : active ? 1 : 0.55,
                boxShadow: active ? '0 0 0 4px var(--primary-100)' : undefined,
                border: done ? '2px solid var(--success)' : undefined,
              }}>
                <Icon name={done ? 'check' : phase.icon} />
              </div>
              <div className="t-body-sm" style={{textAlign: 'center', fontWeight: 500, color: active ? 'var(--primary-700)' : done ? 'var(--n-700)' : 'var(--n-500)', maxWidth: 110}}>{s.title}</div>
            </div>
            {i < items.length-1 && <div style={{flex: 1, height: 3, background: done ? 'var(--success)' : 'var(--n-200)', minWidth: 30, borderRadius: 999, alignSelf: 'center', marginTop: -22}} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StudentCurrentSection({ active, done, upcoming, onSubmit, onInspect }) {
  const phase = PHASES[active.phase];
  const state = active.state;

  let banner;
  if (state === 'aktiv') {
    banner = { tone: 'primary', icon: 'play_arrow', msg: 'Ez a matrica most aktív. Töltsétek fel a bizonyítékot, ha elkészültetek.' };
  } else if (state === 'varakozik' || state === 'bekuldve') {
    banner = { tone: 'warning', icon: 'schedule', msg: 'Beküldtétek, a tanár áttekinti és visszajelzést ír.' };
  } else if (state === 'javitas') {
    banner = { tone: 'warning', icon: 'redo', msg: 'A tanári visszajelzés alapján egy ponton kérünk újabb gondolatot.' };
  } else {
    banner = { tone: 'success', icon: 'check', msg: 'Lezárt matrica — nézzétek meg a portfólióban.' };
  }

  return (
    <>
      <div className="stack">
        {/* Current sticker */}
        <div className="card" style={{padding: 24, borderColor: 'var(--primary-200)'}}>
          <div className="row-between" style={{marginBottom: 14}}>
            <div className="row">
              <PhaseChip phase={active.phase} />
              <StatePill state={active.state} />
              <Chip tone="neutral" icon="calendar_month">{active.week}. hét</Chip>
            </div>
            <Chip tone={banner.tone} icon={banner.icon}>{banner.msg}</Chip>
          </div>
          <div className="row" style={{gap: 18, alignItems: 'flex-start'}}>
            <StickerStamp phase={active.phase} size={108} />
            <div style={{flex: 1, minWidth: 0}}>
              <div className="t-headline" style={{fontSize: 24}}>{active.title}</div>
              <div className="t-body" style={{marginTop: 10, color: 'var(--n-800)'}}>{active.studentInstruction}</div>

              <div className="card" style={{marginTop: 16, background: 'var(--primary-50)', borderColor: 'var(--primary-200)'}}>
                <div className="card-section-title" style={{color: 'var(--primary-700)'}}>Tanulói döntési pont</div>
                <div className="t-body">{active.studentChoice}</div>
              </div>

              <div className="grid-2" style={{marginTop: 14}}>
                <div className="card-tight" style={{background: 'var(--n-50)', border: '1px solid var(--n-200)', borderRadius: 14, padding: 14}}>
                  <div className="card-section-title">Mit fogtok beküldeni?</div>
                  <div className="t-body">{active.expectedProduct}</div>
                </div>
                <div className="card-tight" style={{background: 'var(--n-50)', border: '1px solid var(--n-200)', borderRadius: 14, padding: 14}}>
                  <div className="card-section-title">Reflektív kérdés</div>
                  <div className="t-body" style={{fontStyle: 'italic', color: 'var(--primary-700)'}}>„{active.reflection}”</div>
                </div>
              </div>

              <div className="row" style={{marginTop: 18, gap: 10}}>
                {(state === 'aktiv' || state === 'javitas') && <Btn variant="primary" icon="upload" onClick={onSubmit}>Bizonyíték beküldése</Btn>}
                {state === 'varakozik' && <Btn variant="secondary" icon="edit" onClick={onSubmit}>Beküldés módosítása</Btn>}
                <Btn variant="ghost" icon="open_in_new" onClick={() => onInspect(active.id)}>Matrica részletek</Btn>
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="ai-card">
          <div className="ai-icon"><Icon name="psychology" /></div>
          <div>
            <div className="ai-label">Pedagógiai tipp</div>
            <div className="t-body" style={{color: 'var(--n-800)'}}>
              A következő matricát akkor kapjátok meg, ha a megfigyelésetekhez írtatok egy saját kérdést is.
              Nem a tökéletes válasz a cél, hanem hogy látszódjon, hogyan gondolkodtatok.
            </div>
          </div>
        </div>

        {/* Completed stickers */}
        {done.length > 0 && (
          <div>
            <div className="t-title-lg" style={{marginBottom: 10}}>Megszerzett matricák</div>
            <div className="grid-2">
              {done.map(s => <StickerCard key={s.id} sticker={s} onClick={() => onInspect(s.id)} />)}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div>
            <div className="t-title-lg" style={{marginBottom: 10}}>Hátralévő matrica</div>
            <div className="grid-2">
              {upcoming.map(s => (
                <div key={s.id} className="sticker phase-{PHASES[s.phase].color}" style={{opacity: 0.55, cursor: 'default', filter: 'grayscale(0.4)'}}>
                  <div className="sticker-phase-bar" />
                  <div className="sticker-row">
                    <div className="sticker-icon" style={{background: 'var(--n-100)', color: 'var(--n-500)'}}>
                      <Icon name="lock" />
                    </div>
                    <div style={{flex: 1}}>
                      <div className="t-title" style={{color: 'var(--n-600)'}}>{s.title}</div>
                      <div className="t-body-sm muted" style={{marginTop: 4}}>Még nem aktív — a tanár nyitja meg a megfelelő időben.</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StudentTeamSection() {
  const team = TEAMS[0];
  return (
    <div className="stack">
      <div className="card">
        <div className="row-between" style={{marginBottom: 18}}>
          <div className="row">
            <div style={{width: 56, height: 56, borderRadius: 18, background: team.color, color: 'white', display: 'grid', placeItems: 'center'}}>
              <Icon name="groups" className="ic-lg" />
            </div>
            <div>
              <div className="t-headline" style={{fontSize: 22}}>{team.name}</div>
              <div className="muted t-body-sm">Választott fókusz: <strong>{team.focus}</strong></div>
            </div>
          </div>
          <Chip tone="primary" icon="bookmark">3 / 4 matrica</Chip>
        </div>
        <div className="grid-4">
          {team.members.map(m => (
            <div key={m} style={{textAlign: 'center'}}>
              <Avatar name={m} color={team.color} size={56} />
              <div className="t-title" style={{marginTop: 8}}>{m}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="t-title-lg" style={{marginBottom: 10}}>Megegyeztünk</div>
        <ul style={{margin: 0, paddingLeft: 22}}>
          <li className="t-body" style={{marginBottom: 6}}>Mindegyik mérést Dóri és Marci végzik, hogy ugyanaz az eszköz legyen.</li>
          <li className="t-body" style={{marginBottom: 6}}>Hanna jegyzeteli a helyszínt és időt.</li>
          <li className="t-body" style={{marginBottom: 6}}>Zétény fotózza a megfigyelési pontokat.</li>
          <li className="t-body">A reflexiót közösen írjuk a hét végén.</li>
        </ul>
      </div>
    </div>
  );
}

function StudentEvidenceSection({ items }) {
  return (
    <div className="stack">
      <div className="t-title-lg">Bizonyítékaink</div>
      <div className="grid-2">
        {items.map(e => <EvidenceCard key={e.id} evidence={e} />)}
      </div>
    </div>
  );
}

function StudentFeedbackSection({ items }) {
  const withFeedback = items.filter(e => e.teacherFeedback);
  return (
    <div className="stack">
      <div className="t-title-lg">Tanári visszajelzések</div>
      {withFeedback.length === 0 ? (
        <Empty icon="rate_review" title="Nincs még visszajelzés" body="Amint a tanár véleményt ír, itt fog megjelenni." />
      ) : (
        withFeedback.map(e => (
          <div key={e.id} className="card">
            <div className="row" style={{marginBottom: 10}}>
              <Chip tone="primary" icon="rate_review">Visszajelzés</Chip>
              <Chip tone="neutral">{e.submittedAt}</Chip>
            </div>
            <div className="t-title">{e.title}</div>
            <div style={{marginTop: 10, padding: 12, background: 'var(--primary-50)', borderRadius: 12, borderLeft: '3px solid var(--primary-500)'}}>
              <div className="t-body">{e.teacherFeedback}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StudentReflectionSection() {
  const [answers, setAnswers] = useSState({});
  const prompts = [
    'Mi lepett meg a megfigyelés során?',
    'Melyik döntésetek változott meg a bizonyítékok alapján?',
    'Miben dolgozott jól a csapatotok?',
  ];
  return (
    <div className="stack">
      <AICard label="Csak nektek szól">
        Nem a tökéletes válasz a cél, hanem hogy látszódjon, hogyan gondolkodtatok.
      </AICard>
      {prompts.map((p, i) => (
        <div key={i} className="card">
          <div className="t-title" style={{marginBottom: 8}}>{p}</div>
          <textarea className="textarea" placeholder="Írjátok ide…" value={answers[i] || ''} onChange={e => setAnswers({...answers, [i]: e.target.value})} />
        </div>
      ))}
      <div className="row" style={{justifyContent: 'flex-end'}}>
        <Btn variant="primary" icon="save">Reflexió mentése</Btn>
      </div>
    </div>
  );
}

/* =========================
   2. EVIDENCE SUBMISSION FLOW (modal)
   ========================= */
function EvidenceFlow() {
  const { evidenceFlowOpen, setEvidenceFlowOpen, stickers, evidence, setEvidence, updateSticker, showToast, teamId } = useStore();
  const active = stickers.find(s => s.state === 'aktiv' || s.state === 'varakozik' || s.state === 'javitas') || stickers[2];
  const existing = evidence.find(e => e.teamId === teamId && e.stickerId === active?.id);

  const [step, setStep] = useSState(0);
  const [data, setData] = useSState({
    title: '',
    description: '',
    hypothesis: '',
    helpRequest: '',
    reflection: '',
  });

  useSEffect(() => {
    if (evidenceFlowOpen) {
      setStep(0);
      setData({
        title: existing?.title || 'A műfüves pálya mellett 6 fokkal melegebb volt',
        description: existing?.description || 'A napos műfüves részen 34°C-ot mértünk, az árnyékos fás részen 28°C-ot. Szerintünk a burkolat és az árnyék együtt számít.',
        hypothesis: 'A burkolat és az árnyék együtt befolyásolja a hőmérsékletet.',
        helpRequest: existing?.helpRequest || 'Nem vagyunk biztosak benne, hogy elég pontos volt-e a mérés.',
        reflection: existing?.reflection || 'Azt hittük, csak az árnyék számít, de a burkolat is nagyon sokat változtatott.',
      });
    }
  }, [evidenceFlowOpen]);

  if (!evidenceFlowOpen) return null;
  const close = () => setEvidenceFlowOpen(false);

  const submit = () => {
    const newEv = {
      id: existing?.id || `e${Date.now()}`,
      stickerId: active.id,
      teamId,
      type: 'meres',
      title: data.title,
      submittedBy: TEAMS[0].name,
      submittedAt: '3. hét szerda',
      description: data.description,
      helpRequest: data.helpRequest,
      reflection: data.reflection,
      status: 'varakozik',
      teacherFeedback: null,
    };
    if (existing) {
      setEvidence(prev => prev.map(e => e.id === existing.id ? newEv : e));
    } else {
      setEvidence(prev => [...prev, newEv]);
    }
    updateSticker(active.id, { state: 'varakozik' });
    setEvidenceFlowOpen(false);
    showToast('Bizonyíték beküldve. A tanár visszajelzésére vár.', 'check_circle');
  };

  return (
    <Drawer open={true} onClose={close}>
      <div className="drawer-header">
        <div className="row">
          <button className="btn btn-ghost btn-icon" onClick={close}><Icon name="close" /></button>
          <div style={{flex: 1}}>
            <div className="row" style={{marginBottom: 4}}>
              <PhaseChip phase={active.phase} />
              <Chip tone="neutral">{active.week}. hét</Chip>
            </div>
            <div className="t-title-lg">Bizonyíték beküldése — {active.title}</div>
            <div className="muted t-body-sm">Mit kérünk: {active.expectedProduct}</div>
          </div>
        </div>
        <div className="stepper" style={{marginTop: 18, marginBottom: 0}}>
          {[
            { id: 0, label: 'Cím és fotó' },
            { id: 1, label: 'Leírás és hipotézis' },
            { id: 2, label: 'Reflexió' },
            { id: 3, label: 'Áttekintés' },
          ].map((s, i) => (
            <React.Fragment key={s.id}>
              <div className={`step ${i===step ? 'active' : i<step ? 'done' : ''}`}>
                <div className="step-num">{i<step ? <Icon name="check" className="ic-sm" /> : i+1}</div>
                {s.label}
              </div>
              {i < 3 && <Icon name="chevron_right" className="step-sep ic-sm" />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="drawer-body">
        {step === 0 && (
          <>
            <Field label="Bizonyíték címe" help="Egy mondat, ami megfogja a lényeget.">
              <input className="input" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
            </Field>
            <Field label="Fotó vagy melléklet">
              <div style={{
                padding: 32, border: '2px dashed var(--n-300)', borderRadius: 16,
                background: 'var(--n-50)', textAlign: 'center', cursor: 'pointer',
              }}>
                <Icon name="upload_file" className="ic-xl" style={{color: 'var(--n-400)'}} />
                <div className="t-body" style={{marginTop: 8}}>Húzzátok ide a fotót, mérési táblázatot vagy jegyzetet.</div>
                <div className="muted t-body-sm" style={{marginTop: 4}}>JPG, PNG, PDF — max. 10 MB</div>
              </div>
            </Field>
          </>
        )}
        {step === 1 && (
          <>
            <Field label="Mi történt? Leírás röviden" help="Mit csináltatok, hol, mikor, mit figyeltetek meg.">
              <textarea className="textarea" rows={5} value={data.description} onChange={e => setData({...data, description: e.target.value})} />
            </Field>
            <Field label="Csapathipotézis" help="Mit gondoltatok az adatok alapján? Nem kell hogy igaz legyen.">
              <textarea className="textarea" rows={3} value={data.hypothesis} onChange={e => setData({...data, hypothesis: e.target.value})} />
            </Field>
            <Field label="Miben kértek segítséget?" help="Bátran írjátok le, ha valamiben bizonytalanok vagytok.">
              <textarea className="textarea" rows={2} value={data.helpRequest} onChange={e => setData({...data, helpRequest: e.target.value})} />
            </Field>
          </>
        )}
        {step === 2 && (
          <>
            <AICard label="Reflektív kérdés" icon="psychology">
              „{active.reflection}”
            </AICard>
            <Field label="Csapat reflexiója" help="Egy bekezdés, közösen.">
              <textarea className="textarea" rows={5} value={data.reflection} onChange={e => setData({...data, reflection: e.target.value})} />
            </Field>
            <div className="ai-card" style={{background: '#fff7ed', borderColor: '#fed7aa'}}>
              <div className="ai-icon" style={{background: '#fed7aa', color: '#9a3412'}}><Icon name="info" /></div>
              <div>
                <div className="ai-label" style={{color: '#9a3412'}}>Figyelem</div>
                <div className="t-body">Reflexió nélkül a matrica nem zárható le — a tanár csak fél bizonyítékot lát.</div>
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <div className="card">
              <div className="card-section-title">Cím</div>
              <div className="t-title">{data.title}</div>
              <div className="card-section-title" style={{marginTop: 14}}>Leírás</div>
              <div className="t-body">{data.description}</div>
              <div className="card-section-title" style={{marginTop: 14}}>Hipotézis</div>
              <div className="t-body">{data.hypothesis}</div>
              <div className="card-section-title" style={{marginTop: 14}}>Segítségkérés</div>
              <div className="t-body">{data.helpRequest}</div>
              <div className="card-section-title" style={{marginTop: 14}}>Reflexió</div>
              <div className="t-body" style={{fontStyle: 'italic', color: 'var(--primary-700)'}}>„{data.reflection}”</div>
            </div>
            <AICard label="Mi történik beküldés után">
              A matrica állapota „Bizonyíték beküldve” lesz; megjelenik a tanár visszajelzési sorában.
              Az AI egy semleges összegzést készít a tanárnak — <strong>nem osztályoz.</strong>
            </AICard>
          </>
        )}
      </div>
      <div className="drawer-footer">
        <Btn variant="ghost" onClick={close}>Mégse</Btn>
        <div className="row">
          {step > 0 && <Btn variant="secondary" icon="arrow_back" onClick={() => setStep(step-1)}>Vissza</Btn>}
          {step < 3 && <Btn variant="primary" iconRight="arrow_forward" onClick={() => setStep(step+1)}>Tovább</Btn>}
          {step === 3 && <Btn variant="primary" icon="send" onClick={submit}>Bizonyíték beküldése</Btn>}
        </div>
      </div>
    </Drawer>
  );
}

/* =========================
   PROJECT CLOSURE PAGE
   ========================= */
function ClosurePage() {
  const { stickers, evidence, ALBUM, setPrintOpen } = useStore();
  const team = TEAMS[0];
  const studentPrompts = [
    'Melyik döntésetek változott meg a bizonyítékok alapján?',
    'Miben dolgozott jól a csapatotok?',
    'Mit csinálnátok másképp egy következő projektben?',
    'Melyik matrica segített a legtöbbet?',
  ];
  const teacherPrompts = [
    'Hol volt valódi tanulói döntés?',
    'Melyik evidence mutatta legjobban a gondolkodás fejlődését?',
    'Melyik matricát használnád újra?',
    'Mi szorult túl sok tanári irányításra?',
  ];

  return (
    <div className="content-narrow">
      <div className="page-head">
        <div>
          <Chip tone="primary" icon="flag">Projektzárás</Chip>
          <h1 style={{marginTop: 8}}>{ALBUM.title}</h1>
          <div className="sub">Projekt vége — bizonyítékok, reflexiók és nyilvános bemutató.</div>
        </div>
        <div className="row">
          <Btn variant="secondary" icon="print" onClick={() => setPrintOpen('weekly')}>Nyomtatható zárócsomag</Btn>
          <Btn variant="primary" icon="download">Összegzés exportálása</Btn>
        </div>
      </div>

      {/* Final product hero */}
      <div className="card" style={{padding: 28, marginBottom: 22, background: 'linear-gradient(180deg, #faf5ff 0%, white 100%)', borderColor: 'var(--primary-200)'}}>
        <div className="row" style={{gap: 18, alignItems: 'flex-start'}}>
          <div style={{width: 80, height: 80, borderRadius: 22, background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'grid', placeItems: 'center'}}>
            <Icon name="emoji_events" style={{fontSize: 44}} />
          </div>
          <div style={{flex: 1}}>
            <div className="card-section-title" style={{color: 'var(--primary-700)'}}>Végső produktum</div>
            <div className="t-headline" style={{fontSize: 24, marginTop: 4}}>Mikroklíma-javaslatcsomag az iskola vezetésének</div>
            <div className="t-body" style={{marginTop: 8, color: 'var(--n-800)'}}>
              4 csapat, 4 hét, 12 bizonyíték → 5 konkrét javaslat az iskolaudvar hőtűrésére.
            </div>
            <div className="pill-row" style={{marginTop: 12}}>
              <Chip tone="neutral" icon="check">Bemutató megtartva</Chip>
              <Chip tone="neutral" icon="check">Makett elkészült</Chip>
              <Chip tone="neutral" icon="check">Iskolavezetés visszajelzett</Chip>
              <Chip tone="success" icon="psychology">Reflexió: 100%</Chip>
            </div>
          </div>
        </div>
      </div>

      {/* Completed timeline */}
      <div className="card" style={{marginBottom: 22}}>
        <div className="row-between" style={{marginBottom: 14}}>
          <div className="t-title-lg">Lezárt album-térkép</div>
          <div className="muted t-body-sm">A bizonyítékokra épülő utazás</div>
        </div>
        <div className="timeline-grid">
          {stickers.map(s => (
            <div key={s.id} className={`sticker phase-${PHASES[s.phase].color}`} style={{cursor: 'default'}}>
              <div className="sticker-phase-bar" />
              <div className="sticker-row">
                <div className="sticker-icon"><Icon name="check" /></div>
                <div style={{flex: 1}}>
                  <div className="muted t-body-sm">{s.week}. hét • {PHASES[s.phase].label}</div>
                  <div className="t-title">{s.title}</div>
                </div>
              </div>
              <Chip tone="success" icon="check_circle">Reflektált</Chip>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-auto-2" style={{marginBottom: 22}}>
        {/* Portfolio evidence */}
        <div>
          <div className="t-title-lg" style={{marginBottom: 14}}>Portfólió bizonyítékok</div>
          <div className="stack">
            {evidence.slice(0, 3).map(e => <EvidenceCard key={e.id} evidence={e} />)}
          </div>
        </div>

        {/* Presentation checklist */}
        <div className="card">
          <div className="t-title-lg" style={{marginBottom: 14}}>Záró bemutató ellenőrzőlista</div>
          <div className="stack-sm">
            {[
              { label: 'Iskolavezetés meghívva', done: true },
              { label: 'Próbabemutató megtartva', done: true },
              { label: 'Makett kész', done: true },
              { label: 'Bizonyítékokra épülő érvelés a diákban', done: true },
              { label: 'Reflexiók beérkeztek minden csapattól', done: true },
              { label: 'Iskolavezetés visszajelzése rögzítve', done: true },
              { label: 'Hosszú távú javaslatok továbbítva', done: false },
            ].map((item, i) => (
              <div key={i} className="row" style={{padding: '8px 0', borderBottom: '1px solid var(--n-100)'}}>
                <Icon name={item.done ? 'check_circle' : 'radio_button_unchecked'} style={{color: item.done ? 'var(--success)' : 'var(--n-400)'}} />
                <div className="t-body" style={{color: item.done ? 'var(--n-800)' : 'var(--n-500)'}}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reflections */}
      <div className="grid-2">
        <div className="card">
          <div className="t-title-lg" style={{marginBottom: 14}}><Icon name="backpack" className="ic-sm" style={{verticalAlign: -3, marginRight: 6, color: 'var(--primary-700)'}} />Diák önreflexió</div>
          <div className="muted t-body-sm" style={{marginBottom: 14}}>Csapatonkénti rövid válaszok ({team.name}):</div>
          {studentPrompts.map((p, i) => (
            <div key={i} className="card-tight" style={{padding: 12, background: 'var(--n-50)', borderRadius: 12, border: '1px solid var(--n-200)', marginBottom: 8}}>
              <div className="card-section-title">Kérdés</div>
              <div className="t-body" style={{marginBottom: 6}}>{p}</div>
              <div className="t-body" style={{fontStyle: 'italic', color: 'var(--primary-700)'}}>„{[
                'Először azt hittük, csak az árnyék számít, de a mérés után a burkolat lett a fontosabb.',
                'Akkor dolgoztunk jól, amikor mindenki külön feladatot kapott a méréshez.',
                'Több időt szánnánk a mérés előkészítésére, és külön a reflexióra is.',
                'A „Hőnyomozók” matrica adta meg a kérdéseket, amik végig elkísértek.',
              ][i]}"</div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="t-title-lg" style={{marginBottom: 14}}><Icon name="school" className="ic-sm" style={{verticalAlign: -3, marginRight: 6, color: 'var(--primary-700)'}} />Tanári reflexió</div>
          <div className="muted t-body-sm" style={{marginBottom: 14}}>Nagy Anna gondolatai a projektről:</div>
          {teacherPrompts.map((p, i) => (
            <div key={i} className="card-tight" style={{padding: 12, background: 'var(--n-50)', borderRadius: 12, border: '1px solid var(--n-200)', marginBottom: 8}}>
              <div className="card-section-title">Kérdés</div>
              <div className="t-body" style={{marginBottom: 6}}>{p}</div>
              <div className="t-body" style={{fontStyle: 'italic', color: 'var(--primary-700)'}}>„{[
                'A 2. heti perspektíva-matricában maguk a diákok döntötték el, melyik szerepet választják — ott volt a legtöbb saját kérdés.',
                'A 3. heti mérési táblázatokban látszott, hogyan jutottak el a megérzéstől a bizonyítékig.',
                'Az „Árnyék, víz, felület” matricát biztosan, csak a low-resource változatot teszem előre.',
                'A 4. heti makettek elkészítését túl sokszor irányítottam — legközelebb több időt hagyok a csapatra.',
              ][i]}"</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lannert quick check */}
      <div className="card" style={{marginTop: 22}}>
        <div className="row-between" style={{marginBottom: 14}}>
          <div>
            <div className="t-title-lg">Záró pedagógiai ellenőrzés</div>
            <div className="muted t-body-sm">Kreatív tanulás — Lannert-kompatibilis dimenziók.</div>
          </div>
          <Chip tone="success" icon="verified">9 / 10 dimenzió rendben</Chip>
        </div>
        <div className="grid-2">
          {QUALITY_DIMS.map(d => {
            const s = { ok: 'success', warn: 'warning', miss: 'danger' }[d.state];
            const ic = { ok: 'check_circle', warn: 'warning', miss: 'error' }[d.state];
            const label = { ok: 'Rendben', warn: 'Figyelmet kér', miss: 'Hiányzik' }[d.state];
            return (
              <div key={d.id} className="row" style={{padding: '8px 0', borderBottom: '1px solid var(--n-100)', gap: 12}}>
                <Chip tone={s} icon={ic}>{label}</Chip>
                <div className="t-body" style={{flex: 1}}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  StudentSidebar, StudentAlbumPage, EvidenceFlow, ClosurePage,
});
