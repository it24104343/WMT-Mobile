import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto bg-white dark:bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
