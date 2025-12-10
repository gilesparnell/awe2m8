# Twilio SMS Configuration

## Environment Variables Required

To fix the SMS sending functionality, you need to add these environment variables to your Vercel project:

### Required Variables:

1. **TWILIO_SMS_ACCOUNT_SID**
   - Value: The account SID that owns the phone number +61485009296
   - This is the specific subaccount that has the Australian phone number

2. **TWILIO_SMS_AUTH_TOKEN**
   - Value: The auth token for the account that owns +61485009296
   - Get this from your Twilio console for that specific account

### How to Add to Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add both variables:
   - Name: `TWILIO_SMS_ACCOUNT_SID`
   - Value: [The account SID that owns +61485009296]
   - Environment: Production, Preview, Development (select all)
   
   - Name: `TWILIO_SMS_AUTH_TOKEN`
   - Value: [Your auth token for that account]
   - Environment: Production, Preview, Development (select all)

4. **Redeploy** your application for the changes to take effect

### Why This Is Needed:

The phone number **+61485009296** belongs to a specific Twilio account/subaccount.

When sending SMS, Twilio requires that:
- The "from" number must belong to the account you're authenticating with
- You were getting the error because the main account doesn't own that phone number
- The error message shows which account the number belongs to

### Fallback Behavior:

If `TWILIO_SMS_ACCOUNT_SID` and `TWILIO_SMS_AUTH_TOKEN` are not set, the code will fall back to using `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`, but this will only work if that account owns the phone number.

### Testing:

After adding the environment variables and redeploying:
1. Go to `/twilio` on your deployed site
2. Click "Test SMS" button
3. You should receive SMS messages at +61401027141 and +61404283605
4. The success message will show which account was used

---

**Note:** Keep your auth tokens secure and never commit them to the repository.
