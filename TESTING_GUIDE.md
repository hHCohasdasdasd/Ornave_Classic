# Profile Page Testing Guide

## Testing Environment
- **Frontend**: http://localhost:5174/
- **Backend**: http://localhost:3001/
- **Database**: SQLite (Prisma)

## Test Scenarios

### Scenario 1: Registration and Login

1. **Navigate to Registration**
   - Go to http://localhost:5174/register
   - Enter test credentials:
     - Email: `test@ornave.com`
     - First Name: `John`
     - Last Name: `Doe`
     - Password: `SecurePass123!`
   - Click "Create Account"
   - Should redirect to Company Setup page

2. **Complete Company Setup** (if applicable)
   - Fill company details
   - Click "Create Company"
   - Should redirect to Dashboard

3. **Verify Authentication**
   - Token should be stored in localStorage
   - User context should be populated
   - Dashboard should display

### Scenario 2: Access Profile Page

1. **From Sidebar Navigation**
   - Click "Profile" in sidebar (bottom of navigation menu)
   - Page should load with user info

2. **From Top Navbar**
   - Click "Profile" button in top navigation bar (between "Global" and "Logout")
   - Page should load with user info

3. **Direct URL**
   - Navigate to http://localhost:5174/profile
   - Should load profile page with user data

### Scenario 3: Edit Personal Information

1. **Load Profile Page**
   - Profile data should auto-populate from `GET /auth/profile`

2. **Modify Personal Details**
   - Change First Name: `Jane`
   - Change Last Name: `Smith`
   - Change Email: `jane.smith@ornave.com`
   - Change Phone: `+1 (555) 123-4567`
   - Update Bio: `Senior Product Manager at Ornave`

3. **Save Changes**
   - Click "Save Changes" button
   - Should see loading state
   - Success message should appear
   - Page should reload with new data

4. **Verify Backend Update**
   - User table should have updated firstName, lastName, email
   - UserProfile table should have updated phone, bio
   - Next page load should show updated values

### Scenario 4: Change Password

1. **Open Password Change Form**
   - Click "Change Password" button
   - Password form should appear

2. **Enter Password Information**
   - Current Password: `SecurePass123!`
   - New Password: `NewSecurePass456!`
   - Confirm New Password: `NewSecurePass456!`

3. **Change Password**
   - Click "Update Password" button
   - Should see loading state
   - Success message should appear
   - Form should close

4. **Test New Password**
   - Logout from profile page
   - Try login with old password (should fail)
   - Login with new password (should succeed)

### Scenario 5: Form Validation

1. **Test Required Field Validation**
   - Clear First Name field
   - Try to save
   - Should show error: "First name, last name, and email are required"

2. **Test Password Confirmation**
   - Click "Change Password"
   - Enter matching current password
   - Enter New Password: `TestPass123!`
   - Enter Confirm: `DifferentPass123!`
   - Click "Update Password"
   - Should show error: "New passwords do not match"

3. **Test Password Length**
   - Click "Change Password"
   - Enter current password
   - Enter New Password: `Short1!` (7 characters)
   - Click "Update Password"
   - Should show error: "New password must be at least 8 characters"

### Scenario 6: Account Details Display

1. **View Read-Only Information**
   - User ID should display correctly
   - Account Type should show "Company User" or "Personal User"
   - Role should display (OWNER, ADMIN, EMPLOYEE, USER)
   - Company ID should show (if applicable)
   - Member Since should show creation date

2. **Verify Data Format**
   - Dates should be formatted consistently
   - IDs should display in full

### Scenario 7: Navigation and Logout

1. **Navigate Away and Back**
   - From profile, click "Dashboard"
   - Profile data should not be lost
   - Return to profile
   - Data should still be there

2. **Logout from Profile**
   - Click "Logout" button in Danger Zone
   - Should redirect to home page
   - Should clear authentication token
   - Should no longer be able to access `/profile` directly

3. **Verify Protected Route**
   - Try accessing `/profile` without login
   - Should redirect to `/login`

## Expected API Calls

### Profile Load
```
GET /auth/profile
Headers:
  Authorization: Bearer <jwt_token>
Response:
  {
    success: true,
    data: {
      id: "user-id",
      email: "test@ornave.com",
      firstName: "John",
      lastName: "Doe",
      role: "OWNER",
      userType: "COMPANY_USER",
      companyId: "company-id",
      createdAt: "2026-02-18T...",
      userProfile: {
        id: "profile-id",
        userId: "user-id",
        phone: "+1 (555) 123-4567",
        bio: "Senior Product Manager"
      }
    }
  }
```

### Profile Update
```
PUT /auth/profile
Headers:
  Authorization: Bearer <jwt_token>
Body:
  {
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@ornave.com",
    phone: "+1 (555) 123-4567",
    bio: "Senior Product Manager at Ornave"
  }
Response:
  {
    success: true,
    data: { updated user object }
  }
```

### Password Change
```
POST /auth/change-password
Headers:
  Authorization: Bearer <jwt_token>
Body:
  {
    oldPassword: "SecurePass123!",
    newPassword: "NewSecurePass456!"
  }
Response:
  {
    success: true,
    message: "Password changed successfully"
  }
```

## Component Testing Checklist

### ProfilePage Component
- [ ] Loads user data on mount
- [ ] Shows loading state while fetching
- [ ] Displays error messages when API fails
- [ ] Form inputs populate with user data
- [ ] Success messages appear after save
- [ ] Page reloads after successful profile update
- [ ] Password form shows/hides correctly
- [ ] Password validation works
- [ ] Logout button works

### Navigation Integration
- [ ] Profile link appears in sidebar
- [ ] Profile button appears in navbar
- [ ] Route `/profile` works
- [ ] Protected route redirects unauthenticated users
- [ ] Links navigate correctly

### Design System Compliance
- [ ] Uses PageContainer for layout
- [ ] Uses Card components for sections
- [ ] Uses Button component with variants
- [ ] Consistent spacing (var(--space-x))
- [ ] Consistent colors from CSS variables
- [ ] Proper form styling (.form, .input, .textarea)
- [ ] Responsive layout

## Browser Console Checks

1. **No JavaScript Errors**
   - Open DevTools (F12)
   - Check Console tab
   - Should have no red error messages

2. **No TypeScript Errors**
   - Build should complete without errors
   - All types should be properly defined

3. **Network Requests**
   - All API calls should return 200/201 status
   - No 404 or 500 errors
   - Proper CORS headers should be present

## Performance Testing

1. **Page Load Time**
   - Profile page should load in < 1 second
   - Data should display immediately

2. **Form Submission**
   - Profile update should complete in < 2 seconds
   - Password change should complete in < 2 seconds

3. **No Memory Leaks**
   - Navigating away and back should not duplicate components
   - Event listeners should be cleaned up

## Accessibility Testing

1. **Keyboard Navigation**
   - Tab through all form inputs
   - All buttons should be focusable
   - Logout should work with Enter key

2. **Screen Reader**
   - Form labels should be associated with inputs
   - Error messages should be announced
   - Button labels should be clear

## Summary of Test Results

After running these test scenarios, you should verify:
- ✅ Users can access their profile
- ✅ Personal information can be edited and saved
- ✅ Password can be changed securely
- ✅ All form validation works correctly
- ✅ Navigation is seamless
- ✅ No console errors
- ✅ All API responses are correct
- ✅ Protected routes work properly

## Notes

- Test with both USER and COMPANY_USER account types
- Test on different screen sizes (desktop, tablet, mobile)
- Test in different browsers (Chrome, Firefox, Safari, Edge)
- Monitor network tab in DevTools for API calls
- Check database for changes after updates
