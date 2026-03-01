import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plan } from "../../../../schemas/plans";
import { ArgumentTypes, client, ExtractData } from "./client";

type SerializePlan = ExtractData<
  Awaited<ReturnType<typeof client.api.v0.plans.$get>>
>["plans"][number];

export function mapSerializedPlanToSchema(serialized: SerializePlan): Plan {
  return {
    ...serialized,
    createdAt: new Date(serialized.createdAt),
  };
}

const TOKEN_KEY = "jwt_access_token";

export function getSession() {
  return localStorage.getItem(TOKEN_KEY);
}

type CreatePlanArgs = ArgumentTypes<
  typeof client.api.v0.plans.$post
>[0]["json"];

async function createPlan(args: CreatePlanArgs) {
  const token = getSession();
  const res = await client.api.v0.plans.$post(
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
      "There was an issue creating your plan :( We'll look into it ASAP!";
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

export const useCreatePlanMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPlan,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function getPlans() {
  const token = getSession();
  const res = await client.api.v0.plans.$get(
    {},
    token
      ? {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      : undefined,
  );
  if (!res.ok) {
    throw new Error("Error getting plans");
  }
  const { plans } = await res.json();
  return plans.map(mapSerializedPlanToSchema);
}

export const getPlansQueryOptions = () =>
  queryOptions({
    queryKey: ["plans"],
    queryFn: () => getPlans(),
  });

async function getPlanById(planId: string) {
  const token = getSession();
  const res = await client.api.v0.plans[":planId"].$get(
    {
      param: { planId },
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
    throw new Error("Error getting plan by id");
  }
  const { plan } = await res.json();
  return mapSerializedPlanToSchema(plan);
}

export const getPlanByIdQueryOptions = (planId: string) =>
  queryOptions({
    queryKey: ["plan", planId],
    queryFn: () => getPlanById(planId),
  });
