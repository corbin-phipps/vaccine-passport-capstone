import { useContext, createContext } from "react";
/* passes the session related info to all of our containers */
export const AppContext = createContext(null);

export function useAppContext() {
  return useContext(AppContext);
}