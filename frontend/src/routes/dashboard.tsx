import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useAuthStore from "../store/AuthStore";
import { useEffect } from "react";
import { LeftNav } from "../components/LeftNav";
import { TopNav } from "../components/TopNav";
import { useQuery } from "@tanstack/react-query";
import { getPlanByIdQueryOptions } from "../lib/api/plans";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const {
    data: plan,
    isLoading: planLoading,
    error: planError,
  } = useQuery(
    getPlanByIdQueryOptions((user && user.currentPlan.toString()) || "0"),
  );

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user]);

  return (
    <div className="bg-[#242424] text-white min-h-screen p-2">
      <LeftNav />
      <TopNav />
      {planLoading ? (
        <div className="pl-[300px] pt-4 text-lg">Loading...</div>
      ) : planError ? (
        <div className="pl-[300px] pt-4 text-lg">
          There was an error loading your plan. Please try again later.
        </div>
      ) : (
        <div className="pl-[240px]">
          <div className="pl-5 pt-10 text-4xl font-bold">
            {plan ? plan.title : "No plan found"}
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Income</div>
              <div className="pt-5">+ Add income</div>
              <div className="pt-5">Total income: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Expenditure</div>
              <div className="pt-5">+ Add expenditure</div>
              <div className="pt-5">Total expenditure: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5">Total cashflow: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Assets</div>
              <div className="pt-5">+ Add asset</div>
              <div className="pt-5">Total assets: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Liabilities</div>
              <div className="pt-5">+ Add liability</div>
              <div className="pt-5">Total liabilities: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5">Total net worth: $0</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
