import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "/capyness.png";
import { useEffect, useRef, useState } from "react";
import { PiCaretDownBold } from "react-icons/pi";
import { FaArrowLeft, FaCheck, FaXmark } from "react-icons/fa6";
import { v4 as uuidv4 } from "uuid";
import { MdModeEditOutline } from "react-icons/md";
import { FaTrashCan } from "react-icons/fa6";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { DemoEditIncome } from "../components/DemoEditIncome";
import { DemoEditExpenditure } from "../components/DemoEditExpenditure";
import { DemoEditAsset } from "../components/DemoEditAsset";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
});

type Plan = {
  planId: string;
  title: string;
};

type Income = {
  incomeId: string;
  planId: string;
  company: string;
  position: string;
  amount: number;
  tax: number;
};

type Expenditure = {
  expenditureId: string;
  planId: string;
  name: string;
  amount: number;
};

type Asset = {
  assetId: string;
  planId: string;
  name: string;
  value: number;
  roi: number;
};

type Liability = {
  liabilityId: string;
  planId: string;
  name: string;
  amount: number;
  interest: number;
};

type FinancialGoal = {
  financialGoalId: string;
  planId: string;
  name: string;
  amount: number;
  target: Date;
};

type ModalMode =
  | "none"
  | "createPlan"
  | "deleteIncome"
  | "deleteExpenditure"
  | "deleteAsset"
  | "deleteLiability";

