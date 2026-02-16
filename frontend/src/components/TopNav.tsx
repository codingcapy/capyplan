import { useEffect, useRef, useState } from "react";
import useAuthStore from "../store/AuthStore";

export function TopNav() {
  const { user, logoutService } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div
      ref={menuRef}
      className="fixed top-0 left-0 p-5 w-screen flex justify-between"
    >
      <div></div>
      <div onClick={() => setShowMenu(!showMenu)} className="cursor-pointer">
        {user && user.username}
      </div>
      {showMenu && (
        <div className="absolute top-[55px] right-1 bg-[#404040] px-5 py-2 rounded">
          <div onClick={logoutService} className="cursor-pointer">
            Logout
          </div>
        </div>
      )}
    </div>
  );
}
