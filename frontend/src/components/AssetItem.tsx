import { MdModeEditOutline } from "react-icons/md";
import { Asset } from "../../../schemas/assets";
import { FaTrashCan } from "react-icons/fa6";
import { useDeleteAssetMutation } from "../lib/api/assets";

export function AssetItem(props: { asset: Asset }) {
  const { mutate: deleteAsset, isPending: deleteAssetPending } =
    useDeleteAssetMutation();

  function handleSubmitDeleteAsset() {
    if (deleteAssetPending) return;
    deleteAsset({ assetId: props.asset.assetId });
  }

  return (
    <div className="flex justify-between my-2">
      <div className="w-[33%]">{props.asset.name}</div>
      <div className="w-[33%]">${props.asset.value / 100}</div>
      <div className="w-[33%]">{props.asset.roi / 100}</div>
      <MdModeEditOutline size={20} className="w-8.75 cursor-pointer" />
      <FaTrashCan
        onClick={handleSubmitDeleteAsset}
        size={20}
        className="text-red-400 w-8.75 cursor-pointer"
      />
    </div>
  );
}
