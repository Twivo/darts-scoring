import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { RosterProvider } from './store/RosterContext';
import { ConfirmProvider } from './components/ui/ConfirmProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <RosterProvider>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </RosterProvider>
    </HashRouter>
  </StrictMode>,
);
