# RentGo Modern Design System 🚗

## Overview
RentGo has been modernized with a premium, vehicle-themed design system that creates a sophisticated, fancy look across the entire platform. The design emphasizes motion, depth, and automotive inspiration.

## Color Palette

### Primary Colors (Vehicle Theme)
- **Primary Dark**: `#0d47a1` - Deep automotive blue
- **Primary**: `#1565c0` - Professional blue
- **Primary Light**: `#1a73e8` - Bright blue for accents
- **Accent**: `#ff6b35` - Energetic orange (vehicle highlights)
- **Accent Light**: `#ff8c42` - Soft orange
- **Success**: `#00a651` - Green for confirmations
- **Warning**: `#ffa500` - Orange for alerts
- **Danger**: `#e53935` - Red for errors

### Neutral Colors
- **Dark**: `#0f172a` - Text color
- **Gray 900**: `#1a202c`
- **Gray 800**: `#2d3748`
- **Gray 700**: `#4a5568`
- **Gray 600**: `#718096`
- **Gray 500**: `#a0aec0`
- **Gray 400**: `#cbd5e0`
- **Gray 300**: `#e2e8f0`
- **Gray 200**: `#edf2f7`
- **Gray 100**: `#f7fafc`
- **Light**: `#ffffff`

## Typography

### Fonts
- **Body**: Inter (300, 400, 500, 600, 700, 800, 900)
- **Headings**: Poppins (500, 600, 700, 800)

### Scales
- **H1**: clamp(2.5rem, 6vw, 4rem) - Hero titles
- **H2**: clamp(1.8rem, 4vw, 2.5rem) - Section titles
- **H3**: 1.2-1.4rem - Card headings
- **Body**: 14-15px
- **Small**: 13px

### Weights
- **Light**: 300
- **Regular**: 400, 500
- **Medium**: 600
- **Bold**: 700
- **Extra Bold**: 800, 900

## Visual Effects

### Shadows
- **Small**: `0 2px 4px rgba(15, 23, 42, 0.08)`
- **Medium**: `0 4px 12px rgba(15, 23, 42, 0.12)`
- **Large**: `0 8px 24px rgba(15, 23, 42, 0.16)`
- **XL**: `0 12px 32px rgba(15, 23, 42, 0.20)`
- **2XL**: `0 20px 50px rgba(15, 23, 42, 0.24)`

### Gradients
- **Primary**: `linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1a73e8 100%)`
- **Accent**: `linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%)`
- **Dark**: `linear-gradient(135deg, #0f172a 0%, #1a202c 100%)`

### Transitions
- **Standard**: `all 0.3s ease`
- **Smooth**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- **Bounce**: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`

### Animations
- **Fade In**: 0.3s ease
- **Slide Up**: 0.3s smooth
- **Pulse**: 2s ease-in-out infinite
- **Shimmer**: 3s ease-in-out infinite

## Component Styling

### Buttons
All buttons have:
- Uppercase text with letter-spacing
- Hover elevation (translateY(-2px))
- Smooth transitions
- Active state (translateY(0))
- Disabled opacity

**Variants**:
- **Primary**: Gradient background, white text
- **Secondary**: Accent gradient, white text
- **Outline**: White background, primary border
- **Ghost**: Transparent, primary text
- **Danger**: Danger red background

### Cards
- White background with 1px border
- Rounded corners (12-16px)
- Subtle shadows
- Hover elevation and shadow enhancement
- Smooth transitions

### Input Fields
- 2px solid borders
- 12px padding
- Rounded corners (8px)
- Focus state: border-color change + box-shadow
- Placeholder text styling

### Badges
- Uppercase text
- Letter-spacing (0.3-0.5px)
- Padding 6px 14px
- Border-radius 20px
- Colored background with low opacity

### Modal
- Gradient header with vehicle theme
- Soft shadows
- Backdrop blur (4px)
- Smooth slide-up animation
- Max-width 700px

## Vehicle Theming

The design incorporates vehicle elements throughout:
- **Logo**: 🚗 emoji as part of gradient text
- **Footer**: 🚗 watermark (low opacity background element)
- **Colors**: Automotive blues and energetic oranges
- **Terminology**: Navigation references vehicles and rental concepts

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Adjustments
- Reduced padding and gaps
- Adjusted font sizes
- Simplified layouts
- Touch-friendly button sizes (min 40px)

## Interactive States

### Hover Effects
- Button elevation (translateY(-2px))
- Card shadow enhancement
- Link underline animation
- Color transitions

### Active/Click States
- Further elevation on active (translateY(0) on release)
- Opacity changes for feedback
- Immediate transitions

### Focus States
- 3px box-shadow with 10% opacity of primary
- Visible focus indicators for accessibility

## Motion Principles

1. **Entrance**: Fade in + slide up (0.3s)
2. **Hover**: Elevation + shadow (0.3s)
3. **Click**: Brief scale change then reset
4. **Loading**: Pulse animation (2s loop)

## Accessibility

- High contrast ratios (WCAG AA+)
- Focus indicators on all interactive elements
- Proper semantic HTML
- Clear visual hierarchy
- Alt text for decorative elements

## Files Modified

1. **index.css**: Global styles and CSS variables
2. **App.css**: Button, form, and component styles
3. **Navbar.css**: Navigation with gradient logo and hover effects
4. **Home.css**: Hero section and feature cards
5. **Footer.css**: Gradient background with vehicle watermark
6. **NotificationBell.css**: Modern icon styling
7. **WishlistButton.css**: Hover animations and states
8. **VerifiedBadge.css**: Badge styling with shimmer
9. **BookingStatusBadge.css**: Status indicators
10. **CouponInput.css**: Dashed border with gradient
11. **InvoiceButton.css**: Modern button variants
12. **FareComparisonCard.css**: Offer card actions
13. **BookingDetailModal.css**: Modal with gradient header

## Future Enhancements

- Add more vehicle illustrations
- Implement parallax scrolling
- Create vehicle-themed icons
- Add micro-interactions for key actions
- Implement dark mode variant
- Create animation library for common patterns

## Usage Notes

- Always use CSS variables defined in `:root` in index.css
- Use `cubic-bezier(0.4, 0, 0.2, 1)` for smooth transitions
- Maintain elevation hierarchy with shadow system
- Test on mobile devices during development
- Keep animations under 0.4s for responsiveness
