import React from 'react';
import Navbar from '../components/Navbar.jsx';
import Sidebar from '../components/Sidebar.jsx';
import '../styles/layout.css';

export default function MainLayout({ children }) {
  return (
    <div className="main-layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
