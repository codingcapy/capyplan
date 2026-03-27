import { Plan } from "../../../schemas/plans";
import { countries } from "../lib/utils";

export function CountriesDropdown(props: { plan: Plan }) {
  return (
    <div className="absolute top-8 left-[32%] border border-[#a0a0a0] bg-[#303030] custom-scrollbar h-[150px] overflow-y-auto">
      {countries.map((c) => (
        <div
          //   onClick={() =>
          //     updateCountry({ planId: props.plan.planId, location: c })
          //   }
          className="pl-1 pr-5 cursor-pointer hover:bg-[#222222] transition-all ease-in-out duration-300"
        >
          {c}
        </div>
      ))}
    </div>
  );
}
