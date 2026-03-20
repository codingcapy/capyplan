import { Generation } from "../../../schemas/generations";
import ReactMarkdown from "react-markdown";
import { FaEllipsisVertical, FaTrashCan } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";

export function GenerationItem(props: { g: Generation }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function handleSubmitDeleteGeneration() {}

  function handleClickOutside(event: MouseEvent) {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setShowMenu(false);
    }
  }

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div key={props.g.generationId} className="relative mb-5">
      <div className="flex justify-between">
        <div className="text-xl text-cyan-500 font-bold mb-1">
          AI Recommendation generated on {props.g.createdAt.toLocaleString()}
        </div>
        <div
          ref={menuRef}
          onClick={() => setShowMenu(!showMenu)}
          className="px-5"
        >
          <FaEllipsisVertical size={20} className="cursor-pointer" />
        </div>
      </div>
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown>{props.g.content}</ReactMarkdown>
      </div>
      {showMenu && (
        <div className="absolute top-5 right-0 p-5 bg-[#303030] shadow-lg">
          <div className="flex text-red-400 cursor-pointer">
            <FaTrashCan
              onClick={handleSubmitDeleteGeneration}
              size={20}
              className="w-8.75 cursor-pointer"
            />
            <div>Delete</div>
          </div>
        </div>
      )}
    </div>
  );
}
