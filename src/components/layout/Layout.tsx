import { ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex flex-col md:flex-row pt-16">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-white md:rounded-tl-xl shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
