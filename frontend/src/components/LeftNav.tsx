import { useEffect, useRef, useState } from "react";
import useAuthStore from "../store/AuthStore";
import logo from "/capyness.png";
import { PiCaretDownBold } from "react-icons/pi";

export function LeftNav() {
  const { user } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen bg-[#101010] w-[250px]">
      <div className="flex items-center p-5 mb-5">
        <img src={logo} alt="" className="w-[25px]" />
        <div className="ml-2 text-lg">CapyPlan</div>
      </div>
      <div className="px-5">Financial Plan</div>
      <div
        ref={menuRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="border border-[#555555] rounded m-2 px-3 py-2 flex cursor-pointer hover:bg-[#202020] transition-all ease-in-out duration-300"
      >
        <div className="w-[175px] line-clamp-1">
          {user && user.username}'s plan
        </div>
        <div className="ml-5 mt-1">
          <PiCaretDownBold />
        </div>
      </div>
      {showDropdown && (
        <div className="bg-[#303030] rounded m-2 px-3 py-2 "></div>
      )}
    </div>
  );
}
