import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useAuthStore from "../store/AuthStore";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { logoutService, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  });

  return <div onClick={logoutService}>Hello "/dashboard"!</div>;
}
