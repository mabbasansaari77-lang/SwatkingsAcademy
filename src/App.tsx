import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { Layout } from './components/layout/Layout';
import { Loading } from './components/ui/States';
import About from './pages/About';
import Coaches from './pages/Coaches';
import Contact from './pages/Contact';
import Faq from './pages/Faq';
import Fixtures from './pages/Fixtures';
import Gallery from './pages/Gallery';
import Home from './pages/Home';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import NotFound from './pages/NotFound';
import PlayerDetail from './pages/PlayerDetail';
import Privacy from './pages/Privacy';
import Programmes from './pages/Programmes';
import Register from './pages/Register';
import Teams from './pages/Teams';

// The admin area is loaded only when someone visits /admin, keeping the
// public site small and fast.
const AdminRoutes = lazy(() => import('./admin/AdminRoutes'));

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="programmes" element={<Programmes />} />
        <Route path="coaches" element={<Coaches />} />
        <Route path="teams" element={<Teams />} />
        <Route path="players/:id" element={<PlayerDetail />} />
        <Route path="fixtures" element={<Fixtures />} />
        <Route path="news" element={<News />} />
        <Route path="news/:slug" element={<NewsArticle />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="register" element={<Register />} />
        <Route path="contact" element={<Contact />} />
        <Route path="faq" element={<Faq />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense
            fallback={
              <div className="p-8">
                <Loading label="Loading admin" />
              </div>
            }
          >
            <AdminRoutes />
          </Suspense>
        }
      />
    </Routes>
  );
}
