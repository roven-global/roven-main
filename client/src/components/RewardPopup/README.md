# Reward Popup System

A one-time reward popup system for first-time visitors on the website. This system displays a popup with 6 clickable creatives, each revealing a unique reward upon selection.

## Features

### ✅ Functional Requirements Implemented

1. **Trigger Condition**
   - ✅ Automatically appears on page load for first-time visitors
   - ✅ Uses localStorage to identify returning users and suppress future popups
   - ✅ Only shows once per user

2. **Popup Behavior**
   - ✅ Appears on page load for first-time visitors
   - ✅ Displays 6 creatives with hover animations and visual cues
   - ✅ Users can click any one creative to claim a reward

3. **Reward Reveal**
   - ✅ Clicked creative reveals the associated reward
   - ✅ All other creatives become disabled/visually greyed out
   - ✅ After 5 seconds, the popup closes automatically
   - ✅ Progress bar shows countdown

4. **Post-Interaction Behavior**
   - ✅ Stores `rewardClaimed=true` in localStorage
   - ✅ Ensures user doesn't see popup again on future visits

5. **Reward Options**
   - ✅ "10% Off Coupon" - Use code: WELCOME10
   - ✅ "Free Shipping" - Free shipping applied automatically
   - ✅ "Buy 1 Get 1 Free" - Use code: BOGO50
   - ✅ "Free Sample" - Free sample added to cart
   - ✅ "₹100 Discount" - Use code: FLAT100
   - ✅ "Early Access to Launch" - Added to early access list

## Components

### 1. `RewardPopup.tsx`
Main popup component that displays the reward selection interface.

**Props:**
- `isOpen: boolean` - Controls popup visibility
- `onClose: () => void` - Callback when popup closes
- `onRewardClaimed: (reward: Reward) => void` - Callback when reward is claimed

### 2. `useRewardPopup.ts`
Custom hook that manages the reward popup state and localStorage logic.

**Returns:**
- `isPopupOpen: boolean` - Current popup state
- `claimedReward: Reward | null` - Currently claimed reward
- `hasClaimedReward: boolean` - Whether user has claimed a reward
- `isFirstTimeVisitor: boolean` - Whether user is a first-time visitor
- `handleRewardClaimed: (reward: Reward) => void` - Handle reward claim
- `closePopup: () => void` - Close the popup
- `getClaimedRewardDetails: () => any` - Get claimed reward details
- `resetRewardState: () => void` - Reset state for testing

### 3. `ClaimedRewardDisplay.tsx`
Component to display the user's claimed reward in their profile.

### 4. `RewardPopupTest.tsx`
Testing component for developers to reset state and test functionality.

## Integration

### App.tsx Integration
The reward popup is integrated into the main App component:

```tsx
const AppContent = () => {
  const { isPopupOpen, handleRewardClaimed, closePopup } = useRewardPopup();

  return (
    <>
      <BrowserRouter>
        {/* Routes */}
      </BrowserRouter>
      
      <RewardPopup
        isOpen={isPopupOpen}
        onClose={closePopup}
        onRewardClaimed={handleRewardClaimed}
      />
    </>
  );
};
```

### Profile Page Integration
The claimed reward is displayed in the user's profile:

```tsx
import ClaimedRewardDisplay from '@/components/ClaimedRewardDisplay';

// In Profile component
<ClaimedRewardDisplay />
```

## localStorage Keys

The system uses the following localStorage keys:

- `hasVisitedBefore` - Marks if user has visited the site before
- `rewardClaimed` - Marks if user has claimed a reward
- `claimedRewardDetails` - Stores details of the claimed reward

## Customization

### Adding New Rewards
To add new rewards, modify the `rewards` array in `RewardPopup.tsx`:

```tsx
const rewards: Reward[] = [
  {
    id: 7,
    title: "New Reward",
    description: "Description of the new reward",
    icon: <NewIcon className="w-6 h-6" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50 hover:bg-orange-100",
    reward: "New reward details"
  },
  // ... existing rewards
];
```

### Changing Countdown Duration
Modify the countdown duration in `RewardPopup.tsx`:

```tsx
const [countdown, setCountdown] = useState(5); // Change from 5 to desired seconds
```

### Styling Customization
The popup uses Tailwind CSS classes and can be customized by modifying the className props in the components.

## Testing

### Development Testing
Use the `RewardPopupTest` component in the Profile page to:
- View current state
- Reset localStorage state
- Test popup functionality

### Production Testing
1. Open browser in incognito mode
2. Visit the website
3. Popup should appear automatically
4. Select a reward
5. Popup should close after 5 seconds
6. Refresh page - popup should not appear again

## Browser Compatibility

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Performance Considerations

- Popup loads with a 1-second delay to ensure page is fully loaded
- Uses localStorage for persistence (no server calls)
- Minimal bundle size impact
- Responsive design for all screen sizes

## Security Notes

- localStorage is used for persistence (client-side only)
- No sensitive data is stored
- Reward codes are display-only (actual validation should be implemented server-side)

## Future Enhancements

1. **Server Integration**
   - Store claimed rewards in user database
   - Validate reward codes server-side
   - Track reward usage analytics

2. **Advanced Features**
   - A/B testing for different reward sets
   - Time-based reward availability
   - Personalized rewards based on user behavior

3. **Analytics**
   - Track popup impressions
   - Monitor reward selection patterns
   - Conversion rate analysis
