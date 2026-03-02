import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useAuthStore from "../store/AuthStore";
import { useEffect, useState } from "react";
import { LeftNav } from "../components/LeftNav";
import { TopNav } from "../components/TopNav";
import { useQuery } from "@tanstack/react-query";
import { getPlanByIdQueryOptions } from "../lib/api/plans";
import { CreateIncome } from "../components/CreateIncome";
import { CreateExpenditure } from "../components/CreateExpenditure";
import { getIncomesByPlanIdQueryOptions } from "../lib/api/incomes";
import { IncomeItem } from "../components/IncomeItem";

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
  const {
    data: incomes,
    isLoading: incomesLoading,
    error: incomesError,
  } = useQuery({
    ...getIncomesByPlanIdQueryOptions(plan?.planId ?? 0),
    enabled: !!plan?.planId,
  });
  const [showRedirectModal, setShowRedirectModal] = useState(false);

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
      ) : plan ? (
        <div className="sm:pl-[240px]">
          <div className="pl-5 pt-10 text-4xl font-bold">{plan.title}</div>
          <div className="border-b border-b-[#777777] pb-5">
            {incomesLoading ? (
              <div>Loading income items...</div>
            ) : incomesError ? (
              <div>Error loading income items</div>
            ) : incomes ? (
              <div className="pl-5">
                <div className="pt-5 text-3xl font-bold">Income</div>
                <div className="flex justify-between my-2">
                  <div className="w-[25%]">Company</div>
                  <div className="w-[25%]">Position</div>
                  <div className="w-[25%]">Amount (Monthly)</div>
                  <div className="w-[25%]">Tax %</div>
                  <div className="w-[70px]"></div>
                </div>
                {incomes.map((income) => (
                  <IncomeItem income={income} />
                ))}
                {createIncomeMode ? (
                  <CreateIncome
                    setCreateIncomeMode={setCreateIncomeMode}
                    plan={plan}
                  />
                ) : (
                  <div
                    onClick={() => setCreateIncomeMode(true)}
                    className="mt-5 py-1 w-[130px] text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
                  >
                    + Add income
                  </div>
                )}
                <div className="pt-5">
                  Total income: $
                  {incomes
                    .reduce(
                      (sum, income) =>
                        sum +
                        ((income.amount / 100) * (100 - income.tax / 100)) /
                          100,
                      0,
                    )
                    .toFixed(2)}
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
          <div className="border-b border-b-[#777777] pb-5">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Expenditure</div>
              <div className="flex justify-between my-2">
                <div className="w-[50%]">Name</div>
                <div className="w-[50%]">Amount (Monthly)</div>
                <div className="w-17.5"></div>
              </div>
              {createExpenditureMode ? (
                <CreateExpenditure
                  setCreateExpenditureMode={setCreateExpenditureMode}
                />
              ) : (
                <div
                  onClick={() => setCreateExpenditureMode(true)}
                  className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
                >
                  + Add expenditure
                </div>
              )}
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
              <div
                onClick={() => setCreateAssetMode(true)}
                className="mt-5 py-1 w-32.5 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
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
              <div
                onClick={() => setCreateLiabilityMode(true)}
                className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
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
              <div
                onClick={() => setCreateFinancialGoalMode(true)}
                className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
                + Add financial goal
              </div>
            </div>
          </div>
          <div className="border-b border-b-[#777777] pb-5 bg-[#303030]">
            <div className="pl-5">
              <div className="pt-5 text-3xl font-bold">Recommendations</div>
              <div className="mt-2 text-xs">
                Disclaimer: The information provided here is for general
                informational purposes only and does not constitute financial
                advice. You should consult a qualified financial professional
                before making financial decisions.
              </div>
              <div className="pt-5"></div>
              <ol></ol>
              {incomes && incomes.length > 0 && (
                <div
                  onClick={() => setShowRedirectModal(true)}
                  className="py-2 rounded bg-linear-to-r from-blue-500 via-teal-500 to-green-500 w-[300px] text-center cursor-pointer hover:from-blue-400 hover:via-teal-400 hover:to-green-400 transition-all ease-in-out duration-300"
                >
                  Generate AI Recommendations
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div></div>
      )}
      {showRedirectModal && (
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#222222] p-6 rounded shadow-lg w-[90%] max-w-md z-100`}
        >
          <div className="text-2xl font-bold">COMING SOON</div>
          <div className="my-5">
            The back-end AI generation pipeline is being constructed, and the
            front-end will be built for you :)
          </div>
          <div className="my-5 flex justify-end">
            <div
              onClick={() => setShowRedirectModal(false)}
              className="p-2 mr-1 bg-cyan-600 rounded text-white bold secondary-font font-bold cursor-pointer"
            >
              I will wait patiently
            </div>
          </div>
        </div>
      )}
      {showRedirectModal && (
        <div className="fixed inset-0 bg-black opacity-50 z-90"></div>
      )}
    </div>
  );
}
