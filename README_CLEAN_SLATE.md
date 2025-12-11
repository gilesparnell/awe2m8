# Twilio AU Porting Guide (Clean Slate)

You have opted to create a NEW Subaccount to ensure a clean environment. This is the best approach to avoid "ghost" address issues.

## 1. Create Subaccount
Go to the Twilio Console and create your new Subaccount.
**Copy the SID (starts with AC...)**.

## 2. Run Setup Wizard
In your terminal, run:
```bash
node scripts/setup_target_account.js
```
*   Paste the **New Subaccount SID** when prompted.
*   The script will automatically:
    *   Create the required Address Resource.
    *   Upload correct PDF documents (scoped to new account).
    *   Create the Regulatory Bundle.
    *   Submit it for review.

## 3. Wait for Approval
The status will be `in-review`. Wait 24-48 hours for Twilio to approve it. There is no way to bypass this for AU Business numbers.

## 4. Port the Number
Once the bundle is **Approved**:

**Option A (Manual via Console):**
Use the Bundle SID and Address SID printed by the setup script.

**Option B (Script):**
Edit `scripts/simple_port.js` with your NEW SIDs and run it:
```bash
node scripts/simple_port.js
```
(Make sure to update `GAINING_SUBACCOUNT_SID`, `BUNDLE_SID`, and `ADDRESS_SID` in that file first).
