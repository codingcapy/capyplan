import { useEffect, useRef, useState } from "react";
import useAuthStore from "../store/AuthStore";
import logo from "/capyness.png";
import { PiCaretDownBold } from "react-icons/pi";
import { getPlansQueryOptions, useCreatePlanMutation } from "../lib/api/plans";
import { useQuery } from "@tanstack/react-query";

export function LeftNav() {
  const { user } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
  } = useQuery(getPlansQueryOptions());
  const { mutate: createPlan, isPending: createPlanPending } =
    useCreatePlanMutation();

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
        <div className="relative bg-[#303030] rounded m-2 px-3 py-2 max-h-[175px] overflow-y-auto">
          <div className="py-1 cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300">
            {user && user.username}'s plan
          </div>
          {plansLoading ? (
            <div>Loading plans...</div>
          ) : plansError ? (
            <div>Error loading plans</div>
          ) : plans ? (
            plans.map((p) => (
              <div className="py-1 cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300">
                {p.title}'s plan
              </div>
            ))
          ) : (
            <div></div>
          )}
          <div
            onClick={() => setShowCreatePlanModal(!showCreatePlanModal)}
            className="sticky py-1 bottom-0 bg-[#303030] cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300"
          >
            + create new plan
          </div>
        </div>
      )}
      {showCreatePlanModal && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#222222] p-6 rounded shadow-lg w-[90%] max-w-md text-center z-100">
          <div className="text-xl font-bold mb-5">
            Create a new financial plan
          </div>
          <form action="" className="flex flex-col">
            <label htmlFor="" className="text-left mb-2">
              Financial plan name
            </label>
            <input
              type="text"
              className="border border-[#909090] rounded p-1 mb-2"
            />
            <div className="flex justify-end">
              <div
                onClick={() => setShowCreatePlanModal(false)}
                className="px-3 py-1 mx-1 cursor-pointer"
              >
                CANCEL
              </div>
              <button
                onClick={() => createPlan({ title: "" })}
                className="px-3 py-1 mx-1 bg-cyan-500 rounded"
              >
                CREATE
              </button>
            </div>
          </form>
        </div>
      )}
      {showCreatePlanModal && (
        <div className="fixed inset-0 bg-black opacity-50 z-90"></div>
      )}
    </div>
  );
}
