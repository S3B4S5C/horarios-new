import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import BootstrapClient from '@/components/BootstrapClient';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = { title: 'UNO Admin', description: 'Administración universitaria' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <BootstrapClient /> {/* carga JS de bootstrap en cliente */}
      </body>
    </html>
  );
}
