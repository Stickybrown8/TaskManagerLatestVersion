import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Clients from './pages/Clients';
import Login from './pages/Login';
// Ajoute ici d'autres pages

function App() {
  return (
    <Routes>
      {/* Route publique */}
      <Route path="/login" element={<Login />} />

      {/* Toutes les routes privées passent ici */}
      <Route element={<PrivateRoute />}>
        <Route path="/clients" element={<Clients />} />
        {/* Ajoute d'autres routes privées ici */}
      </Route>

      {/* Route par défaut ou 404, facultatif */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}

export default App;
