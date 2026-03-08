import { SetStateAction } from "react";

export function CreateLiability(props: {
  setCreateLiabilityMode: (value: SetStateAction<boolean>) => void;
}) {
  function handleSubmitCreateLiability() {}

  return (
    <form onSubmit={handleSubmitCreateLiability} className="my-2">
      <div className="flex flex-col xl:flex-row xl:justify-between gap-2">
        <div className="xl:w-[33%]">
          <div className="xl:hidden w-[100px] inline-block">Name:</div>
          <input
            type="text"
            name="liabilityname"
            className="px-2 border border-[#777777] rounded"
          />
        </div>
        <div className="xl:w-[33%]">
          <div className="xl:hidden w-[100px] inline-block">Amount:</div>
          <input
            type="number"
            step="any"
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
            step="any"
            name="interest"
            required
            className="px-2 border border-[#777777] rounded"
          />
        </div>
        <div className="w-[70px]"></div>
      </div>
      <div className="flex mt-2">
        <div
          onClick={() => props.setCreateLiabilityMode(false)}
          className="cursor-pointer py-1 px-2 mr-1 bg-[#777777] rounded"
        >
          Cancel
        </div>
        <button className="cursor-pointer py-1 px-2 ml-1 bg-cyan-500 rounded">
          Create
        </button>
      </div>
    </form>
  );
}
