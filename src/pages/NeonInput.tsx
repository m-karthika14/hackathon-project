import React from "react";

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const NeonInput: React.FC<NeonInputProps> = ({ label, ...props }) => {
  return (
    <div className="flex flex-col space-y-2">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        {...props}
        className="px-4 py-2 rounded-lg bg-black/40 border border-cyan-400 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 neon-shadow"
      />
    </div>
  );
};

export default NeonInput;