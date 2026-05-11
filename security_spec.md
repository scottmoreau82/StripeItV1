# Security Specification - Stripe It

## Data Invariants
1. A user can only belong to one organization and one dealership at a time.
2. A deal MUST have a valid `orgId`, `dealershipId`, and `userId`.
3. Users cannot change their own `role` or `subscriptionTier`.
4. Deals in 'FINALIZED' or 'CANCELLED' status cannot be updated by non-managers.
5. All reads for organizational data must be gated by membership.
6. PII (email) is restricted to the user themselves and relevant admins.

## The Dirty Dozen Payloads (Targeting for Denial)

1. **Self-Escalation**: User updates their own `role` to 'admin'.
2. **Cross-Org Stealth Read**: User A tries to 'list' deals in an `orgId` they don't belong to.
3. **Identity Spoofing**: User A creates a deal with `userId: UserB`.
4. **Subscription Hijack**: User A updates their `subscriptionTier` to 'organization' without paying.
5. **Orphaned Record Creation**: Creating a `note` with a non-existent `orgId` or `userId`.
6. **Finalized Deal Tampering**: Non-manager user tries to update the `frontEndGross` of a 'closed' deal.
7. **Role Tampering in Creation**: New user creates a profile with `role: 'gm'`.
8. **ID Poisoning**: User creates a deal with a document ID that is 2MB of junk characters.
9. **History Deletion**: Salesperson tries to delete their own sales history (protected for performance tracking).
10. **Shadow Field Injection**: Adding `isVerified: true` to a user profile to bypass future checks.
11. **Organization Takeover**: Non-owner updates the `ownerId` of an `Organization` document.
12. **PII Scraping**: Authenticated user 'gets' another user's profile to see their private email.

## Test Runner (Draft Plan)
- Test salesperson access: Only their deals, their notes, their goals.
- Test manager access: View all deals in org, manage competitions.
- Test admin access: Update org metadata, manage all users.
- Test cross-org denial: Rejection of any read/write to other orgs.
