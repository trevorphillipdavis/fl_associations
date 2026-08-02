# Association Records Portal

Static PWA prototype for a Florida association records portal hosted on GitHub Pages.

This first version includes only the online record categories that overlap between Florida HOA and condominium association requirements.

The prototype also includes local demo accounts, visitor mode, visibility settings, admin-only document upload/delete, and an optional GitHub storage connector.

## Supabase setup

Run `supabase-schema.sql` in your Supabase SQL editor to create the starter tables and row-level security policies. Then create a private storage bucket named `official-documents`.

The PWA can be hosted on GitHub Pages while Supabase handles authentication, user roles, document metadata, and official document file storage.

For the first admin, create the user in Supabase Auth, then add that user's `id`, email, name, and `Admin` role to the `profiles` table. After that, sign in through the PWA as the admin.

For the temporary GitHub-backed workflow, an admin enters a fine-grained GitHub token at runtime. The app does not save that token. Uploaded documents are committed under `official-documents/`, account records are committed to `data/users.json`, and the document index is committed to `data/documents.json`.

This is still prototype security. Do not put real protected records or reusable passwords in a public repository. A production version should use real authentication, authorization, and private document storage.

## Shared record categories

- Articles of incorporation
- Recorded bylaws
- Declaration or covenants
- Current association rules
- Contracts and obligation lists
- Bid lists after bidding closes
- Annual and proposed budgets
- Financial reports and monthly income or expense statements
- Director education or certification records
- Conflict and related-party documents
- Owner meeting notices, agendas, and meeting documents
- Board meeting notices, agendas, and required meeting documents
- Redaction and owner-only access policy

## GitHub Pages

Use this folder as the Pages publishing root. The app is static and does not require a build step.

For a project site, set GitHub Pages to publish from the branch and folder containing these files.
