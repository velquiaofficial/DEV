export function Icon({ name, size = 22 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16.5 20 20.5" />
        </svg>
      )
    case 'sliders':
      return (
        <svg {...props}>
          <path d="M4 7h16M4 17h16" />
          <circle cx="9" cy="7" r="2.2" fill="white" />
          <circle cx="15" cy="17" r="2.2" fill="white" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...props}>
          <path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
        </svg>
      )
    case 'heartFill':
      return (
        <svg {...props} fill="currentColor" stroke="currentColor">
          <path d="M12 19s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9z" />
        </svg>
      )
    case 'users':
      return (
        <svg {...props}>
          <circle cx="9" cy="9" r="3" />
          <path d="M3.8 18.5c.6-2.4 2.6-4 5.2-4s4.6 1.6 5.2 4" />
          <circle cx="17" cy="9.5" r="2.2" />
          <path d="M16.2 14.6c1.8.3 3.2 1.5 3.8 3.4" />
        </svg>
      )
    case 'home':
      return (
        <svg {...props}>
          <path d="M4 11.5 12 5l8 6.5V20H4z" />
          <path d="M10 20v-5h4v5" />
        </svg>
      )
    case 'case':
      return (
        <svg {...props}>
          <path d="M5 20V7.2A1.2 1.2 0 0 1 6.2 6h5.6A1.2 1.2 0 0 1 13 7.2V20" />
          <path d="M13 11h4.2A1.2 1.2 0 0 1 18.4 12.2V20" />
          <path d="M4 20h16M8 9.5h2M8 13h2M8 16.5h2" />
        </svg>
      )
    case 'spark':
      return (
        <svg {...props}>
          <path d="M12 3.5 13.4 9 19 10.5 13.4 12 12 17.5 10.6 12 5 10.5 10.6 9z" />
        </svg>
      )
    case 'back':
      return (
        <svg {...props}>
          <path d="M15 5 8 12l7 7" />
        </svg>
      )
    case 'close':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="M5 12.5 9.2 17 19 7" />
        </svg>
      )
    case 'bookmark':
      return (
        <svg {...props}>
          <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.5a1 1 0 0 1 1-1z" />
        </svg>
      )
    case 'user':
      return (
        <svg {...props}>
          <circle cx="12" cy="8.5" r="3.2" />
          <path d="M5 19.2c1-3 3.2-4.5 7-4.5s6 1.5 7 4.5" />
        </svg>
      )
    case 'gift':
      return (
        <svg {...props}>
          <rect x="4" y="11" width="16" height="9" rx="1.4" />
          <path d="M4 11h16V8.8a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1zM12 7.8v12.2" />
          <path d="M12 7.8c-1.2-2.6-4.6-2.2-4.6.2 0 1.6 2.4 1.8 4.6 0 2.2-1.8 4.6-2.8 4.6 0 0-2.4-3.4-2.8-4.6-.2z" />
        </svg>
      )
    default:
      return null
  }
}

export function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="10" fill="#ff4f70" />
      <path
        d="M16 7.2c-1.7-2.2-5-1.5-5 .8 0 2 3 2.5 5 .7 2-1.8 5-3.2 5-.6 0-2.3-3.3-3-5-.9z"
        fill="none"
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M16 10.2V22M9.2 15.6h13.6" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}
