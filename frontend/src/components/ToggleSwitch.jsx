import React from "react"

const ToggleSwitch = ({ enabled, onChange }) => {
    return (
        <button
        onClick={() => onChange(!enabled)}
        className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-200
            ${enabled ? "bg-primary" : "bg-gray-400"}
        `}
        >
        <div
            className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-all duration-200
            ${enabled ? "translate-x-5" : "translate-x-0"}
            `}
        />
        </button>
    )
    }

export default ToggleSwitch