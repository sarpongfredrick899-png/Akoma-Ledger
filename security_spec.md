# Security Specification - Akoma Ledger

## Data Invariants
1. A transaction must always be associated with the user who created it (`userId` match).
2. A product cost mapping must belong to the logged-in user.
3. Users can only see and modify their own data.
4. Transaction types are strictly limited to 'income', 'expense', or 'credit'.

## The Dirty Dozen (Attack Vector Scenarios)
1. **The Identity Thief**: User A tries to read User B's transactions by spoofing `transactionId`.
2. **The Shadow Field Attack**: User A tries to add a `verified: true` field to a transaction during creation.
3. **The Data Eraser**: User A tries to delete User B's records.
4. **The Ghost User**: Unauthenticated user tries to register a transaction.
5. **The Billionaire Glitch**: User A tries to set a transaction amount to a negative number or Infinity.
6. **The Role Escalation**: User A tries to change the `userId` of an existing transaction to take ownership.
7. **The ID Poisoning**: User A sends a 2MB string as a `transactionId`.
8. **The Type Injection**: User A sends `type: 'admin_payout'`.
9. **The History Rewriter**: User A tries to change the `timestamp` of an old transaction.
10. **The PII Scraper**: User A tries to list all `productCosts` to see what others are selling.
11. **The orphan Record**: User A creates a transaction with a randomly generated `userId` that doesn't match their own.
12. **The Infinite Sync**: User A tries to update a field they shouldn't (like `id`).

## Test Results
Security rules are designed to prevent all above scenarios by strictly checking `userId` against `request.auth.uid` and enforcing mandatory schemas with `keys().size()` checks.
