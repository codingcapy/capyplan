import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Generation } from "../../../../schemas/generations";
import { ArgumentTypes, client, ExtractData } from "./client";
import { getSession } from "./plans";

type CreateGenerationArgs = ArgumentTypes<
  typeof client.api.v0.ai.generate.$post
>[0]["json"];

type SerializeGeneration = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.generations.$get>>
>["generations"][number];

type DeleteGenerationArgs = ArgumentTypes<
  typeof client.api.v0.generations.delete.$post
>[0]["json"];

export function mapSerializedGenerationToSchema(
  serialized: SerializeGeneration,
): Generation {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
  };
}

async function createGeneration(args: CreateGenerationArgs) {
  const token = getSession();
  const res = await client.api.v0.ai.generate.$post(
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
      "There was an issue generating your recommendations :( We'll look into it ASAP!";
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

export const useCreateGenerationMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGeneration,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["generations", data?.generation.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getGenerationsByPlanId(planId: number) {
  const token = getSession();
  const res = await client.api.v0.generations[":planId"].$get(
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
    throw new Error("Error getting generations by plan id");
  }
  const { generations } = await res.json();
  return generations.map(mapSerializedGenerationToSchema);
}

export const getGenerationsByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["generations", planId],
    queryFn: () => getGenerationsByPlanId(planId),
  });

async function deleteGeneration(args: DeleteGenerationArgs) {
  const token = getSession();
  const res = await client.api.v0.generations.delete.$post(
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
      "There was an issue deleting your recommendation :( We'll look into it ASAP!";
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

export const useDeleteGenerationMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGeneration,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["generations", data?.generation.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
