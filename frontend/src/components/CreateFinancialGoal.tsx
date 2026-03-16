import { format } from "date-fns";
import { Dispatch, SetStateAction, useState } from "react";
import { DayPicker } from "react-day-picker";
import { useCreateFinancialGoalMutation } from "../lib/api/financialGoals";
import { Plan } from "../../../schemas/plans";

export function CreateFinancialGoal(props: {
  plan: Plan;
  setCreateFinancialGoalMode: (value: SetStateAction<boolean>) => void;
}) {
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const { mutate: createFinancialGoal, isPending: createFinancialGoalPending } =
    useCreateFinancialGoalMutation();
  const [notification, setNotification] = useState("");

  function handleSubmitCreateFinancialGoal(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    if (createFinancialGoalPending) return;
    createFinancialGoal(
      {
        planId: props.plan.planId,
        name: (e.target as HTMLFormElement).financialgoalname.value,
        amount:
          parseFloat((e.target as HTMLFormElement).financialgoalamount.value) *
          100,
        targetDate: targetDate,
      },
      {
        onSuccess: () => props.setCreateFinancialGoalMode(false),
        onError: (errorMessage) => setNotification(errorMessage.toString()),
      },
    );
  }

  return (
    <form onSubmit={handleSubmitCreateFinancialGoal} className="my-2">
      <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
        <div className="xl:w-[33%]">
          <div className="xl:hidden w-[100px] inline-block">Name:</div>
          <input
            type="text"
            name="financialgoalname"
            className="px-2 border border-[#777777] rounded"
          />
        </div>
        <div className="xl:w-[33%]">
          <div className="xl:hidden w-[100px] inline-block">Amount:</div>
          <input
            type="number"
            step="any"
            name="financialgoalamount"
            required
            className="px-2 border border-[#777777] rounded"
          />
        </div>
        <div className="xl:w-[33%] relative">
          <div className="xl:hidden w-[100px] inline-block">Target Date:</div>
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
          onClick={() => props.setCreateFinancialGoalMode(false)}
          className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
        >
          Cancel
        </div>
        <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
          Create
        </button>
      </div>
      <div>{notification}</div>
    </form>
  );
}
