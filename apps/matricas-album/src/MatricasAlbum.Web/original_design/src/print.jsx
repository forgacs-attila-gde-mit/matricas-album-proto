/* global React */
/* Print preview modal — looks like a real A4 PDF. */

function PrintPreview() {
  const { printOpen, setPrintOpen, ALBUM } = useStore();
  if (!printOpen) return null;
  const close = () => setPrintOpen(null);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(38, 38, 38, 0.85)',
      zIndex: 60, display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        background: 'var(--n-800)', color: 'white', padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid var(--n-700)',
      }}>
        <button className="btn btn-ghost btn-icon" onClick={close} style={{color: 'white'}}>
          <Icon name="close" />
        </button>
        <div>
          <div style={{fontSize: 14, fontWeight: 500}}>Nyomtatási előnézet — Heti tanári összefoglaló</div>
          <div style={{fontSize: 12, color: 'var(--n-400)'}}>A4 portrait • 2. hét • generálva most</div>
        </div>
        <div style={{flex: 1}} />
        <div className="row" style={{gap: 8}}>
          <Btn variant="secondary" icon="download" size="sm">PDF letöltése</Btn>
          <Btn variant="primary" icon="print" size="sm">Nyomtatás</Btn>
        </div>
      </div>

      {/* Scroll area */}
      <div style={{flex: 1, overflow: 'auto', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24}}>
        <PrintPage1 />
        <PrintPage2 />
        <div style={{color: 'var(--n-400)', fontSize: 12, padding: '8px 0 24px'}}>2 / 2 oldal</div>
      </div>
    </div>
  );
}

