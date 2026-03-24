const SelectIcon = ({ active }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={active ? "#2563eb" : "none"}
      stroke={active ? "#2563eb" : "currentColor"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transition: "all 0.2s ease" }}
    >
      {/* Arrow shape */}
      <path d="M3 2 L3 22 L9 16 L13 22 L16 20 L12 14 L20 14 Z" />
    </svg>
  )
}

export default SelectIcon