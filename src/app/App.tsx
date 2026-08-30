import { BreakdownSection } from '@/features/expense-breakdown';

const App = () => (
  <main className="min-h-dvh bg-background pb-8 text-text-primary">
    <div className="mx-auto grid w-full max-w-md grid-cols-1 gap-3 px-4 py-4 sm:max-w-2xl sm:gap-6 sm:px-6 md:max-w-3xl lg:max-w-6xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-8 lg:px-8 xl:max-w-7xl">
      <BreakdownSection />
    </div>
  </main>
);

export default App;
