import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Liability } from "../../../../schemas/liabilities";
import { ArgumentTypes, client, ExtractData } from "./client";
import { getSession } from "./plans";

type CreateLiabilityArgs = ArgumentTypes<
  typeof client.api.v0.liabilities.$post
>[0]["json"];

type DeleteLiabilityArgs = ArgumentTypes<
  typeof client.api.v0.liabilities.delete.$post
>[0]["json"];

type UpdateLiabilityArgs = ArgumentTypes<
  typeof client.api.v0.liabilities.update.$post
>[0]["json"];

type SerializeLiability = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.liabilities.$get>>
>["liabilities"][number];

export function mapSerializedLiabilityToSchema(
  serialized: SerializeLiability,
): Liability {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
  };
}

async function createLiability(args: CreateLiabilityArgs) {
  const token = getSession();
  const res = await client.api.v0.liabilities.$post(
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
      "There was an issue creating your liability :( We'll look into it ASAP!";
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

export const useCreateLiabilityMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLiability,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["liabilities", data?.liability.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getLiabilitiesByPlanId(planId: number) {
  const token = getSession();
  const res = await client.api.v0.liabilities[":planId"].$get(
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
    throw new Error("Error getting liabilities by plan id");
  }
  const { liabilities } = await res.json();
  return liabilities.map(mapSerializedLiabilityToSchema);
}

export const getLiabilitiesByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["liabilities", planId],
    queryFn: () => getLiabilitiesByPlanId(planId),
  });

async function deleteLiability(args: DeleteLiabilityArgs) {
  const token = getSession();
  const res = await client.api.v0.liabilities.delete.$post(
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
      "There was an issue deleting your liability :( We'll look into it ASAP!";
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

export const useDeleteLiabilityMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteLiability,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["liabilities", data?.liability.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function UpdateLiability(args: UpdateLiabilityArgs) {
  const token = getSession();
  const res = await client.api.v0.liabilities.update.$post(
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
      "There was an issue updating your liability :( We'll look into it ASAP!";
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

export const useUpdateLiabilityMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateLiability,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["liabilities", data?.liability.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
