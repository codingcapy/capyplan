import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ArgumentTypes, client, ExtractData } from "./client";
import { getSession } from "./plans";
import { Income } from "../../../../schemas/incomes";

type CreateIncomeArgs = ArgumentTypes<
  typeof client.api.v0.incomes.$post
>[0]["json"];

type DeleteIncomeArgs = ArgumentTypes<
  typeof client.api.v0.incomes.delete.$post
>[0]["json"];

type UpdateIncomeArgs = ArgumentTypes<
  typeof client.api.v0.incomes.update.$post
>[0]["json"];

type SerializeIncome = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.incomes.$get>>
>["incomes"][number];

export function mapSerializedIncomeToSchema(
  serialized: SerializeIncome,
): Income {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
  };
}

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
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["incomes", data?.plan.planId],
      });
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
  return incomes.map(mapSerializedIncomeToSchema);
}

export const getIncomesByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["incomes", planId],
    queryFn: () => getIncomesByPlanId(planId),
  });

async function deleteIncome(args: DeleteIncomeArgs) {
  const token = getSession();
  const res = await client.api.v0.incomes.delete.$post(
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
      "There was an issue deleting your income :( We'll look into it ASAP!";
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

export const useDeleteIncomeMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIncome,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["incomes", data?.income.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function UpdateIncome(args: UpdateIncomeArgs) {
  const token = getSession();
  const res = await client.api.v0.incomes.update.$post(
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
      "There was an issue updating your income :( We'll look into it ASAP!";
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

export const useUpdateIncomeMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateIncome,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["incomes", data?.income.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
