import { RouterProvider } from 'react-router';
import { LazyMotion, domAnimation } from 'framer-motion';
import { router } from './Routes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BreadcrumbProvider } from './Lib/BreadcrumbContext';
import { ToastProvider } from './components/ui/Toast';
import { LoadingBar } from './components/ui/LoadingBar';


function App() {
  return (
    <ErrorBoundary>
      <LazyMotion features={domAnimation}>
        <BreadcrumbProvider>
          <ToastProvider>
            <LoadingBar />
            <RouterProvider router={router} />
          </ToastProvider>
        </BreadcrumbProvider>
      </LazyMotion>
    </ErrorBoundary>
  );
}

export default App;
