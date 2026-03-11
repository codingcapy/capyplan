import { MdModeEditOutline } from "react-icons/md";
import { Asset } from "../../../schemas/assets";
import { FaTrashCan } from "react-icons/fa6";

export function AssetItem(props: { asset: Asset }) {
  return (
    <div className="flex justify-between my-2">
      <div className="w-[33%]">{props.asset.name}</div>
      <div className="w-[33%]">${props.asset.value}</div>
      <div className="w-[33%]">{props.asset.roi}</div>
      <MdModeEditOutline size={20} className="w-8.75 cursor-pointer" />
      <FaTrashCan size={20} className="text-red-400 w-8.75 cursor-pointer" />
    </div>
  );
}
