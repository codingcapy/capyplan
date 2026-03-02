import { FaCheck, FaTrashCan, FaXmark } from "react-icons/fa6";
import { MdModeEditOutline } from "react-icons/md";
import { Income } from "../../../schemas/incomes";
import { useState } from "react";
import { useDeleteIncomeMutation } from "../lib/api/incomes";

export function IncomeItem(props: { income: Income }) {
  const [editMode, setEditMode] = useState(false);
  const [companyContent, setCompanyContent] = useState(props.income.company);
  const [positionContent, setPositionContent] = useState(props.income.position);
  const [amountContent, setAmountContent] = useState(props.income.amount);
  const [taxContent, setTaxContent] = useState(props.income.tax);
  const { mutate: deleteIncome, isPending: deleteIncomePending } =
    useDeleteIncomeMutation();

  function handleSubmitEditIncome() {}

  function handleSubmitDeleteIncome() {
    if (deleteIncomePending) return;
    deleteIncome({ incomeId: props.income.incomeId });
  }

  return (
    <div>
      {editMode ? (
        <form onSubmit={handleSubmitEditIncome} className="my-2">
          <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
            <div className="xl:w-[25%]">
              <div className="xl:hidden w-[100px] inline-block">Company:</div>
              <input
                type="text"
                name="company"
                value={companyContent}
                onChange={(e) => setCompanyContent(e.target.value)}
                className="px-2 border border-[#777777] rounded"
              />
            </div>
            <div className="xl:w-[25%]">
              <div className="xl:hidden w-[100px] inline-block">Position:</div>
              <input
                type="text"
                name="position"
                value={positionContent}
                onChange={(e) => setPositionContent(e.target.value)}
                className="px-2 border border-[#777777] rounded"
              />
            </div>
            <div className="xl:w-[25%]">
              <div className="xl:hidden w-[100px] inline-block">Amount:</div>
              <input
                type="number"
                step="any"
                name="amount"
                value={amountContent}
                onChange={(e) => setAmountContent(e.target.valueAsNumber)}
                required
                className="px-2 border border-[#777777] rounded"
              />
            </div>
            <div className="xl:w-[25%]">
              <div className="xl:hidden w-[100px] inline-block">Tax %:</div>
              <input
                type="number"
                step="any"
                name="tax"
                value={taxContent}
                onChange={(e) => setTaxContent(e.target.valueAsNumber)}
                required
                className="px-2 border border-[#777777] rounded"
              />
            </div>
            <button className="w-[35px] cursor-pointer text-green-500 flex items-center justify-center">
              <FaCheck />
            </button>
            <div
              onClick={() => setEditMode(false)}
              className="w-[35px] cursor-pointer text-red-500 flex items-center justify-center"
            >
              <FaXmark />
            </div>
          </div>
        </form>
      ) : (
        <div key={props.income.incomeId} className="flex justify-between my-2">
          <div className="w-[25%]">{props.income.company}</div>
          <div className="w-[25%]">{props.income.position}</div>
          <div className="w-[25%]">${props.income.amount / 100}</div>
          <div className="w-[25%]">{props.income.tax / 100}%</div>
          <MdModeEditOutline
            size={20}
            onClick={() => setEditMode(true)}
            className="w-[35px] cursor-pointer"
          />
          <FaTrashCan
            onClick={handleSubmitDeleteIncome}
            size={20}
            className="text-red-400 w-[35px] cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
