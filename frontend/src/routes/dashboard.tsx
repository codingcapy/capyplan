import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useAuthStore from "../store/AuthStore";
import { useEffect, useState } from "react";
import { LeftNav } from "../components/LeftNav";
import { TopNav } from "../components/TopNav";
import { useQuery } from "@tanstack/react-query";
import { getPlanByIdQueryOptions } from "../lib/api/plans";
import { CreateIncome } from "../components/CreateIncome";

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
  const [createIncomeMode, setCreateIncomeMode] = useState(false);
  const [createExpenditureMode, setCreateExpenditureMode] = useState(false);
  const [createAssetMode, setCreateAssetMode] = useState(false);
  const [createLiabilityMode, setCreateLiabilityMode] = useState(false);
  const [createFinancialGoalMode, setCreateFinancialGoalMode] = useState(false);

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user]);

  return (
    <div className="bg-[#242424] text-white min-h-screen p-2">
      <LeftNav />
      <TopNav />
      {planLoading ? (
        <div className="sm:pl-[300px] pt-4 text-lg">Loading...</div>
      ) : planError ? (
        <div className="sm:pl-[300px] pt-4 text-lg">
          There was an error loading your plan. Please try again later.
        </div>
      ) : (
        <div className="sm:pl-[240px]">
          <div className="pl-5 pt-10 text-4xl font-bold">
            {plan ? plan.title : "No plan found"}
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Income</div>
              <div className="flex justify-between my-2">
                <div className="w-[25%]">Company</div>
                <div className="w-[25%]">Position</div>
                <div className="w-[25%]">Amount (Monthly)</div>
                <div className="w-[25%]">Tax %</div>
                <div className="w-[70px]"></div>
              </div>
              {createIncomeMode ? (
                <CreateIncome setCreateIncomeMode={setCreateIncomeMode} />
              ) : (
                <div
                  onClick={() => setCreateIncomeMode(true)}
                  className="mt-5 py-1 w-[130px] text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
                >
                  + Add income
                </div>
              )}
              <div className="pt-5">Total income: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Expenditure</div>
              <div className="flex justify-between my-2">
                <div className="w-[50%]">Name</div>
                <div className="w-[50%]">Amount (Monthly)</div>
                <div className="w-17.5"></div>
              </div>
              <div className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded">
                + Add expenditure
              </div>
              <div className="pt-5">Total expenditure: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] bg-[#303030] pb-5">
            <div className="pl-5">
              <div className="pt-5 font-bold">Total cashflow: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Assets</div>
              <div className="flex justify-between my-2">
                <div className="w-[33%]">Name</div>
                <div className="w-[33%]">Value</div>
                <div className="w-[33%]">Return on invesment %</div>
                <div className="w-17.5"></div>
              </div>
              <div className="mt-5 py-1 w-32.5 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded">
                + Add asset
              </div>
              <div className="pt-5">Total assets: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Liabilities</div>
              <div className="flex justify-between my-2">
                <div className="w-[33%]">Name</div>
                <div className="w-[33%]">Amount</div>
                <div className="w-[33%]">Monthly Interest %</div>
                <div className="w-17.5"></div>
              </div>
              <div className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded">
                + Add liability
              </div>
              <div className="pt-5">Total liabilities: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5 bg-[#303030]">
            <div className="pl-5">
              <div className="pt-5 font-bold">Total net worth: $0</div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Financial Goals</div>
              <div className="flex justify-between my-2">
                <div className="w-[33%]">Name</div>
                <div className="w-[33%]">Amount</div>
                <div className="w-[33%]">Target Date</div>
                <div className="w-17.5"></div>
              </div>
              <div className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded">
                + Add financial goal
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
