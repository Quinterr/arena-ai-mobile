import React from 'react';
import Svg, { Circle, Path, Polyline, Rect, Line } from 'react-native-svg';

export type IconName =
  | 'message'
  | 'swords'
  | 'trophy'
  | 'pulse'
  | 'user'
  | 'search'
  | 'star'
  | 'star-filled'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'arrow-up'
  | 'plus'
  | 'settings'
  | 'sparkles'
  | 'bolt'
  | 'copy'
  | 'refresh'
  | 'check'
  | 'x'
  | 'moon'
  | 'sun'
  | 'globe'
  | 'share'
  | 'trash'
  | 'filter'
  | 'scale'
  | 'send'
  | 'clock'
  | 'flame'
  | 'terminal'
  | 'code'
  | 'image'
  | 'eye'
  | 'chart'
  | 'game'
  | 'wand'
  | 'stack'
  | 'layout'
  | 'trend-up'
  | 'trend-down'
  | 'wifi-off'
  | 'shield';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  fill?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 22, color = '#fff', fill = 'none', strokeWidth = 1.9 }: Props) {
  const p = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'message' && <Path {...p} d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.9-.9L3 21l1.9-4.1A8.4 8.4 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z" />}
      {name === 'swords' && (
        <>
          <Path {...p} d="M14.5 17.5 3 6V3h3l11.5 11.5" />
          <Path {...p} d="m13 19 6-6M16 16l4 4M19 21l2-2M21 3h-3L6.5 14.5" />
          <Path {...p} d="m11 5-6 6M8 8 4 4M5 3 3 5" />
        </>
      )}
      {name === 'trophy' && (
        <>
          <Path {...p} d="M6 4h12v5a6 6 0 0 1-12 0V4z" />
          <Path {...p} d="M6 6H3v1a4 4 0 0 0 3 3.9M18 6h3v1a4 4 0 0 1-3 3.9M9 20h6M12 15v5" />
        </>
      )}
      {name === 'pulse' && <Polyline {...p} points="2,12 7,12 9.5,5 14,19 16.5,12 22,12" />}
      {name === 'user' && (
        <>
          <Circle {...p} cx="12" cy="8" r="4" />
          <Path {...p} d="M4 21a8 8 0 0 1 16 0" />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle {...p} cx="11" cy="11" r="7" />
          <Line {...p} x1="20" y1="20" x2="16.2" y2="16.2" />
        </>
      )}
      {(name === 'star' || name === 'star-filled') && (
        <Path
          {...p}
          fill={name === 'star-filled' ? color : fill}
          d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5z"
        />
      )}
      {name === 'chevron-right' && <Polyline {...p} points="9,5 16,12 9,19" />}
      {name === 'chevron-left' && <Polyline {...p} points="15,5 8,12 15,19" />}
      {name === 'chevron-down' && <Polyline {...p} points="5,9 12,16 19,9" />}
      {name === 'arrow-up' && (
        <>
          <Line {...p} x1="12" y1="20" x2="12" y2="5" />
          <Polyline {...p} points="6,11 12,5 18,11" />
        </>
      )}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'settings' && (
        <>
          <Circle {...p} cx="12" cy="12" r="3" />
          <Path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.1a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 11a2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.6 1z" />
        </>
      )}
      {name === 'sparkles' && (
        <>
          <Path {...p} d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
          <Path {...p} d="M18 15l.9 2.3 2.3.9-2.3.9L18 21.4l-.9-2.3-2.3-.9 2.3-.9L18 15z" />
        </>
      )}
      {name === 'bolt' && <Path {...p} d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />}
      {name === 'copy' && (
        <>
          <Rect {...p} x="9" y="9" width="12" height="12" rx="2.5" />
          <Path {...p} d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2" />
        </>
      )}
      {name === 'refresh' && (
        <>
          <Path {...p} d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
          <Path {...p} d="M21 3v5h-5" />
          <Path {...p} d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
          <Path {...p} d="M3 21v-5h5" />
        </>
      )}
      {name === 'check' && <Polyline {...p} points="4,12.5 9.5,18 20,6.5" />}
      {name === 'x' && <Path {...p} d="M6 6l12 12M18 6L6 18" />}
      {name === 'moon' && <Path {...p} d="M21 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10.5 10.5z" />}
      {name === 'sun' && (
        <>
          <Circle {...p} cx="12" cy="12" r="4.2" />
          <Path {...p} d="M12 1.8v2.4M12 19.8v2.4M4.2 12H1.8M22.2 12h-2.4M5.6 5.6 3.9 3.9M20.1 20.1l-1.7-1.7M18.4 5.6l1.7-1.7M3.9 20.1l1.7-1.7" />
        </>
      )}
      {name === 'globe' && (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Path {...p} d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z" />
        </>
      )}
      {name === 'share' && (
        <>
          <Path {...p} d="M12 16V4M8 8l4-4 4 4" />
          <Path {...p} d="M4 14v4a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-4" />
        </>
      )}
      {name === 'trash' && (
        <>
          <Path {...p} d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13" />
        </>
      )}
      {name === 'filter' && <Path {...p} d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />}
      {name === 'scale' && (
        <>
          <Path {...p} d="M12 3v18M7 7h10" />
          <Path {...p} d="M7 7 4 14h6L7 7zM17 7l-3 7h6l-3-7z" />
        </>
      )}
      {name === 'send' && <Path {...p} d="M4 12 20 4l-6 16-2.5-6.5L4 12z" />}
      {name === 'clock' && (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Polyline {...p} points="12,7 12,12 15.5,14" />
        </>
      )}
      {name === 'flame' && (
        <Path {...p} d="M12 3s5 4.2 5 9a5 5 0 0 1-10 0c0-2 1-3.4 1-3.4S9 11 10.5 11c0-3.5 1.5-5.5 1.5-8z" />
      )}
      {name === 'terminal' && (
        <>
          <Rect {...p} x="2.5" y="4" width="19" height="16" rx="3" />
          <Polyline {...p} points="7,9.5 10,12.5 7,15.5" />
          <Line {...p} x1="12.5" y1="15.5" x2="17" y2="15.5" />
        </>
      )}
      {name === 'code' && <Polyline {...p} points="8.5,7 3.5,12 8.5,17 M15.5,7 20.5,12 15.5,17" />}
      {name === 'image' && (
        <>
          <Rect {...p} x="3" y="4" width="18" height="16" rx="3" />
          <Circle {...p} cx="8.5" cy="9.5" r="1.6" />
          <Path {...p} d="m4 17 5-4.5 4 3.5 3-2.5 4 4" />
        </>
      )}
      {name === 'eye' && (
        <>
          <Path {...p} d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
          <Circle {...p} cx="12" cy="12" r="2.8" />
        </>
      )}
      {name === 'chart' && (
        <>
          <Line {...p} x1="4" y1="20" x2="20" y2="20" />
          <Rect {...p} x="6" y="11" width="3.2" height="6" rx="1" />
          <Rect {...p} x="11" y="7" width="3.2" height="10" rx="1" />
          <Rect {...p} x="16" y="13" width="3.2" height="4" rx="1" />
        </>
      )}
      {name === 'game' && (
        <>
          <Rect {...p} x="2.5" y="7" width="19" height="10" rx="5" />
          <Path {...p} d="M7 10.5v3M5.5 12h3M15.5 11h.01M18 13.5h.01" />
        </>
      )}
      {name === 'wand' && (
        <>
          <Path {...p} d="m4 20 9-9M15 5l4 4" />
          <Path {...p} d="M13.5 3.5 15 6l2.5 1.5L15 9l-1.5 2.5L12 9 9.5 7.5 12 6l1.5-2.5z" />
        </>
      )}
      {name === 'stack' && (
        <>
          <Path {...p} d="m12 3 9 5-9 5-9-5 9-5z" />
          <Path {...p} d="m3 13 9 5 9-5" />
        </>
      )}
      {name === 'layout' && (
        <>
          <Rect {...p} x="3" y="4" width="18" height="16" rx="3" />
          <Path {...p} d="M3 9.5h18M9 9.5V20" />
        </>
      )}
      {name === 'trend-up' && (
        <>
          <Polyline {...p} points="3,17 9,11 13,15 21,7" />
          <Polyline {...p} points="15,7 21,7 21,13" />
        </>
      )}
      {name === 'trend-down' && (
        <>
          <Polyline {...p} points="3,7 9,13 13,9 21,17" />
          <Polyline {...p} points="15,17 21,17 21,11" />
        </>
      )}
      {name === 'wifi-off' && (
        <>
          <Path {...p} d="M3 5l18 14M5 12.5a11 11 0 0 1 4-2.6M2 8.8A16 16 0 0 1 8 5.4M16 5.4a16 16 0 0 1 6 3.4M15 9.9a11 11 0 0 1 4 2.6M8.8 16.2a6 6 0 0 1 6.4 0" />
          <Circle {...p} cx="12" cy="20" r="0.6" fill={color} />
        </>
      )}
      {name === 'shield' && <Path {...p} d="M12 3l8 3v6c0 5-3.4 8.2-8 9-4.6-.8-8-4-8-9V6l8-3z" />}
    </Svg>
  );
}
