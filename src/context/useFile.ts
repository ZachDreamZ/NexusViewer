import { useContext } from 'react';
import { FileContext, type FileContextType } from './fileContextDef';

export const useFile = (): FileContextType => {
  const context = useContext(FileContext);
  if (!context) throw new Error('useFile must be used within a FileProvider');
  return context;
};
