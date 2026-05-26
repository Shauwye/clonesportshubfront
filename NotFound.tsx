import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Home, Search } from 'lucide-react';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="text-center max-w-md">
        <div className="text-9xl font-bold text-blue-600 mb-4">404</div>
        <h1 className="text-3xl font-bold mb-4">Página no encontrada</h1>
        <p className="text-gray-600 mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button className="w-full sm:w-auto">
              <Home className="mr-2 size-4" />
              Volver al Inicio
            </Button>
          </Link>
          <Link to="/agenda">
            <Button variant="outline" className="w-full sm:w-auto">
              <Search className="mr-2 size-4" />
              Ver Partidos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
