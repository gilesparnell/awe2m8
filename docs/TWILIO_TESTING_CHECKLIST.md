# Twilio Australian Bundle - Testing Checklist

## Pre-Testing Requirements

### 1. Twilio Account Setup
- [ ] Have a valid Twilio Account SID
- [ ] Have a valid Twilio Auth Token
- [ ] Have created a Sub-Account in Twilio Console
- [ ] Have the Sub-Account SID ready (starts with AC, 34 characters)

### 2. Required Documents
Ensure these documents are available in `/public/admin/documents/`:
- [ ] `AWE2M8 Company Registration.pdf` - Business registration document
- [ ] `AWE2M8 Business Address.pdf` - Proof of address document

### 3. Business Information
Have the following information ready:
- [ ] Business Name (must match documents)
- [ ] ABN/Business Registration Number (must match documents)
- [ ] Business Website (valid URL)
- [ ] Business Industry (e.g., Technology, Healthcare, Retail)
- [ ] Business Address (must match documents)
  - [ ] Street Address
  - [ ] City
  - [ ] State/Region
  - [ ] Postal Code
  - [ ] Country (AU for Australia)

### 4. Authorized Representative Information
- [ ] First Name
- [ ] Last Name
- [ ] Email Address

## Testing Steps

### Step 1: Configure Credentials
1. Navigate to `http://localhost:3000/twilio`
2. Click on "Configuration" tab
3. Enter your Twilio Account SID
4. Enter your Twilio Auth Token
5. Click "Save Configuration"
6. Verify credentials are saved (page should auto-switch to "Create Bundle" tab)

### Step 2: Review Form Fields
1. Click on "Create Bundle" tab (if not already there)
2. Expand "Business Details (Optional)" section
3. Verify all fields are present:
   - [ ] Business Name
   - [ ] EIN / ABN
   - [ ] Business Website (with red asterisk)
   - [ ] Business Industry (with red asterisk)
   - [ ] Authorized Representative section:
     - [ ] First Name (with red asterisk)
     - [ ] Last Name (with red asterisk)
     - [ ] Email (with red asterisk)
   - [ ] Street Address
   - [ ] City
   - [ ] State
   - [ ] Postal Code
   - [ ] Country dropdown
   - [ ] Included Documents list

### Step 3: Fill Out the Form
1. Enter your Sub-Account SID in the main field
2. Review/edit business details:
   - Ensure Business Name matches your documents
   - Ensure ABN matches your documents
   - Enter a valid website URL (e.g., https://awe2m8.com)
   - Enter your business industry
   - Enter authorized representative details
   - Verify address matches your documents
   - Ensure country is set to "AU" for Australia

### Step 4: Submit the Bundle
1. Click "Generate Standard Bundle" button
2. Watch the progress tracker:
   - [ ] Validating Input
   - [ ] Uploading Documents
   - [ ] Creating Address
   - [ ] Creating End User
   - [ ] Creating Bundle
   - [ ] Submitting for Review

### Step 5: Verify Success
1. Check for success modal with:
   - [ ] Green checkmark icon
   - [ ] "Bundle Created!" message
   - [ ] Bundle SID displayed
   - [ ] Status shows "pending-review"
2. Click "Close" on the success modal
3. Click "View Bundles" tab to see your created bundle

## Expected Results

### ✅ Success Indicators
- All progress steps show green checkmarks
- Success modal appears with confetti animation
- Bundle SID is displayed (starts with BU)
- Status is "pending-review"
- No error messages appear

### ❌ Failure Indicators
If you see any of these, check the troubleshooting section:
- Red error message appears
- Progress tracker shows red X on any step
- Error message: "Bundle is not regulatory compliant"
- Error message: "Invalid Sub-Account SID format"
- Error message: "Missing credentials"

## Troubleshooting

### Error: "Invalid Sub-Account SID format"
**Solution:** Ensure your Sub-Account SID:
- Starts with "AC"
- Is exactly 34 characters long
- Is from your Twilio account

### Error: "Missing credentials"
**Solution:** 
- Go to Configuration tab
- Re-enter Account SID and Auth Token
- Click Save Configuration

### Error: "Bundle is not regulatory compliant"
**Solution:** This error should now be fixed. If you still see it:
1. Check browser console for evaluation details
2. Verify all required fields are filled:
   - Business Website
   - Business Industry
   - Authorized Representative (First Name, Last Name, Email)
3. Ensure business details match uploaded documents exactly
4. Verify ABN is correct

### Error: "Failed to create address"
**Solution:**
- Verify address is in Australia
- Ensure postal code is valid
- Check that state is a valid Australian state (NSW, VIC, QLD, etc.)

### Error: "Failed to create End User"
**Solution:**
- Check that all required fields are filled
- Verify email address is valid
- Ensure business registration number (ABN) is correct

### Error: "Failed to upload [document]"
**Solution:**
- Verify documents exist in `/public/admin/documents/`
- Check document names match exactly:
  - `AWE2M8 Company Registration.pdf`
  - `AWE2M8 Business Address.pdf`
- Ensure documents are valid PDFs

## Post-Submission

### What Happens Next?
1. Twilio will review your bundle (typically 24-48 hours)
2. You'll receive an SMS notification when approved
3. Once approved, you can assign the bundle to phone numbers

### Checking Bundle Status
1. Go to "View Bundles" tab
2. Find your bundle in the list
3. Status will be one of:
   - `draft` - Not yet submitted
   - `pending-review` - Submitted, awaiting Twilio review
   - `twilio-approved` - Approved by Twilio
   - `twilio-rejected` - Rejected (check evaluation for reasons)

### If Bundle is Rejected
1. Click on the bundle to view details
2. Check the evaluation results
3. Fix any issues mentioned
4. Create a new bundle with corrected information

## Key Changes Made (For Reference)

### Backend (`/src/app/api/twilio/workflow/route.ts`)
- ✅ Fixed: Now assigns EndUser to Australian bundles (was missing)
- ✅ Fixed: Uses businessIndustry from form instead of hardcoded value

### Frontend (`/src/components/admin/twilio/CreateBundleForm.tsx`)
- ✅ Added: Business Website field (required)
- ✅ Added: Business Industry field (required)
- ✅ Added: Authorized Representative section with First Name, Last Name, Email (all required)
- ✅ Updated: Default values include businessIndustry

## Success Criteria

The bundle creation is successful if:
1. ✅ All progress steps complete with green checkmarks
2. ✅ Success modal appears
3. ✅ Bundle SID is generated
4. ✅ Status is "pending-review"
5. ✅ No "Bundle is not regulatory compliant" error
6. ✅ Bundle appears in "View Bundles" list

## Support

If you continue to experience issues after following this checklist:
1. Check the browser console for detailed error messages
2. Review the `TWILIO_BUNDLE_FIX_SUMMARY.md` for technical details
3. Verify all documents are valid and match business information
4. Ensure Twilio account has necessary permissions
5. Contact Twilio support with the Bundle SID if issues persist

---

**Last Updated:** 2025-12-10
**Version:** 1.0
**Status:** Ready for Testing
