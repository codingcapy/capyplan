import { createFileRoute, useNavigate } from "@tanstack/react-router";
import useAuthStore from "../store/AuthStore";
import { useEffect } from "react";
import { LeftNav } from "../components/LeftNav";
import { TopNav } from "../components/TopNav";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/" });
  }, [user]);

  return (
    <div className="bg-[#242424] text-white min-h-screen p-2">
      <LeftNav />
      <TopNav />
      <div className="pl-[300px] pt-10 text-4xl font-bold">Dashboard</div>
    </div>
  );
}
