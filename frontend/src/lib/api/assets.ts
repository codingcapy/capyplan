import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ArgumentTypes, client, ExtractData } from "./client";
import { getSession } from "./plans";
import { Asset } from "../../../../schemas/assets";

type CreateAssetArgs = ArgumentTypes<
  typeof client.api.v0.assets.$post
>[0]["json"];

type DeleteAssetArgs = ArgumentTypes<
  typeof client.api.v0.assets.delete.$post
>[0]["json"];

type UpdateAssetArgs = ArgumentTypes<
  typeof client.api.v0.assets.update.$post
>[0]["json"];

type SerializeAsset = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.assets.$get>>
>["assets"][number];

export function mapSerializedAssetToSchema(serialized: SerializeAsset): Asset {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
  };
}

async function createAsset(args: CreateAssetArgs) {
  const token = getSession();
  const res = await client.api.v0.assets.$post(
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
      "There was an issue creating your asset :( We'll look into it ASAP!";
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

export const useCreateAssetMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["assets", data?.asset.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getAssetsByPlanId(planId: number) {
  const token = getSession();
  const res = await client.api.v0.assets[":planId"].$get(
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
    throw new Error("Error getting assets by plan id");
  }
  const { assets } = await res.json();
  return assets.map(mapSerializedAssetToSchema);
}

export const getAssetsByPlanIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["assets", planId],
    queryFn: () => getAssetsByPlanId(planId),
  });

async function deleteAsset(args: DeleteAssetArgs) {
  const token = getSession();
  const res = await client.api.v0.assets.delete.$post(
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
      "There was an issue deleting your asset :( We'll look into it ASAP!";
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

export const useDeleteAssetMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["assets", data?.asset.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function UpdateAsset(args: UpdateAssetArgs) {
  const token = getSession();
  const res = await client.api.v0.assets.update.$post(
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
      "There was an issue updating your asset :( We'll look into it ASAP!";
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

export const useUpdateAssetMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateAsset,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["assets", data?.asset.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
