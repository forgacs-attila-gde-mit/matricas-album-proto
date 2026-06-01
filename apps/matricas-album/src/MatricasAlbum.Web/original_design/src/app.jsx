/* global React, ReactDOM */
const { StrictMode } = React;

function TeacherApp() {
  const { page } = useStore();
  const pages = {
    home:     { node: <DashboardPage />,  crumbs: [{ label: 'Albumjaim', strong: true }] },
    plan:     { node: <AlbumPlanPage />,   crumbs: [{ label: 'Albumjaim' }, { label: 'Városi mikroklíma nyomában', strong: true }] },
    stickers: { node: <StickersPage />,    crumbs: [{ label: 'Albumjaim' }, { label: 'Matricák', strong: true }] },
    teams:    { node: <TeamsPage />,       crumbs: [{ label: 'Albumjaim' }, { label: 'Csapatok', strong: true }] },
    evidence: { node: <EvidencePage />,    crumbs: [{ label: 'Albumjaim' }, { label: 'Evidence-portfólió', strong: true }] },
    feedback: { node: <FeedbackPage />,    crumbs: [{ label: 'Albumjaim' }, { label: 'Visszajelzési sor', strong: true }] },
    quality:  { node: <QualityPage />,     crumbs: [{ label: 'Albumjaim' }, { label: 'Kreatív tanulási ellenőrző', strong: true }] },
    diff:     { node: <DiffPage />,        crumbs: [{ label: 'Albumjaim' }, { label: 'Differenciálás', strong: true }] },
    closure:  { node: <ClosurePage />,     crumbs: [{ label: 'Albumjaim' }, { label: 'Projektzárás', strong: true }] },
  };
  const current = pages[page] || pages.home;
  return (
    <div className="app">
      <TeacherSidebar />
      <div className="main">
        <TopBar crumbs={current.crumbs} />
        <div className="content">{current.node}</div>
      </div>
      <StickerDetailDrawer />
      <FeedbackDrawer />
      <AlbumWizard />
    </div>
  );
}

function StudentApp() {
  const { studentPage } = useStore();
  const crumbs = [{ label: 'Diák nézet' }, { label: '7.B – Árnyékkommandó', strong: true }];
  return (
    <div className="app">
      <StudentSidebar />
      <div className="main">
        <TopBar crumbs={crumbs} />
        <div style={{flex: 1, overflow: 'auto', background: 'transparent'}}>
          <StudentAlbumPage />
        </div>
      </div>
      <StickerDetailDrawer />
      <FeedbackDrawer />
    </div>
  );
}

function ClosureApp() {
  return (
    <div className="app">
      <TeacherSidebar />
      <div className="main">
        <TopBar crumbs={[{ label: 'Albumjaim' }, { label: 'Projektzárás', strong: true }]} />
        <div className="content"><ClosurePage /></div>
      </div>
    </div>
  );
}

function App() {
  const { role } = useStore();
  return (
    <>
      {role === 'teacher' && <TeacherApp />}
      {role === 'student' && <StudentApp />}
      {role === 'closure' && <ClosureApp />}
      <PrintPreview />
      <Toast />
    </>
  );
}

function Root() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
