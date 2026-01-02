import { HashRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleClick = () => {
      if (!navigator.onLine) {
        alert("You are offline. Please connect to the network.");
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  return (
    <HashRouter>
      {!isOnline && <LinearProgress color="error" />}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <AppRoutes />
    </HashRouter>
  );
}

export default App;
