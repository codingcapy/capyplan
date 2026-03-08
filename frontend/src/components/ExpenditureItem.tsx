import { FaTrashCan } from "react-icons/fa6";
import { Expenditure } from "../../../schemas/expenditures";
import { MdModeEditOutline } from "react-icons/md";

export function ExpenditureItem(props: { expenditure: Expenditure }) {
  return (
    <div
      key={props.expenditure.expenditureId}
      className="flex justify-between my-2"
    >
      <div className="w-[50%]">{props.expenditure.name}</div>
      <div className="w-[50%]">${props.expenditure.amount / 100}</div>
      <MdModeEditOutline size={20} className="w-8.75 cursor-pointer" />
      <FaTrashCan size={20} className="text-red-400 w-8.75 cursor-pointer" />
    </div>
  );
}
