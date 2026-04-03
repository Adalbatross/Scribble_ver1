import React from "react"

const SendToBack = () => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-80 h-80 mt-2"
    >
      {/* back layer */}
      <rect x="4" y="4" width="10" height="10" rx="1" />

      {/* front layer */}
      <rect x="8" y="8" width="10" height="10" rx="1" fill="#9ca3af" stroke="none" />
    </svg>
  )
}

export default SendToBack