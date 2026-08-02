# GitHub Pages setup

This folder is a static PWA and can be hosted directly from GitHub Pages.

## Publish settings

1. Push this repository to GitHub.
2. In GitHub, open the repository settings.
3. Go to Pages.
4. Set Source to `Deploy from a branch`.
5. Choose branch `main` and folder `/root`.
6. Save.

GitHub Pages will serve `index.html` from the repository root.

## Supabase

After Pages is live, open the app and enter:

- Supabase Project URL
- Supabase anon public key
- Storage bucket: `official-documents`

Run `supabase-schema.sql` in Supabase before using authentication or document upload.
