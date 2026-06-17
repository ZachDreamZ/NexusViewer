import { FileProvider } from './context/FileContext';
import { ToastProvider } from './context/Toast';
import { Layout } from './components/Layout';
import { useTheme } from './hooks/useTheme';

function App() {
  const [darkMode, setDarkMode] = useTheme();
  return (
    <FileProvider>
      <ToastProvider>
        <Layout darkMode={darkMode} setDarkMode={setDarkMode} />
      </ToastProvider>
    </FileProvider>
  );
}

export default App;
