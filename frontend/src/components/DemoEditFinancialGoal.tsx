import { format } from "date-fns";
import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { DayPicker } from "react-day-picker";
import { FaCheck, FaXmark } from "react-icons/fa6";

export function DemoEditFinancialGoal(props: {
  financialGoal: {
    financialGoalId: string;
    planId: string;
    name: string;
    amount: number;
    target: Date;
  };
  targetDate: Date;
  setTargetDate: Dispatch<SetStateAction<Date>>;
  showCalendar: boolean;
  setShowCalendar: (value: SetStateAction<boolean>) => void;
  handleSubmitEditFinancialGoal: (e: FormEvent<HTMLFormElement>) => void;
  setEditFinancialGoalPointer: (value: SetStateAction<string>) => void;
}) {
  const [nameContent, setNameContent] = useState(props.financialGoal.name);
  const [amountContent, setAmountContent] = useState(
    props.financialGoal.amount,
  );

  return (
    <form onSubmit={props.handleSubmitEditFinancialGoal} className="my-2">
      <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
        <div className="xl:w-[33%]">
          <div className="xl:hidden w-[100px] inline-block">Name:</div>
          <input
            type="text"
            name="financialgoalname"
            value={nameContent}
            onChange={(e) => setNameContent(e.target.value)}
            className="px-2 border border-[#777777] rounded"
          />
        </div>
        <div className="xl:w-[33%]">
          <div className="xl:hidden w-[100px] inline-block">Amount:</div>
          <input
            type="number"
            step="any"
            name="financialgoalamount"
            value={amountContent}
            onChange={(e) => setAmountContent(e.target.valueAsNumber)}
            required
            className="px-2 border border-[#777777] rounded"
          />
        </div>
        <div className="xl:w-[33%] relative">
          <div className="xl:hidden w-[100px] inline-block">Target Date:</div>
          <div
            onClick={() => props.setShowCalendar(!props.showCalendar)}
            className="inline-block px-2 border border-[#777777] rounded w-[100px] text-left cursor-pointer"
          >
            {format(props.targetDate, "yyyy-MM-dd")}
          </div>
          {props.showCalendar && (
            <div className="absolute bottom-[10px] md:bottom-[25px] md:right-[200px] scale-75">
              <DayPicker
                mode="single"
                selected={props.targetDate}
                onSelect={(date) => {
                  props.setTargetDate((date && date) || new Date());
                  props.setShowCalendar(false);
                }}
                className="text-xs bg-[#404040] p-2"
              />
            </div>
          )}
        </div>
        <button className="w-[35px] cursor-pointer text-green-500 flex items-center justify-center">
          <FaCheck />
        </button>
        <div
          onClick={() => props.setEditFinancialGoalPointer("none")}
          className="w-[35px] cursor-pointer text-red-500 flex items-center justify-center"
        >
          <FaXmark />
        </div>
      </div>
    </form>
  );
}
