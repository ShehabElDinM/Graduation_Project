import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Reports from '../pages/Reports';
import About from '../pages/About';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/reports',
    element: <Reports />
  },
  {
    path: '/about',
    element: <About />
  }
]);

export default router;
