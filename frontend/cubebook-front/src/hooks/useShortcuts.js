import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Global keyboard shortcuts — matches Tally Prime exactly.
 * F4=Contra, F5=Payment, F6=Receipt, F7=Journal, F8=Sales, F9=Purchase
 * Alt+D=DayBook, Alt+M=Ledgers, Alt+G=Group Masters
 */
export function useShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      // Don't fire when user is typing inside an input/textarea
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      switch (e.key) {
        case "F4": e.preventDefault(); navigate('/cubebook/vouchers?type=Contra');   break;
        case "F5": e.preventDefault(); navigate('/cubebook/vouchers?type=Payment');  break;
        case "F6": e.preventDefault(); navigate('/cubebook/vouchers?type=Receipt');  break;
        case "F7": e.preventDefault(); navigate('/cubebook/vouchers?type=Journal');  break;
        case "F8": e.preventDefault(); navigate('/cubebook/vouchers?type=Sales');    break;
        case "F9": e.preventDefault(); navigate('/cubebook/vouchers?type=Purchase'); break;
        default:
          if (e.altKey && e.key === "d") { e.preventDefault(); navigate("/cubebook/day-book"); }
          if (e.altKey && e.key === "m") { e.preventDefault(); navigate("/cubebook/ledgers"); }
          if (e.altKey && e.key === "g") { e.preventDefault(); navigate("/cubebook/masters/group"); }
          if (e.altKey && e.key === "v") { e.preventDefault(); navigate("/cubebook/vouchers"); }
          if (e.altKey && e.key === "r") { e.preventDefault(); navigate("/cubebook/reports"); }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
}