function DemoPage() {
  const initialPlanId = uuidv4();
  const initialPlan: Plan = {
    planId: initialPlanId,
    title: "Demo Plan",
  };
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([initialPlan]);
  const [currentPlan, setCurrentPlan] = useState(initialPlan.planId);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [createIncomeMode, setCreateIncomeMode] = useState(false);
  const [createExpenditureMode, setCreateExpenditureMode] = useState(false);
  const [createAssetMode, setCreateAssetMode] = useState(false);
  const [createLiabilityMode, setCreateLiabilityMode] = useState(false);
  const [createFinancialGoalMode, setCreateFinancialGoalMode] = useState(false);
  const [editIncomePointer, setEditIncomePointer] = useState("none");
  const [editExpenditurePointer, setEditExpenditurePointer] = useState("none");
  const [editAssetPointer, setEditAssetPointer] = useState("none");
  const [editLiabilityPointer, setEditLiabilityPointer] = useState("none");
  const [editFinancialPlanPointer, setEditFinancialPlanPointer] =
    useState("none");
  const [modalMode, setModalMode] = useState<ModalMode>("none");
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  function handleSubmitCreatePlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newPlan = {
      planId: uuidv4(),
      title: (e.target as HTMLFormElement).plantitle.value,
    };
    setPlans([...plans, newPlan]);
    setCurrentPlan(newPlan.planId);
    setPlan(newPlan);
    setShowCreatePlanModal(false);
  }

  function handleSubmitCreateIncome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newIncome: Income = {
      incomeId: uuidv4(),
      planId: currentPlan,
      company: (e.target as HTMLFormElement).company.value,
      position: (e.target as HTMLFormElement).position.value,
      amount: parseFloat((e.target as HTMLFormElement).amount.value),
      tax: parseFloat((e.target as HTMLFormElement).tax.value),
    };
    setIncomes([...incomes, newIncome]);
    setCreateIncomeMode(false);
  }

  function handleSubmitCreateExpenditure(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newExpenditure: Expenditure = {
      expenditureId: uuidv4(),
      planId: currentPlan,
      name: (e.target as HTMLFormElement).expenditurename.value,
      amount: parseFloat((e.target as HTMLFormElement).expenditureamount.value),
    };
    setExpenditures([...expenditures, newExpenditure]);
    setCreateExpenditureMode(false);
  }

  function handleSubmitCreateAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newAsset: Asset = {
      assetId: uuidv4(),
      planId: currentPlan,
      name: (e.target as HTMLFormElement).assetname.value,
      value: parseFloat((e.target as HTMLFormElement).assetvalue.value),
      roi: parseFloat((e.target as HTMLFormElement).roi.value),
    };
    setAssets([...assets, newAsset]);
    setCreateAssetMode(false);
  }

  function handleSubmitCreateLiability(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newLiability: Liability = {
      liabilityId: uuidv4(),
      planId: currentPlan,
      name: (e.target as HTMLFormElement).liabilityname.value,
      amount: parseFloat((e.target as HTMLFormElement).liabilityamount.value),
      interest: parseFloat((e.target as HTMLFormElement).interest.value),
    };
    setLiabilities([...liabilities, newLiability]);
    setCreateLiabilityMode(false);
  }

  function handleSubmitCreateFinancialGoal(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    const newFinancialGoal: FinancialGoal = {
      financialGoalId: uuidv4(),
      planId: currentPlan,
      name: (e.target as HTMLFormElement).financialgoalname.value,
      amount: parseFloat(
        (e.target as HTMLFormElement).financialgoalamount.value,
      ),
      target: targetDate,
    };
    setFinancialGoals([...financialGoals, newFinancialGoal]);
    setCreateFinancialGoalMode(false);
  }

  function handleSubmitEditIncome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newIncome: Income = {
      incomeId: editIncomePointer,
      planId: currentPlan,
      company: (e.target as HTMLFormElement).company.value,
      position: (e.target as HTMLFormElement).position.value,
      amount: parseFloat((e.target as HTMLFormElement).amount.value),
      tax: parseFloat((e.target as HTMLFormElement).tax.value),
    };
    setIncomes((prev) =>
      prev.map((i) => (i.incomeId === editIncomePointer ? newIncome : i)),
    );
    setEditIncomePointer("none");
  }

  function handleSubmitEditExpenditure(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newExpenditure: Expenditure = {
      expenditureId: editExpenditurePointer,
      planId: currentPlan,
      name: (e.target as HTMLFormElement).expenditurename.value,
      amount: parseFloat((e.target as HTMLFormElement).expenditureamount.value),
    };
    setExpenditures((prev) =>
      prev.map((e) =>
        e.expenditureId === editExpenditurePointer ? newExpenditure : e,
      ),
    );
    setEditExpenditurePointer("none");
  }

  function handleSubmitEditAsset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newAsset: Asset = {
      assetId: editAssetPointer,
      planId: currentPlan,
      name: (e.target as HTMLFormElement).assetname.value,
      value: parseFloat((e.target as HTMLFormElement).assetvalue.value),
      roi: parseFloat((e.target as HTMLFormElement).assetroi.value),
    };
    setAssets((prev) =>
      prev.map((a) => (a.assetId === editAssetPointer ? newAsset : a)),
    );
    setEditAssetPointer("none");
  }

  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowDropdown(false);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    const selectedPlan = plans.find((p) => p.planId === currentPlan);
    setPlan(selectedPlan || null);
  }, [currentPlan, plans]);

  return (
    <div className="bg-[#242424] text-white min-h-screen p-2">
      <div className="hidden sm:block fixed top-0 left-0 h-screen bg-[#101010] w-[250px]">
        <div className="flex items-center p-5 pt-20 xl:pt-16 mb-5">
          <img src={logo} alt="" className="w-[25px]" />
          <div className="ml-2 text-lg">CapyPlan</div>
        </div>
        <div className="px-5">Financial Plan</div>
        <div
          ref={menuRef}
          onClick={() => setShowDropdown(!showDropdown)}
          className="border border-[#555555] rounded m-2 px-3 py-2 flex cursor-pointer hover:bg-[#202020] transition-all ease-in-out duration-300"
        >
          <div className="w-[175px] line-clamp-1">{plan?.title}</div>
          <div className="ml-5 mt-1">
            <PiCaretDownBold />
          </div>
        </div>
        {showDropdown && (
          <div className="relative bg-[#303030] rounded m-2 px-3 py-2 max-h-[175px] overflow-y-auto">
            <div className="py-1 cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300"></div>
            {plans.map((p) => (
              <div
                onClick={() => setCurrentPlan(p.planId)}
                key={p.planId}
                className="py-1 cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300"
              >
                {p.title}
              </div>
            ))}
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
            <form onSubmit={handleSubmitCreatePlan} className="flex flex-col">
              <label htmlFor="" className="text-left mb-2">
                Financial plan name
              </label>
              <input
                type="text"
                name="plantitle"
                id="plantitle"
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
                  type="submit"
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
      <div className="fixed top-0 left-0 p-2.5 w-screen flex justify-between bg-[#242424]">
        <div className="hover:text-cyan-500 transition-all ease-in-out duration-300 flex justify-center items-center">
          <Link to="/" className="flex justify-center items-center">
            <FaArrowLeft />
            <div className="hidden sm:block sm:pl-2">Back to login</div>
          </Link>
        </div>
        <div className="text-xs sm:text-base max-w-[300px] sm:max-w-full">
          <b>Note</b>: This is a demo. All of your data is temporary and will be
          deleted when you leave this page. To save your financial plans, please{" "}
          <Link
            to="/signup"
            className="text-cyan-500 font-bold hover:underline"
          >
            register
          </Link>{" "}
          or{" "}
          <Link to="/" className="text-cyan-500 font-bold hover:underline">
            log in
          </Link>
          .<div></div>
        </div>
        <div></div>
      </div>
      <div className="sm:pl-[240px]">
        <div className="pl-5 pt-20 xl:pt-12 text-4xl font-bold">
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
            {incomes
              .filter((i) => i.planId === currentPlan)
              .map((income) =>
                editIncomePointer === income.incomeId ? (
                  <DemoEditIncome
                    key={income.incomeId}
                    income={income}
                    handleSubmitEditIncome={handleSubmitEditIncome}
                    setEditIncomePointer={setEditIncomePointer}
                  />
                ) : (
                  <div
                    key={income.incomeId}
                    className="flex justify-between my-2"
                  >
                    <div className="w-[25%]">{income.company}</div>
                    <div className="w-[25%]">{income.position}</div>
                    <div className="w-[25%]">${income.amount}</div>
                    <div className="w-[25%]">{income.tax}%</div>
                    <MdModeEditOutline
                      size={20}
                      onClick={() => setEditIncomePointer(income.incomeId)}
                      className="w-[35px] cursor-pointer"
                    />
                    <FaTrashCan
                      size={20}
                      onClick={() =>
                        setIncomes((prev) =>
                          prev.filter((i) => i.incomeId !== income.incomeId),
                        )
                      }
                      className="text-red-400 w-[35px] cursor-pointer"
                    />
                  </div>
                ),
              )}
            {createIncomeMode ? (
              <form onSubmit={handleSubmitCreateIncome} className="my-2">
                <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
                  <div className="xl:w-[25%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Company:
                    </div>
                    <input
                      type="text"
                      name="company"
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[25%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Position:
                    </div>
                    <input
                      type="text"
                      name="position"
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[25%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Amount:
                    </div>
                    <input
                      type="number"
                      name="amount"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[25%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Tax %:
                    </div>
                    <input
                      type="number"
                      name="tax"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="w-[70px]"></div>
                </div>
                <div className="flex mt-2">
                  <div
                    onClick={() => setCreateIncomeMode(false)}
                    className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
                  >
                    Cancel
                  </div>
                  <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
                    Create
                  </button>
                </div>
              </form>
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
              {incomes.reduce(
                (sum, income) =>
                  sum + (income.amount * (100 - income.tax)) / 100,
                0,
              )}
            </div>
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
            {expenditures
              .filter((e) => e.planId === currentPlan)
              .map((expenditure) =>
                editExpenditurePointer === expenditure.expenditureId ? (
                  <DemoEditExpenditure
                    key={expenditure.expenditureId}
                    expenditure={expenditure}
                    handleSubmitEditExpenditure={handleSubmitEditExpenditure}
                    setEditExpenditurePointer={setEditExpenditurePointer}
                  />
                ) : (
                  <div
                    key={expenditure.expenditureId}
                    className="flex justify-between my-2"
                  >
                    <div className="w-[50%]">{expenditure.name}</div>
                    <div className="w-[50%]">${expenditure.amount}</div>
                    <MdModeEditOutline
                      size={20}
                      onClick={() =>
                        setEditExpenditurePointer(expenditure.expenditureId)
                      }
                      className="w-8.75 cursor-pointer"
                    />
                    <FaTrashCan
                      size={20}
                      onClick={() =>
                        setExpenditures((prev) =>
                          prev.filter(
                            (e) =>
                              e.expenditureId !== expenditure.expenditureId,
                          ),
                        )
                      }
                      className="text-red-400 w-8.75 cursor-pointer"
                    />
                  </div>
                ),
              )}
            {createExpenditureMode ? (
              <form onSubmit={handleSubmitCreateExpenditure} className="my-2">
                <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
                  <div className="xl:w-[50%]">
                    <div className="xl:hidden w-25 inline-block">Name:</div>
                    <input
                      type="text"
                      name="expenditurename"
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[50%]">
                    <div className="xl:hidden w-25 inline-block">
                      Amount (Monthly):
                    </div>
                    <input
                      type="number"
                      name="expenditureamount"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="w-17.5"></div>
                </div>
                <div className="flex mt-2">
                  <div
                    onClick={() => setCreateExpenditureMode(false)}
                    className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
                  >
                    Cancel
                  </div>
                  <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => setCreateExpenditureMode(true)}
                className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
                + Add expenditure
              </div>
            )}
            <div className="pt-5">
              Total expenditure: $
              {expenditures.reduce(
                (sum, expenditure) => sum + expenditure.amount,
                0,
              )}
            </div>
          </div>
        </div>
        <div className="border-b border-b-[#777777] bg-[#303030] pb-5">
          <div className="pl-5">
            <div className="pt-5 font-bold">
              Total cashflow: $
              {incomes.reduce(
                (sum, income) =>
                  sum + (income.amount * (100 - income.tax)) / 100,
                0,
              ) -
                expenditures.reduce(
                  (sum, expenditure) => sum + expenditure.amount,
                  0,
                )}
            </div>
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
            {assets
              .filter((a) => a.planId === currentPlan)
              .map((asset) =>
                editAssetPointer === asset.assetId ? (
                  <DemoEditAsset
                    asset={asset}
                    handleSubmitEditAsset={handleSubmitEditAsset}
                    setEditAssetPointer={setEditAssetPointer}
                  />
                ) : (
                  <div
                    key={asset.assetId}
                    className="flex justify-between my-2"
                  >
                    <div className="w-[33%]">{asset.name}</div>
                    <div className="w-[33%]">${asset.value}</div>
                    <div className="w-[33%]">{asset.roi}</div>
                    <MdModeEditOutline
                      onClick={() => setEditAssetPointer(asset.assetId)}
                      size={20}
                      className="w-8.75 cursor-pointer"
                    />
                    <FaTrashCan
                      size={20}
                      onClick={() =>
                        setAssets((prev) =>
                          prev.filter((a) => a.assetId !== asset.assetId),
                        )
                      }
                      className="text-red-400 w-8.75 cursor-pointer"
                    />
                  </div>
                ),
              )}
            {createAssetMode ? (
              <form onSubmit={handleSubmitCreateAsset} className="my-2">
                <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Name:
                    </div>
                    <input
                      type="text"
                      name="assetname"
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Value:
                    </div>
                    <input
                      type="number"
                      name="assetvalue"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Return on investment %:
                    </div>
                    <input
                      type="number"
                      name="roi"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="w-[70px]"></div>
                </div>
                <div className="flex mt-2">
                  <div
                    onClick={() => setCreateAssetMode(false)}
                    className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
                  >
                    Cancel
                  </div>
                  <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => setCreateAssetMode(true)}
                className="mt-5 py-1 w-32.5 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
                + Add asset
              </div>
            )}
            <div className="pt-5">
              Total assets: $
              {assets.reduce((sum, asset) => sum + asset.value, 0)}
            </div>
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
            {liabilities
              .filter((l) => l.planId === currentPlan)
              .map((liability) => (
                <div
                  key={liability.liabilityId}
                  className="flex justify-between my-2"
                >
                  <div className="w-[33%]">{liability.name}</div>
                  <div className="w-[33%]">${liability.amount}</div>
                  <div className="w-[33%]">{liability.interest}</div>
                  <MdModeEditOutline
                    size={20}
                    className="w-8.75 cursor-pointer"
                  />
                  <FaTrashCan
                    size={20}
                    onClick={() =>
                      setLiabilities((prev) =>
                        prev.filter(
                          (l) => l.liabilityId !== liability.liabilityId,
                        ),
                      )
                    }
                    className="text-red-400 w-8.75 cursor-pointer"
                  />
                </div>
              ))}
            {createLiabilityMode ? (
              <form onSubmit={handleSubmitCreateLiability} className="my-2">
                <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Name:
                    </div>
                    <input
                      type="text"
                      name="liabilityname"
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Amount:
                    </div>
                    <input
                      type="number"
                      name="liabilityamount"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Monthly Interest %:
                    </div>
                    <input
                      type="number"
                      name="interest"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="w-[70px]"></div>
                </div>
                <div className="flex mt-2">
                  <div
                    onClick={() => setCreateLiabilityMode(false)}
                    className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
                  >
                    Cancel
                  </div>
                  <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => setCreateLiabilityMode(true)}
                className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
                + Add liability
              </div>
            )}
            <div className="pt-5">
              Total liabilities: $
              {liabilities.reduce(
                (sum, liability) => sum + liability.amount,
                0,
              )}
            </div>
          </div>
        </div>
        <div className="border-b border-b-[#777777] pb-5 bg-[#303030]">
          <div className="pl-5">
            <div className="pt-5 font-bold">
              Total net worth: $
              {assets.reduce((sum, asset) => sum + asset.value, 0) -
                liabilities.reduce(
                  (sum, liability) => sum + liability.amount,
                  0,
                )}
            </div>
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
            {financialGoals
              .filter((f) => f.planId === currentPlan)
              .map((financialGoal) => (
                <div
                  key={financialGoal.financialGoalId}
                  className="flex justify-between my-2"
                >
                  <div className="w-[33%]">{financialGoal.name}</div>
                  <div className="w-[33%]">${financialGoal.amount}</div>
                  <div className="w-[33%]">
                    {format(financialGoal.target, "yyyy-MM-dd")}
                  </div>
                  <MdModeEditOutline
                    size={20}
                    className="w-8.75 cursor-pointer"
                  />
                  <FaTrashCan
                    size={20}
                    onClick={() =>
                      setFinancialGoals((prev) =>
                        prev.filter(
                          (f) =>
                            f.financialGoalId !== financialGoal.financialGoalId,
                        ),
                      )
                    }
                    className="text-red-400 w-8.75 cursor-pointer"
                  />
                </div>
              ))}
            {createFinancialGoalMode ? (
              <form onSubmit={handleSubmitCreateFinancialGoal} className="my-2">
                <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Name:
                    </div>
                    <input
                      type="text"
                      name="financialgoalname"
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[33%]">
                    <div className="xl:hidden w-[100px] inline-block">
                      Amount:
                    </div>
                    <input
                      type="number"
                      name="financialgoalamount"
                      required
                      className="px-2 border border-[#777777] rounded"
                    />
                  </div>
                  <div className="xl:w-[33%] relative">
                    <div className="xl:hidden w-[100px] inline-block">
                      Target Date:
                    </div>
                    <div
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="inline-block px-2 border border-[#777777] rounded w-[100px] text-left cursor-pointer"
                    >
                      {format(targetDate, "yyyy-MM-dd")}
                    </div>
                    {showCalendar && (
                      <div className="absolute bottom-[10px] md:bottom-[25px] md:right-[200px] scale-75">
                        <DayPicker
                          mode="single"
                          selected={targetDate}
                          onSelect={(date) => {
                            setTargetDate((date && date) || new Date());
                            setShowCalendar(false);
                          }}
                          className="text-xs bg-[#404040] p-2"
                        />
                      </div>
                    )}
                  </div>
                  <div className="w-[70px]"></div>
                </div>
                <div className="flex mt-2">
                  <div
                    onClick={() => setCreateFinancialGoalMode(false)}
                    className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
                  >
                    Cancel
                  </div>
                  <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
                    Create
                  </button>
                </div>
              </form>
            ) : (
              <div
                onClick={() => setCreateFinancialGoalMode(true)}
                className="mt-5 py-1 w-40 text-center cursor-pointer hover:text-cyan-500 transition-all ease-in-out duration-300 border border-[#777777] hover:border-cyan-500 rounded"
              >
                + Add financial goal
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
