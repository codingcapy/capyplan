import { MdModeEditOutline } from "react-icons/md";
import { Liability } from "../../../schemas/liabilities";
import { FaTrashCan } from "react-icons/fa6";
import { useDeleteLiabilityMutation } from "../lib/api/liabilities";

export function LiabilityItem(props: { liability: Liability }) {
  const { mutate: deleteLiability, isPending: deleteLiabilityPending } =
    useDeleteLiabilityMutation();

  function handleSubmitDeleteLiability() {
    if (deleteLiabilityPending) return;
    deleteLiability({ liabilityId: props.liability.liabilityId });
  }

  return (
    <div>
      <div className="flex justify-between my-2">
        <div className="w-[33%]">{props.liability.name}</div>
        <div className="w-[33%]">${props.liability.amount / 100}</div>
        <div className="w-[33%]">{props.liability.interest / 100}</div>
        <MdModeEditOutline size={20} className="w-8.75 cursor-pointer" />
        <FaTrashCan
          onClick={handleSubmitDeleteLiability}
          size={20}
          className="text-red-400 w-8.75 cursor-pointer"
        />
      </div>
    </div>
  );
}
