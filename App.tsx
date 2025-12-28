import React from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useNavStore } from './store/useNavStore';
import { DashboardView } from './views/DashboardView';
import { CodeView } from './views/CodeView';
import { BrainView } from './views/BrainView';
import { ScheduleView } from './views/ScheduleView';
import { ZenView } from './views/ZenView';
import { GlobalWidgets } from './components/GlobalWidgets';

const App: React.FC = () => {
  const activeTab = useNavStore((state) => state.activeTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'code':
        return <CodeView />;
      case 'brain':
        return <BrainView />;
      case 'schedule':
        return <ScheduleView />;
      case 'zen':
        return <ZenView />;
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      {renderContent()}
      <GlobalWidgets />
    </AppLayout>
  );
};

export default App;