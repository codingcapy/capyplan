import { type ArgumentTypes, client, type ExtractData } from "./client";
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { getSession } from "./plans";
import useAuthStore from "../../store/AuthStore";

type CreateUserArgs = ArgumentTypes<
  typeof client.api.v0.users.$post
>[0]["json"];

type UpdateCurrentPlanArgs = ArgumentTypes<
  typeof client.api.v0.users.update.currentplan.$post
>[0]["json"];

type UpdatePasswordArgs = ArgumentTypes<
  typeof client.api.v0.users.update.password.$post
>[0]["json"];

type ResetPasswordArgs = ArgumentTypes<
  typeof client.api.v0.users.passwordreset.$post
>[0]["json"];

async function createUser(args: CreateUserArgs) {
  const res = await client.api.v0.users.$post({ json: args });
  if (!res.ok) {
    let errorMessage =
      "There was an issue creating your account :( We'll look into it ASAP!";
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
  if (!result.user) {
    throw new Error("Invalid response from server");
  }
  return result.user;
}

export const useCreateUserMutation = (onError?: (message: string) => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function updateCurrentPlan(args: UpdateCurrentPlanArgs) {
  const token = getSession();
  const res = await client.api.v0.users.update.currentplan.$post(
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
    console.log(args);
    try {
    } catch (error) {
      console.log(error);
    }
    throw new Error(errorMessage);
  }
  const result = await res.json();
  return result;
}

export const useUpdateCurrentPlanMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  return useMutation({
    mutationFn: updateCurrentPlan,
    onSettled: (_data, _error) => {
      if (!_data) return console.log("No data, returning");
      setUser({ ..._data.user, createdAt: new Date(_data.user.createdAt) });
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
      queryClient.invalidateQueries({
        queryKey: ["plan", _data.user.currentPlan.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["incomes", _data.user.currentPlan],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function resetPassword(args: ResetPasswordArgs) {
  const token = getSession();
  const res = await client.api.v0.users.passwordreset.$post(
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
    console.log(args);
    try {
    } catch (error) {
      console.log(error);
    }
    throw new Error(errorMessage);
  }
  const result = await res.json();
  return result;
}

export const useResetPasswordMutation = (
  onError?: (message: string) => void,
) => {
  return useMutation({
    mutationFn: resetPassword,
    onSettled: (data, _error) => {
      if (!data) return console.log("No data, returning");
      console.log(data);
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};

async function UpdatePassword(args: UpdatePasswordArgs) {
  const token = getSession();
  const res = await client.api.v0.users.update.password.$post(
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
      "There was an issue updating your password :( We'll look into it ASAP!";
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

export const useUpdatePasswordMutation = (
  onError?: (message: string) => void,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdatePassword,
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
    onError: (error) => {
      if (onError) {
        onError(error.message);
      }
    },
  });
};
