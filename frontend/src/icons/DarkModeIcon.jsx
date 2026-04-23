export const DarkModeIcon = ({ darkMode }) => (
  darkMode ? (
    // SUN (light mode active)
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ) : (
    // MOON (dark mode inactive)
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 0111.21 3c0 .34.02.67.05 1A7 7 0 1019 13.74c.33.03.66.05 1 .05z"/>
    </svg>
  )
)