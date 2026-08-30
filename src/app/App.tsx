import { BreakdownSection } from '@/features/expense-breakdown';
import { TransactionList } from '@/features/transaction-list';
import { cn } from '@/shared/lib/cn';

import { AppBackground } from './ui/AppBackground';
import { AppProviders } from './providers/AppProviders';
import { TopBar } from './ui/TopBar';
import { PAGE_CONTAINER } from './ui/pageContainer';

const App = () => (
  <AppProviders>
    <div className="min-h-dvh text-text-primary">
      <AppBackground />
      <TopBar />
      <main
        className={cn(
          PAGE_CONTAINER,
          'grid grid-cols-1 gap-3 py-4 sm:gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-stretch lg:gap-8',
        )}
      >
        <BreakdownSection />
        <TransactionList />
      </main>
    </div>
  </AppProviders>
);

export default App;
