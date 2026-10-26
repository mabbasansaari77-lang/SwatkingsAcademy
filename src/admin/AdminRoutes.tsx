import { Route, Routes } from 'react-router';
import { AdminLayout } from './AdminLayout';
import { CrudPage } from './CrudPage';
import Dashboard from './Dashboard';
import GalleryAdmin from './GalleryAdmin';
import Login from './Login';
import Messages from './Messages';
import PageBannersAdmin from './PageBannersAdmin';
import PlayerMediaAdmin from './PlayerMediaAdmin';
import Registrations from './Registrations';
import ReviewsAdmin from './ReviewsAdmin';
import { RequireAdmin } from './RequireAdmin';
import { RESOURCES } from './resources';
import SettingsAdmin from './SettingsAdmin';

export default function AdminRoutes() {
  return (
    <>
      <title>Admin | Swat Kings Cricket Academy</title>
      <meta name="robots" content="noindex, nofollow" />
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="messages" element={<Messages />} />
          <Route path="reviews" element={<ReviewsAdmin />} />
          {RESOURCES.map((r) => (
            <Route key={r.path} path={r.path} element={<CrudPage key={r.path} resource={r} />} />
          ))}
          <Route path="players/:id/media" element={<PlayerMediaAdmin />} />
          <Route path="gallery" element={<GalleryAdmin />} />
          <Route path="banners" element={<PageBannersAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="*" element={<p className="p-8">This admin page does not exist.</p>} />
        </Route>
      </Routes>
    </>
  );
}
