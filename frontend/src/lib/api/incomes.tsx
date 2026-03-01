import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ArgumentTypes, client } from "./client";
import { getSession } from "./plans";

type CreateIncomeArgs = ArgumentTypes<
  typeof client.api.v0.incomes.$post
>[0]["json"];

async function createIncome(args: CreateIncomeArgs) {
  const token = getSession();
  const res = await client.api.v0.incomes.$post(
    { json: args },
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  );
  if (!res.ok) {
    let errorMessage =
      "There was an issue creating your income :( We'll look into it ASAP!";
    try {
      const errorResponse = await res.json();
      if (
        errorResponse &&
        typeof errorResponse === "object" &&
        "message" in errorResponse
      ) {
        errorMessage = String(errorResponse.message);
      }
    } catch (error) {
      console.error("Failed to parse error response:", error);
    }
    throw new Error(errorMessage);
  }
  const result = await res.json();
  return result;
}

export const useCreateIncomeMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIncome,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["incomes"] });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getIncomesByPlanId(planId: number) {
  const token = getSession();
  const res = await client.api.v0.incomes[":planId"].$get(
    {
      param: { planId: planId.toString() },
    },
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  );

  if (!res.ok) {
    throw new Error("Error getting incomes by plan id");
  }
  const { incomes } = await res.json();
  return incomes;
}

export const getIncomesByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["incomes", planId],
    queryFn: () => getIncomesByPlanId(planId),
  });
