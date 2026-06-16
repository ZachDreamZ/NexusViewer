import { useState, useEffect } from 'react';
import { FileProvider } from './context/FileContext';
import { ToastProvider } from './context/Toast';
import { Layout } from './components/Layout';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('nexusviewer.theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('nexusviewer.theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <FileProvider>
      <ToastProvider>
        <Layout
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      </ToastProvider>
    </FileProvider>
  );
}

export default App;