/* A4 page: 210 × 297mm. At ~96 DPI we use roughly 794 × 1123 px. */
function PrintPage({ children, pageNum, totalPages }) {
  return (
    <div style={{
      width: 794,
      minHeight: 1123,
      background: 'white',
      boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      borderRadius: 4,
      padding: '56px 64px',
      position: 'relative',
      color: '#171717',
      fontFamily: 'Roboto, system-ui, sans-serif',
    }}>
      {/* Top header strip */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingBottom: 16, borderBottom: '2px solid #171717',
        marginBottom: 28,
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <img src={(typeof window !== 'undefined' && window.__resources?.butterflyMark) || "assets/butterfly-mark.svg"} style={{width: 24, height: 24}} alt="" />
          <div>
            <div style={{fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px', lineHeight: 1}}>lecke</div>
            <div style={{fontSize: 9, color: '#9333ea', fontWeight: 600, letterSpacing: 1, marginTop: 2}}>MATRICÁS ALBUM</div>
          </div>
        </div>
        <div style={{textAlign: 'right', fontSize: 11, color: '#525252'}}>
          <div>Nagy Anna • 7.B osztály</div>
          <div>2026. október 23. csütörtök</div>
        </div>
      </div>

      {children}

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 30, left: 64, right: 64,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 10, color: '#737373',
        borderTop: '1px solid #e5e5e5', paddingTop: 10,
      }}>
        <div>Heti tanári összefoglaló • Városi mikroklíma nyomában • 2. hét</div>
        <div>{pageNum} / {totalPages}</div>
      </div>
    </div>
  );
}

function PrintPage1() {
  return (
    <PrintPage pageNum={1} totalPages={2}>
      {/* Hero */}
      <div style={{marginBottom: 28}}>
        <div style={{fontSize: 10, fontWeight: 600, letterSpacing: 1, color: '#9333ea', textTransform: 'uppercase'}}>Heti tanári összefoglaló • 2. hét</div>
        <h1 style={{fontSize: 28, fontWeight: 500, letterSpacing: '-0.4px', margin: '6px 0 10px', lineHeight: '34px'}}>
          Városi mikroklíma nyomában
        </h1>
        <div style={{fontSize: 13, color: '#525252'}}>
          7. évfolyam • Integrált természettudomány • 4 hetes projekt • 24 diák • 4 csapat
        </div>
      </div>

      {/* Driving question */}
      <div style={{background: '#faf5ff', border: '1px solid #ebd5ff', borderRadius: 14, padding: '18px 22px', marginBottom: 22}}>
        <div style={{fontSize: 9, fontWeight: 600, letterSpacing: 0.8, color: '#6821a8', textTransform: 'uppercase', marginBottom: 6}}>Vezérkérdés</div>
        <div style={{fontSize: 16, fontWeight: 500, lineHeight: '24px', color: '#171717'}}>
          „Hogyan tehetnénk élhetőbbé az iskola környékét a hőségben?"
        </div>
      </div>

      {/* This week summary KPIs */}
      <h2 style={{fontSize: 16, fontWeight: 500, margin: '0 0 12px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6}}>
        2. hét eredményei
      </h2>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 22}}>
        {[
          { v: '12', l: 'Bizonyíték', s: '4 csapattól' },
          { v: '4 / 4', l: 'Csapat dolgozott', s: 'minden csapat aktív' },
          { v: '86%', l: 'Reflexió-arány', s: 'csapatonkénti átlag' },
          { v: '3', l: 'Visszajelzésre vár', s: '3. heti mérések' },
        ].map((k, i) => (
          <div key={i} style={{border: '1px solid #e5e5e5', borderRadius: 10, padding: '12px 14px'}}>
            <div style={{fontSize: 22, fontWeight: 500, color: '#171717', letterSpacing: '-0.3px', lineHeight: 1}}>{k.v}</div>
            <div style={{fontSize: 11, color: '#525252', marginTop: 4, fontWeight: 500}}>{k.l}</div>
            <div style={{fontSize: 10, color: '#737373', marginTop: 2}}>{k.s}</div>
          </div>
        ))}
      </div>

      {/* AI summary */}
      <h2 style={{fontSize: 16, fontWeight: 500, margin: '0 0 12px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6}}>
        AI minőségi jegyzet
      </h2>
      <div style={{background: '#f5f5f5', borderRadius: 10, padding: 14, fontSize: 12, lineHeight: '18px', marginBottom: 22, color: '#262626'}}>
        Három csapat (Árnyékkommandó, Kőkutatók, Felhőfigyelők) bizonyítékainak közös mintája:
        mindegyik csapat <strong>bizonytalan a mérés pontosságában</strong>. Az érvelés iránya és a reflexió erős,
        de a módszertan dokumentálása hiányos. Megfontolásra: egy 15 perces „Mérési gyorstalpaló" mikro-matrica
        beillesztése a 3. hét elé. <em>Az AI nem dönt — javaslat tanári döntéshez.</em>
      </div>

      {/* Team submissions */}
      <h2 style={{fontSize: 16, fontWeight: 500, margin: '0 0 12px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6}}>
        Csapatonkénti összefoglaló
      </h2>
      <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 11.5}}>
        <thead>
          <tr style={{background: '#fafafa', borderBottom: '1px solid #e5e5e5'}}>
            <th style={{textAlign: 'left', padding: 8, fontWeight: 600, color: '#525252', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5}}>Csapat</th>
            <th style={{textAlign: 'left', padding: 8, fontWeight: 600, color: '#525252', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5}}>Választott fókusz</th>
            <th style={{textAlign: 'left', padding: 8, fontWeight: 600, color: '#525252', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5}}>Bizonyíték</th>
            <th style={{textAlign: 'left', padding: 8, fontWeight: 600, color: '#525252', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5}}>Állapot</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Árnyékkommandó', 'Növényzet és árnyék', '3', 'Jó iramban, reflexió erős'],
            ['Kőkutatók', 'Burkolatok hatása', '3', 'Eszközhasználatban bizonytalan'],
            ['Felhőfigyelők', 'Időjárás és mikroklíma', '3', 'Adatközlés pontatlan'],
            ['Vízkereső expedíció', 'Víz és párolgás', '3', 'Erős kísérleti megközelítés'],
          ].map((r, i) => (
            <tr key={i} style={{borderBottom: '1px solid #f5f5f5'}}>
              <td style={{padding: 8, fontWeight: 500}}>{r[0]}</td>
              <td style={{padding: 8, color: '#525252'}}>{r[1]}</td>
              <td style={{padding: 8, textAlign: 'left'}}>{r[2]}</td>
              <td style={{padding: 8, color: '#525252'}}>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PrintPage>
  );
}

function PrintPage2() {
  return (
    <PrintPage pageNum={2} totalPages={2}>
      <h2 style={{fontSize: 16, fontWeight: 500, margin: '0 0 12px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6}}>
        Következő hét — tanári döntések
      </h2>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22}}>
        {[
          { n: 1, t: '„Mérési gyorstalpaló" mikro-matrica – elfogadás vagy elutasítás', d: 'AI javaslat. Beillesztés esetén a 2. hét végére kerül, 15 perces gyors gyakorlatként.', state: 'AI javaslat' },
          { n: 2, t: '3 csapat visszajelzésére válaszolni', d: 'Mérési adatok körüli bizonytalanság — javasolt visszaküldés javításra (Árnyékkommandó, Felhőfigyelők), és lezárás (Vízkereső expedíció).', state: 'Vár visszajelzésre' },
          { n: 3, t: 'Iskolavezetés meghívása a 4. heti záró bemutatóra', d: 'Külső közönség nélkül a projekt nem zárul nyilvánosan. Javasolt e-mail piszkozat csatolva.', state: 'Tervezés' },
        ].map(s => (
          <div key={s.n} style={{display: 'flex', gap: 12, padding: 12, border: '1px solid #e5e5e5', borderRadius: 10}}>
            <div style={{width: 28, height: 28, borderRadius: 999, background: '#9333ea', color: 'white', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0}}>{s.n}</div>
            <div style={{flex: 1}}>
              <div style={{fontSize: 12.5, fontWeight: 500, color: '#171717', marginBottom: 3}}>{s.t}</div>
              <div style={{fontSize: 11.5, color: '#525252', lineHeight: '16px'}}>{s.d}</div>
            </div>
            <div style={{
              alignSelf: 'flex-start',
              fontSize: 9, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
              padding: '4px 8px', borderRadius: 999,
              background: '#f4e8ff', color: '#6821a8',
            }}>{s.state}</div>
          </div>
        ))}
      </div>

      <h2 style={{fontSize: 16, fontWeight: 500, margin: '0 0 12px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6}}>
        Pedagógiai megfigyelés — saját jegyzetnek
      </h2>
      <div style={{background: '#fbfaf6', border: '1px solid #e5e5e5', borderRadius: 10, padding: 16, marginBottom: 22}}>
        <div style={{fontSize: 12.5, lineHeight: '20px', color: '#262626', marginBottom: 10}}>
          A 2. heti szerepkártya-vita látványosan működött: 3 csapat nézőpontváltást írt a reflexióban.
          A perspektíva-matricához érdemes lehet a következő évben még egy alacsony küszöbű belépőt készíteni
          a kevésbé szóbeli diákoknak (pl. érvtérkép-sablon képes példákkal).
        </div>
        <div style={{fontSize: 11, color: '#737373', fontStyle: 'italic'}}>— Generált jegyzet az AI által, tanári döntésre vár.</div>
      </div>

      <h2 style={{fontSize: 16, fontWeight: 500, margin: '0 0 12px', borderBottom: '1px solid #e5e5e5', paddingBottom: 6}}>
        Kreatív tanulási ellenőrző — pillanatkép
      </h2>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16}}>
        {[
          { d: 'Tanulói aktivitás', s: 'Rendben', c: '#10b981' },
          { d: 'Választási lehetőség', s: 'Rendben', c: '#10b981' },
          { d: 'Nyílt végű probléma', s: 'Rendben', c: '#10b981' },
          { d: 'Látható produktum', s: 'Rendben', c: '#10b981' },
          { d: 'Bizonyítékgyűjtés', s: 'Figyelmet kér', c: '#d97706' },
          { d: 'Együttműködés', s: 'Rendben', c: '#10b981' },
          { d: 'Visszajelzés és javítás', s: 'Rendben', c: '#10b981' },
          { d: 'Reflexió', s: 'Rendben', c: '#10b981' },
          { d: 'Low-resource változat', s: 'Figyelmet kér', c: '#d97706' },
          { d: 'Tanári kontroll', s: 'Rendben', c: '#10b981' },
        ].map((q, i) => (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid #e5e5e5', borderRadius: 8, fontSize: 11}}>
            <div style={{width: 8, height: 8, borderRadius: 999, background: q.c}} />
            <div style={{flex: 1}}>{q.d}</div>
            <div style={{fontSize: 10, color: q.c, fontWeight: 500}}>{q.s}</div>
          </div>
        ))}
      </div>

      <div style={{fontSize: 11, color: '#525252', fontStyle: 'italic', textAlign: 'center', padding: '12px 0', borderTop: '1px dashed #e5e5e5'}}>
        „A matrica nem jutalom, hanem egy lezárt tanulási epizód bizonyítékkal és reflexióval."
      </div>
    </PrintPage>
  );
}

Object.assign(window, { PrintPreview });
