import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { FinancialGoal } from "../../../../schemas/financialGoals";
import { ArgumentTypes, client, ExtractData } from "./client";
import { getSession } from "./plans";

type CreateFinancialGoalArgs = ArgumentTypes<
  typeof client.api.v0.financialgoals.$post
>[0]["json"];

type DeleteFinancialGoalArgs = ArgumentTypes<
  typeof client.api.v0.financialgoals.delete.$post
>[0]["json"];

type UpdateFinancialGoalArgs = ArgumentTypes<
  typeof client.api.v0.financialgoals.update.$post
>[0]["json"];

type SerializeFinancialGoal = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.financialgoals.$get>>
>["financialGoals"][number];

export function mapSerializedFinancialGoalToSchema(
  serialized: SerializeFinancialGoal,
): FinancialGoal {
  return {
    ...serialized,
    targetDate: new Date(serialized.targetDate),
    createdAt: new Date(serialized.createdAt),
  };
}

async function createFinancialGoal(args: CreateFinancialGoalArgs) {
  const token = getSession();
  const res = await client.api.v0.financialgoals.$post(
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
      "There was an issue creating your financial goal :( We'll look into it ASAP!";
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

export const useCreateFinancialGoalMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFinancialGoal,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["financialGoals", data?.financialGoal.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getFinancialGoalsByPlanId(planId: number) {
  const token = getSession();
  const res = await client.api.v0.financialgoals[":planId"].$get(
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
    throw new Error("Error getting financial goals by plan id");
  }
  const { financialGoals } = await res.json();
  return financialGoals.map(mapSerializedFinancialGoalToSchema);
}

export const getFinancialGoalsByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["financialGoals", planId],
    queryFn: () => getFinancialGoalsByPlanId(planId),
  });

async function deleteFinancialGoal(args: DeleteFinancialGoalArgs) {
  const token = getSession();
  const res = await client.api.v0.financialgoals.delete.$post(
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
      "There was an issue deleting your financial goal :( We'll look into it ASAP!";
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

export const useDeleteFinancialGoalMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFinancialGoal,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["financialGoals", data?.financialGoal.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function UpdateFinancialGoal(args: UpdateFinancialGoalArgs) {
  const token = getSession();
  const res = await client.api.v0.financialgoals.update.$post(
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
      "There was an issue updating your financial goal :( We'll look into it ASAP!";
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

export const useUpdateFinancialGoalMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateFinancialGoal,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["financialGoals", data?.financialGoal.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
