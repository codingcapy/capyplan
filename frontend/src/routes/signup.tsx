import { createFileRoute, Link } from "@tanstack/react-router";
import capylogo from "/capyness.png";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  return (
    <div className="md:flex items-center h-screen bg-[#242424] text-white">
      <div className="md:w-[50vw]">
        <div className="text-4xl text-center mb-2 font-bold">CapyPlan</div>
        <div className="text-center mb-10">
          Your financial plan, in your hands
        </div>
        <form action="" className="flex flex-col w-[50%] mx-auto mb-10">
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
      <div className="md:w-[50vw]">
        <img src={capylogo} alt="" className="" />
      </div>
    </div>
  );
}
