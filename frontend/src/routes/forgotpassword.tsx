import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import {
  useConfirmPasswordResetMutation,
  useResetPasswordMutation,
} from "../lib/api/users";

export const Route = createFileRoute("/forgotpassword")({
  component: RouteComponent,
});

function RouteComponent() {
  const [emailContent, setEmailContent] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notification, setNotification] = useState("");
  const [requestComplete, setRequestComplete] = useState(false);
  const { mutate: resetPassword, isPending: resetPasswordPending } =
    useResetPasswordMutation();
  const {
    mutate: confirmResetPassword,
    isPending: confirmResetPasswordPending,
  } = useConfirmPasswordResetMutation();

  function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    resetPassword(
      { email: emailContent },
      {
        onSuccess: () => {
          setRequestComplete(true);
          setNotification(
            "Success! Check your email for a one-time recovery code.",
          );
        },
        onError: (error) => setNotification(error.message),
      },
    );
  }

  function handleConfirmSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setNotification("Passwords do not match.");
      return;
    }
    confirmResetPassword(
      { token: code, password },
      {
        onSuccess: () => {
          setNotification(
            "Password updated. You can now sign in with your new password.",
          );
          setCode("");
          setPassword("");
          setConfirmPassword("");
        },
        onError: (error) => setNotification(error.message),
      },
    );
  }

  return (
    <div className="h-screen bg-[#242424] text-white flex flex-col">
      <Link
        to="/"
        className="p-3 flex hover:text-cyan-500 transition-all ease-in-out duration-300"
      >
        <div className="flex justify-center items-center">
          <FaArrowLeft />
        </div>
        <div className="ml-2">Back to home</div>
      </Link>
      <div className="mx-auto mt-10 md:mt-20">
        <div className="text-2xl text-center font-bold mb-5">
          Password Recovery
        </div>
        <form onSubmit={handleRequestSubmit} className="flex flex-col">
          <input
            type="email"
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Enter email address"
            className="border rounded mb-2 p-2 w-[90vw] max-w-[600px]"
            required
          />
          <button
            disabled={resetPasswordPending}
            className="bg-cyan-500 py-2 cursor-pointer disabled:opacity-60"
          >
            Send recovery code
          </button>
        </form>
        {requestComplete ? (
          <form onSubmit={handleConfirmSubmit} className="flex flex-col mt-6">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter recovery code"
              className="border rounded mb-2 p-2 w-[90vw] max-w-[600px]"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              className="border rounded mb-2 p-2 w-[90vw] max-w-[600px]"
              required
              minLength={8}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="border rounded mb-2 p-2 w-[90vw] max-w-[600px]"
              required
              minLength={8}
            />
            <button
              disabled={confirmResetPasswordPending}
              className="bg-cyan-500 py-2 cursor-pointer disabled:opacity-60"
            >
              Reset password
            </button>
          </form>
        ) : null}
      </div>
      <div className="text-center my-2">{notification}</div>
    </div>
  );
}
