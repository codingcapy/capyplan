import { createFileRoute, Link } from "@tanstack/react-router";
import capylogo from "/capyness.png";
import { useCreateUserMutation } from "../lib/api/users";
import { useState } from "react";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { mutate: createUser, isPending: createUserPending } =
    useCreateUserMutation();
  const [notification, setNotification] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (createUserPending) return;
    const username = (e.target as HTMLFormElement).username.value;
    const email = (e.target as HTMLFormElement).email.value;
    const password = (e.target as HTMLFormElement).password.value;
    if (username.length > 255) return setNotification("Username too long!");
    if (email.length > 255) return setNotification("Email too long!");
    if (password.length > 80)
      return setNotification("Password too long! Max character limit is 80");
    createUser(
      { username, password, email },
      {
        onSuccess: () => {
          // loginService(email, password);
          // if (authLoading) setNotification("Loading...");
        },
        onError: (errorMessage) => setNotification(errorMessage.toString()),
      },
    );
  }

  return (
    <div className="pt-5 md:mt-0 md:flex md:items-center h-screen bg-[#242424] text-white">
      <div className="md:w-[50vw]">
        <div className="text-4xl text-center mb-2 font-bold">CapyPlan</div>
        <div className="text-center mb-5 md:mb-10">
          Your financial plan, in your hands
        </div>
        <form action="" className="flex flex-col w-[50%] mx-auto mb-5">
          <input
            type="text"
            placeholder="username"
            className="border rounded p-2 my-2"
          />
          <input
            type="email"
            placeholder="email"
            className="border rounded p-2 my-2"
          />
          <input
            type="text"
            placeholder="password"
            className="border rounded p-2 my-2"
          />
          <button className="my-2 px-5 py-3 bg-cyan-500 font-bold">
            SIGN UP
          </button>
        </form>

        <div className="text-center">
          Already have an account?{" "}
          <Link to="/" className="text-cyan-500 font-bold">
            login
          </Link>
        </div>
      </div>
      <div className="mt-5 md:mt-0 flex flex-col">
        <img src={capylogo} alt="" className="mx-auto" />
      </div>
    </div>
  );
}
