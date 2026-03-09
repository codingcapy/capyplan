import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ArgumentTypes, client, ExtractData } from "./client";
import { getSession } from "./plans";
import { Expenditure } from "../../../../schemas/expenditures";

type CreateExpenditureArgs = ArgumentTypes<
  typeof client.api.v0.expenditures.$post
>[0]["json"];

type DeleteExpenditureArgs = ArgumentTypes<
  typeof client.api.v0.expenditures.delete.$post
>[0]["json"];

type UpdateExpenditureArgs = ArgumentTypes<
  typeof client.api.v0.expenditures.update.$post
>[0]["json"];

type SerializeExpenditure = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.expenditures.$get>>
>["expenditures"][number];

export function mapSerializedExpenditureToSchema(
  serialized: SerializeExpenditure,
): Expenditure {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
  };
}

async function createExpenditure(args: CreateExpenditureArgs) {
  const token = getSession();
  const res = await client.api.v0.expenditures.$post(
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
      "There was an issue creating your expenditure :( We'll look into it ASAP!";
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

export const useCreateExpenditureMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExpenditure,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["expenditures", data?.expenditure.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getExpendituresByPlanId(planId: number) {
  const token = getSession();
  const res = await client.api.v0.expenditures[":planId"].$get(
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
    throw new Error("Error getting expenditures by plan id");
  }
  const { expenditures } = await res.json();
  return expenditures.map(mapSerializedExpenditureToSchema);
}

export const getExpendituresByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["expenditures", planId],
    queryFn: () => getExpendituresByPlanId(planId),
  });

async function deleteExpenditure(args: DeleteExpenditureArgs) {
  const token = getSession();
  const res = await client.api.v0.expenditures.delete.$post(
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
      "There was an issue deleting your expenditure :( We'll look into it ASAP!";
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

export const useDeleteExpenditureMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExpenditure,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["expenditures", data?.expenditure.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function UpdateExpenditures(args: UpdateExpenditureArgs) {
  const token = getSession();
  const res = await client.api.v0.expenditures.update.$post(
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
      "There was an issue updating your expenditure :( We'll look into it ASAP!";
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

export const useUpdateExpenditureMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateExpenditures,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["expenditures", data?.expenditure.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
