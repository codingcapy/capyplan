import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import capylogo from "/capyness.png";
import useAuthStore from "../store/AuthStore";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const { loginService, authLoading, user } = useAuthStore();
  const [notification, setNotification] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!!user) navigate({ to: "/dashboard" });
  }, [user]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = (e.target as HTMLFormElement).email.value;
    const password = (e.target as HTMLFormElement).password.value;
    loginService(email, password);
    if (authLoading) setNotification("Loading...");
    if (!user) {
      setTimeout(() => {
        setNotification("Invalid login credentials");
      }, 700);
    }
  }

  return (
    <div className="pt-5 md:flex items-center h-screen bg-[#242424] text-white">
      <div className="md:w-[50vw]">
        <div className="text-4xl text-center mb-2 font-bold">CapyPlan</div>
        <div className="text-center mb-5 md:mb-10">
          Your financial plan, in your hands
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-[50%] mx-auto mb-5"
        >
          <input
            type="email"
            id="email"
            name="email"
            placeholder="email"
            className="border rounded p-2 my-2"
          />
          <input
            type="text"
            id="password"
            name="password"
            placeholder="password"
            className="border rounded p-2 my-2"
          />
          <button className="my-2 px-5 py-3 bg-cyan-500 font-bold">
            LOGIN
          </button>
        </form>
        <div className="text-center">
          Don't have an account?{" "}
          <Link to="/signup" className="text-cyan-500 font-bold">
            register
          </Link>
        </div>
      </div>
      <div className="mt-5 md:mt-0 flex flex-col">
        <img src={capylogo} alt="" className="mx-auto" />
      </div>
    </div>
  );
}
