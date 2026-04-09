import { RouterProvider } from 'react-router';
import { router } from './Routes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BreadcrumbProvider } from './Lib/BreadcrumbContext';
import { ToastProvider } from './components/ui/Toast';
import { LoadingBar } from './components/ui/LoadingBar';


function App() {
  return (
    <ErrorBoundary>
      <BreadcrumbProvider>
        <ToastProvider>
          <LoadingBar />
          <RouterProvider router={router} />
        </ToastProvider>
      </BreadcrumbProvider>
    </ErrorBoundary>
  );
}

export default App;
