import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import GlobalDashboard from './components/GlobalDashboard';
import AuditPanel from './components/AuditPanel';
import ValuebetsAnalysis from './components/ValuebetsAnalysis';
import ExecutionQuality from './components/ExecutionQuality';
import OperationalCenter from './components/OperationalCenter';
import OperationalNetwork from './components/OperationalNetwork';
import OperatorTerminal from './components/OperatorTerminal';
import OrchestratorTerminal from './components/OrchestratorTerminal';
// import OrchestratorAdmin from './components/OrchestratorAdmin'; // Deprecated
import FinanceModule from './components/FinanceModule';
import Layout from './components/Layout';

// Placeholder for screens under construction (Ops Sub-pages)
const PlaceholderPage: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
    <div className="bg-primary/10 p-6 rounded-full mb-6 animate-pulse">
      <span className="material-symbols-outlined text-6xl text-primary">construction</span>
    </div>
    <h1 className="text-3xl font-black text-white mb-2">{title}</h1>
    <p className="text-text-secondary max-w-md">{subtitle}</p>
    <div className="mt-8 p-4 bg-surface-dark border border-border-dark rounded-xl max-w-lg w-full">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-warning">warning</span>
        <span className="text-sm font-bold text-white">M├│dulo en Desarrollo</span>
      </div>
      <p className="text-xs text-text-secondary text-left">
        Esta vista est├í en cola de implementaci├│n. La navegaci├│n y estructura de rutas ya est├ín activas.
      </p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* 1. Vista CEO */}
        <Route path="/ceo" element={
          <Layout>
            <GlobalDashboard />
          </Layout>
        } />

        {/* 2. Control Global (Ex-Auditor├¡a KPI) */}
        <Route path="/control-global" element={
          <Layout>
            <AuditPanel />
          </Layout>
        } />

        {/* 3. Operaciones */}

        {/* 3.1 Picks EV+ */}
        <Route path="/ops/picks/analysis" element={
          <Layout>
            <PlaceholderPage
              title="Picks EV+ | An├ílisis"
              subtitle="M├│dulo de gesti├│n de picks con valor esperado positivo, filtros avanzados y backtesting."
            />
          </Layout>
        } />
        <Route path="/ops/picks/quality" element={
          <Layout>
            <PlaceholderPage
              title="Picks EV+ | Calidad (EQS)"
              subtitle="Auditor├¡a de ejecuci├│n, slippage y m├®tricas de calidad para la vertical de Picks."
            />
          </Layout>
        } />

        {/* 3.2 Valuebets */}
        <Route path="/ops/valuebets/analysis" element={
          <Layout>
            <ValuebetsAnalysis />
          </Layout>
        } />
        <Route path="/ops/valuebets/quality" element={
          <Layout>
            <ExecutionQuality />
          </Layout>
        } />

        {/* 3.3 SurebettingEC */}
        <Route path="/ops/surebetting/analysis" element={
          <Layout>
            <PlaceholderPage
              title="SurebettingEC | An├ílisis"
              subtitle="Monitor de arbitraje deportivo, gesti├│n de cuentas y esc├íner de oportunidades."
            />
          </Layout>
        } />
        <Route path="/ops/surebetting/quality" element={
          <Layout>
            <PlaceholderPage
              title="SurebettingEC | Calidad"
              subtitle="M├®tricas operativas, tiempos de cierre y eficiencia de capital en arbitraje."
            />
          </Layout>
        } />

        {/* 4. Centro Operativo */}
        <Route path="/centro-operativo" element={
          <Layout>
            <OperationalCenter />
          </Layout>
        } />

        {/* 5. Red Operativa */}
        <Route path="/red-operativa" element={
          <Layout>
            <OperationalNetwork />
          </Layout>
        } />

        {/* 5.1 Terminal de Operador */}
        <Route path="/terminal-operador" element={
          <Layout>
            <OperatorTerminal />
          </Layout>
        } />
        <Route path="/ops/operator" element={
          <Layout>
            <OperatorTerminal />
          </Layout>
        } />

        {/* 5.2 ORCHESTRATOR PANEL (Refactored) */}
        <Route path="/ops/orchestrator" element={
          <Layout>
            <OrchestratorTerminal />
          </Layout>
        } />
        {/* Legacy redirects */}
        <Route path="/orchestrator" element={<Navigate to="/ops/orchestrator" replace />} />
        <Route path="/orchestrator/admin" element={<Navigate to="/ops/orchestrator" replace />} />

        {/* 6. Finanzas */}
        <Route path="/finanzas" element={
          <Layout>
            <FinanceModule />
          </Layout>
        } />

        {/* Redirects */}
        <Route path="/audit" element={<Navigate to="/control-global" replace />} />
        <Route path="/dashboard" element={<Navigate to="/ceo" replace />} />
        <Route path="*" element={<Navigate to="/ceo" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
