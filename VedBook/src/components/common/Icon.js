import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polygon } from 'react-native-svg';
import { colors } from '../../theme';

export const Icon = ({
  name,
  size = 22,
  color = colors.primary,
  strokeWidth = 2,
  style,
}) => {
  switch (name) {
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9 21V13H15V21"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'compass':
    case 'explore':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Polygon
            points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'grid':
    case 'categories':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
          <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'book-open':
    case 'library':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M2 4.5C4 3.5 7 3.5 12 5.5C17 3.5 20 3.5 22 4.5V19C20 18 17 18 12 20C7 18 4 18 2 19V4.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="12" y1="5.5" x2="12" y2="20" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'user':
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M5 20C5 16.5 8 15 12 15C16 15 19 16.5 19 20"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'bookmark':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V21L12 17.5L5 21V4Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'bookmark-filled':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M5 4C5 2.89543 5.89543 2 7 2H17C18.1046 2 19 2.89543 19 4V21L12 17.5L5 21V4Z"
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'bell':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 14 3 16 3 16H21C21 16 18 14 18 8Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10 20C10.5 21.2 11.2 21.8 12 21.8C12.8 21.8 13.5 21.2 14 20"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'arrow-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M9 5L16 12L9 19"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M6 9L12 15L18 9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M5 13L9 17L19 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'star-filled':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'mail':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M3 7L12 13L21 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M1 12C3.5 6.5 7.5 4 12 4C16.5 4 20.5 6.5 23 12C20.5 17.5 16.5 20 12 20C7.5 20 3.5 17.5 1 12Z"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'eye-off':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M3 3L21 21M10.5 10.6C10.2 11 10 11.5 10 12C10 13.1 10.9 14 12 14C12.5 14 13 13.8 13.4 13.5M6.6 6.6C4.4 7.9 2.5 9.8 1 12C3.5 17.5 7.5 20 12 20C14.2 20 16.2 19.3 17.9 18M9.9 4.2C10.6 4.1 11.3 4 12 4C16.5 4 20.5 6.5 23 12C22.1 13.8 20.8 15.4 19.2 16.6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'logout':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M9 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d="M16 17L21 12L16 7M21 12H9"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M12 7V12L15 15"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'flame':
    case 'streak':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M12 2C10 5 7 8 7 13C7 16.866 10.134 20 14 20C17.866 20 21 16.866 21 13C21 9 17 6 15 2C15 6 12 7 12 7C12 7 12 2 12 2Z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'book':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M4 19.5V4.5C4 3.39543 4.89543 2.5 6 2.5H20V21.5H6C4.89543 21.5 4 20.6046 4 19.5Z"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M4 18H20"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );

    case 'font-size':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M3 19V7M3 7H11M3 7V7M7 7V19M14 19V12M14 12H20M17 12V19"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'award':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="8" r="6" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M8.21 13.89L7 21L12 17.5L17 21L15.79 13.88"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'info':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Line x1="12" y1="11" x2="12" y2="16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="12" cy="8" r="0.75" fill={color} />
        </Svg>
      );

    case 'help':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.39913C11.0108 7.03016 11.7289 6.87899 12.43 6.97193C13.1311 7.06488 13.7706 7.39627 14.2376 7.90807C14.7046 8.41987 14.9702 9.08051 14.988 9.774C14.988 11.5 12.5 12.5 12.5 12.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="16" r="0.75" fill={color} />
        </Svg>
      );

    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M19.4 15A1.65 1.65 0 0 0 20 16.5V17.5A1.5 1.5 0 0 1 18.5 19H17.5A1.65 1.65 0 0 0 16 19.4A1.65 1.65 0 0 0 15 20.8V21.5A1.5 1.5 0 0 1 13.5 23H10.5A1.5 1.5 0 0 1 9 21.5V20.8A1.65 1.65 0 0 0 8 19.4A1.65 1.65 0 0 0 6.5 19H5.5A1.5 1.5 0 0 1 4 17.5V16.5A1.65 1.65 0 0 0 4.6 15A1.65 1.65 0 0 0 3.2 14H2.5A1.5 1.5 0 0 1 1 12.5V9.5A1.5 1.5 0 0 1 2.5 8H3.2A1.65 1.65 0 0 0 4.6 6.6A1.65 1.65 0 0 0 4 5.2V4.5A1.5 1.5 0 0 1 5.5 3H6.5A1.65 1.65 0 0 0 8 2.6A1.65 1.65 0 0 0 9 1.2V0.5A1.5 1.5 0 0 1 10.5 -1H13.5A1.5 1.5 0 0 1 15 0.5V1.2A1.65 1.65 0 0 0 16 2.6A1.65 1.65 0 0 0 17.5 3H18.5A1.5 1.5 0 0 1 20 4.5V5.2A1.65 1.65 0 0 0 19.4 6.6A1.65 1.65 0 0 0 20.8 8H21.5A1.5 1.5 0 0 1 23 9.5V12.5A1.5 1.5 0 0 1 21.5 14H20.8A1.65 1.65 0 0 0 19.4 15Z"
            stroke={color}
            strokeWidth={strokeWidth}
          />
        </Svg>
      );

    case 'filter':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Polygon
            points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'sort':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Path
            d="M4 6H16M4 12H12M4 18H8"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'logo':
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" style={style}>
          {/* VedBook signature emblem: Open Book + Lotus/Wisdom Gold rays */}
          <Path
            d="M6 12C12 9 18 9 24 13C30 9 36 9 42 12V39C36 36 30 36 24 39C18 36 12 36 6 39V12Z"
            fill={colors.primary}
            stroke={colors.gold}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="24" y1="13" x2="24" y2="39" stroke={colors.gold} strokeWidth="2.5" />
          <Path
            d="M24 7V3M20 5L24 7M28 5L24 7"
            stroke={colors.gold}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
  }
};
