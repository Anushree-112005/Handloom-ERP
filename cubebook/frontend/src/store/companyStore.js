import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCompanyStore = create(
  persist(
    (set) => ({
      activeCompany: null,
      activeFy: null,
      
      setCompany: (company) => set({ 
        activeCompany: company,
        activeFy: company?.current_fy || null 
      }),
      
      setFinancialYear: (fy) => set({ activeFy: fy }),
      
      clearCompany: () => set({ activeCompany: null, activeFy: null })
    }),
    {
      name: 'cubebook-storage',
    }
  )
);

export default useCompanyStore;
