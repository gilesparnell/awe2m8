# Mission Control v3 Mockups

## Overview
This directory contains the mockups for Mission Control v2 (rebranded as v3 for the new approach).

## Files

### 1. `mission-control-v3-office.html`
The main dashboard/office view showing:
- Key metrics and stats
- Agent status overview
- Recent activity feed
- Quick action buttons
- Clean, professional design matching awe2m8 styling

### 2. `mission-control-v3-settings.html`
The settings page for managing configuration files:
- Files organized by priority (Critical/Important/Standard)
- Click to edit any .md file
- Inline file preview and editing
- Priority indicators (red/yellow/green borders)

### 3. `mission-control-v3-mobile.html`
Mobile-optimized view with:
- Large touch targets (44px minimum)
- Swipeable agent status cards
- Bottom navigation bar
- Minimal information density
- Attention alerts at top

## Design Principles

1. **Matches awe2m8 styling** - Uses similar color scheme and components
2. **Mobile-first** - Separate design for mobile, not just responsive
3. **Priority-based** - Critical items highlighted clearly
4. **Touch-friendly** - All interactive elements are thumb-sized
5. **Information hierarchy** - Most important info first

## To View

### Option 1: Run Local Server
```bash
./view-mockups.sh
```
Then open:
- http://localhost:8080/mission-control-v3-office.html
- http://localhost:8080/mission-control-v3-settings.html
- http://localhost:8080/mission-control-v3-mobile.html

### Option 2: Open Directly
Open the HTML files directly in your browser (some features may be limited).

## Next Steps

1. Review all three mockups
2. Provide feedback on design and layout
3. Approve or request changes
4. Begin implementation based on approved designs

## Key Features to Implement

- [ ] Real-time agent status updates
- [ ] Cost tracking and alerts
- [ ] File editing with validation
- [ ] Mobile-optimized navigation
- [ ] Search functionality (Cmd+K)
- [ ] Activity feed with filters