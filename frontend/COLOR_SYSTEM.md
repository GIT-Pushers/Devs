# Color System Documentation

## Overview
The frontend now uses a comprehensive theme-aware color system based on shadcn/ui conventions. All hardcoded color values have been replaced with semantic CSS variables that automatically adapt to light and dark modes.

## Theme Colors

### CSS Variables (defined in `globals.css`)

#### Light Mode (`:root`)
```css
--primary: #1e9df1           /* Brand blue - primary actions */
--destructive: #f4212e        /* Red - errors, destructive actions */
--success: #17bf63            /* Green - success states */
--warning: #f7b928            /* Yellow - warnings, pending states */
--info: #1e9df1               /* Blue - informational content */
```

#### Dark Mode (`.dark`)
```css
--primary: #1c9cf0           /* Brand blue - primary actions */
--destructive: #f4212e        /* Red - errors, destructive actions */
--success: #00b87a            /* Green - success states */
--warning: #f7b928            /* Yellow - warnings, pending states */
--info: #1c9cf0               /* Blue - informational content */
```

## Semantic Color Usage

### ✅ Success (Green)
**Use for:**
- Completed actions (finalized hackathons, submitted projects)
- Verified status (verified GitHub accounts)
- Success messages and confirmations
- Registered/staked status badges
- Checkmarks and success icons
- Refund available indicators

**Tailwind Classes:**
- `text-success`
- `bg-success`, `bg-success/20`, `bg-success/10`
- `border-success`, `border-success/30`, `border-success/50`
- `hover:bg-success/90`

### ⚠️ Warning (Yellow)
**Use for:**
- Pending states (staking required, awaiting action)
- Stake amounts and financial warnings
- Score not yet finalized
- Cautionary messages
- "Not verified" status

**Tailwind Classes:**
- `text-warning`
- `bg-warning`, `bg-warning/20`, `bg-warning/10`
- `border-warning`, `border-warning/30`, `border-warning/50`
- `hover:bg-warning/90`

### ℹ️ Info (Blue)
**Use for:**
- Informational badges (AI scores, project submitted)
- Data displays
- Neutral status indicators
- Submit project actions
- Fee settlement actions

**Tailwind Classes:**
- `text-info`
- `bg-info`, `bg-info/20`, `bg-info/10`
- `border-info`, `border-info/30`, `border-info/50`
- `hover:bg-info/90`

### ❌ Destructive (Red)
**Use for:**
- Error messages and failed states
- Not registered/not staked badges
- Validation errors
- Destructive actions (delete, remove)
- Critical warnings

**Tailwind Classes:**
- `text-destructive`
- `bg-destructive`, `bg-destructive/20`, `bg-destructive/10`
- `border-destructive`, `border-destructive/30`, `border-destructive/50`
- `hover:bg-destructive/90`

### 🎯 Primary (Brand Blue)
**Use for:**
- Primary call-to-action buttons
- Judge scoring actions
- Calculate final scores
- Active state indicators
- Brand-related elements
- Main navigation highlights

**Tailwind Classes:**
- `text-primary`
- `bg-primary`, `bg-primary/20`, `bg-primary/10`
- `border-primary`, `border-primary/30`, `border-primary/50`
- `hover:bg-primary/90`

## Files Modified (55+ replacements)

### Component Files
1. `VerificationModal.tsx` - 5 replacements
2. `UserProfile.tsx` - 4 replacements
3. `ProjectSubmissionForm.tsx` - 6 replacements
4. `fileupload.tsx` - 3 replacements
5. `WhyChooseKlu.tsx` - 1 replacement

### Page Files
1. `home/page.tsx` - 2 replacements
2. `home/[id]/page.tsx` - 10 replacements
3. `participants/[id]/page.tsx` - 9 replacements
4. `submission/[hackathonId]/page.tsx` - 3 replacements
5. `mint-nft/[hackathonId]/page.tsx` - 3 replacements
6. `Createhack/page.tsx` - 2 replacements

## Migration Guide

### Before (Hardcoded)
```tsx
<span className="text-green-400 bg-green-500/20 border-green-500/30">
  Success!
</span>

<button className="bg-yellow-500 hover:bg-yellow-600 text-black">
  Stake ETH
</button>

<div className="text-red-600 bg-red-100">
  Error occurred
</div>
```

### After (Theme-Aware)
```tsx
<span className="text-success bg-success/20 border-success/30">
  Success!
</span>

<button className="bg-warning hover:bg-warning/90 text-warning-foreground">
  Stake ETH
</button>

<div className="text-destructive bg-destructive/20">
  Error occurred
</div>
```

## Benefits

1. **Automatic Dark Mode**: Colors adapt seamlessly between light and dark themes
2. **Consistency**: Same semantic meaning = same color across the entire app
3. **Maintainability**: Change theme colors in one place (`globals.css`)
4. **Accessibility**: Semantic colors maintain proper contrast ratios
5. **Future-Proof**: Easy to rebrand or customize themes

## Best Practices

1. **Use Semantic Names**: Choose colors based on meaning, not appearance
   - ✅ `text-success` for completed actions
   - ❌ `text-green-400` (hardcoded)

2. **Preserve Opacity**: Maintain opacity values for backgrounds
   - ✅ `bg-success/20` for subtle backgrounds
   - ✅ `bg-success` for solid backgrounds

3. **Consistent Hover States**: Use `/90` for hover darkening
   - ✅ `hover:bg-success/90`
   - ❌ Custom darker shade

4. **Border Consistency**: Match border colors with background intent
   - ✅ `bg-success/20 border-success/30`
   - ❌ Mixing different color families

## Adding New Semantic Colors

To add new semantic colors:

1. Add to `:root` in `globals.css`:
```css
:root {
  --custom-color: #hexvalue;
  --custom-color-foreground: #hexvalue;
}
```

2. Add to `.dark` in `globals.css`:
```css
.dark {
  --custom-color: #hexvalue;
  --custom-color-foreground: #hexvalue;
}
```

3. Add to `@theme inline`:
```css
@theme inline {
  --color-custom-color: var(--custom-color);
  --color-custom-color-foreground: var(--custom-color-foreground);
}
```

4. Add utility classes:
```css
.text-custom-color {
  color: var(--custom-color);
}

.bg-custom-color {
  background-color: var(--custom-color);
}

.border-custom-color {
  border-color: var(--custom-color);
}
```

## Notes

- All opacity modifiers (`/20`, `/10`, `/30`, etc.) are automatically supported
- Foreground colors are automatically calculated for proper contrast
- Chart colors remain separate for data visualization consistency
- Sidebar colors have their own variants for navigation
