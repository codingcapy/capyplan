import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Plan } from "../../../../schemas/plans";
import { ArgumentTypes, client, ExtractData } from "./client";
import useAuthStore from "../../store/AuthStore";

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

type DeletePlanArgs = ArgumentTypes<
  typeof client.api.v0.plans.delete.$post
>[0]["json"];

type UpdatePlanArgs = ArgumentTypes<
  typeof client.api.v0.plans.update.$post
>[0]["json"];

type UpdateCurrencyArgs = ArgumentTypes<
  typeof client.api.v0.plans.update.currency.$post
>[0]["json"];

type UpdateYearOfBirthArgs = ArgumentTypes<
  typeof client.api.v0.plans.update.yearofbirth.$post
>[0]["json"];

type UpdateLocationArgs = ArgumentTypes<
  typeof client.api.v0.plans.update.location.$post
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
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: createPlan,
    onSuccess: (data) => {
      setUser({ ...data.user, createdAt: new Date(data.user.createdAt) });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({
        queryKey: ["plan", data.user.currentPlan],
      });
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

async function getPlanById(planId: number) {
  const token = getSession();
  const res = await client.api.v0.plans[":planId"].$get(
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
    throw new Error("Error getting plan by id");
  }
  const { plan } = await res.json();
  return mapSerializedPlanToSchema(plan);
}

export const getPlanByIdQueryOptions = (planId: number) =>
  queryOptions({
    queryKey: ["plan", planId],
    queryFn: () => getPlanById(planId),
  });

async function deletePlan(args: DeletePlanArgs) {
  const token = getSession();
  const res = await client.api.v0.plans.delete.$post(
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
      "There was an issue deleting your plan :( We'll look into it ASAP!";
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

export const useDeletePlanMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: deletePlan,
    onSettled: (data, _error) => {
      if (!data) return console.log("No data, returning");
      setUser({ ...data.user, createdAt: new Date(data.user.createdAt) });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({
        queryKey: ["plan", data.user.currentPlan],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function updatePlan(args: UpdatePlanArgs) {
  const token = getSession();
  const res = await client.api.v0.plans.update.$post(
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
      "There was an issue updating your plan :( We'll look into it ASAP!";
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

export const useUpdatePlanMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePlan,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["plan", data?.plan.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function updateCurrency(args: UpdateCurrencyArgs) {
  const token = getSession();
  const res = await client.api.v0.plans.update.currency.$post(
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
      "There was an issue updating your currency :( We'll look into it ASAP!";
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

export const useUpdateCurrencyMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCurrency,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["plan", data?.plan.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function updateYearOfBirth(args: UpdateYearOfBirthArgs) {
  const token = getSession();
  const res = await client.api.v0.plans.update.yearofbirth.$post(
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
      "There was an issue updating your year of birth :( We'll look into it ASAP!";
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

export const useUpdateYearOfBirthMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateYearOfBirth,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["plan", data?.plan.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function updateLocation(args: UpdateLocationArgs) {
  const token = getSession();
  const res = await client.api.v0.plans.update.location.$post(
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
      "There was an issue updating your country of residence :( We'll look into it ASAP!";
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

export const useUpdateLocationMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateLocation,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["plan", data?.plan.planId],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
