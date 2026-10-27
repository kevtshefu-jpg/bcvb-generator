# Storage P0 — HTTP execution blockers

Target: isolated Supabase project `ahqrrqgebtfzssmeizfu` only. Production and PR #110 remain untouched.

1. Provision synthetic Auth accounts and obtain test JWTs. Do not use real BCVB personal data.
2. Upload a synthetic fixture to private `Bcvb-library` via the Storage API, not SQL; confirm successful baseline download and hash.
3. On isolated project only, restore baseline policies, mint a signed URL, test authenticated download (expected HTTP 200).
4. Apply confinement; test anonymous, authenticated and distinct parent/player/coach credentials; test newly minted signatures and separately test the pre-issued URL until expiry.
5. Restore policies, verify authenticated download and unchanged fixture hash, then reapply confinement as terminal safe state.
6. Run from a networked trusted runner. GitHub `workflow_dispatch` typically requires the workflow to exist on the default branch; do not merge PR #110 merely to make it dispatchable.
7. Record redacted status codes, timestamps and final SQL inventory; never print JWTs or signed URLs.

Current blockers: no test Auth users, no fixture, no test secrets configured, no Storage HTTP access from current container. A 404 without a successful baseline is inconclusive.

Decision: PostgreSQL confinement PASS isolated; HTTP and signed URL checks PENDING; production NO-GO.
