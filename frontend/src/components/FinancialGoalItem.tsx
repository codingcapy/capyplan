import { MdModeEditOutline } from "react-icons/md";
import { FaTrashCan } from "react-icons/fa6";
import { FinancialGoal } from "../../../schemas/financialGoals";
import { format } from "date-fns";

export function FinancialGoalItem(props: { financialGoal: FinancialGoal }) {
  return (
    <div>
      <div className="flex justify-between my-2">
        <div className="w-[33%]">{props.financialGoal.name}</div>
        <div className="w-[33%]">${props.financialGoal.amount / 100}</div>
        <div className="w-[33%]">
          {format(props.financialGoal.targetDate, "yyyy-MM-dd")}
        </div>
        <MdModeEditOutline size={20} className="w-8.75 cursor-pointer" />
        <FaTrashCan size={20} className="text-red-400 w-8.75 cursor-pointer" />
      </div>
    </div>
  );
}
