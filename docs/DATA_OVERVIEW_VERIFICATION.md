# Data overview release verification

Published 8 November 2026 to `https://new.mapit.work/dashboard/data`.

The production build succeeded. Ten browser checks passed on the preview and
again on the production HTTPS origin: login; live project/graph figures; programme
filter; document search; pending reviews; pagination; refresh; popup section;
question launch with a sourced answer; and tablet layout. No browser errors were
recorded. A disposable test account and its three conversations were removed.

The authenticated data API returns HTTP 401 without a session; the page redirects
anonymous visitors to login. Forty-two relevant backend regression tests passed.

Repository-wide Svelte checking still reports the existing 62 errors and 76
warnings in 33 files, unchanged from the baseline before this work. These changes
add no new diagnostics. This verification is not a general security audit.

The tested release and previous frontend build are retained in `.releases/`,
which is excluded from Git. The deployment manifest records their exact paths.
Private configuration backups were saved before aligning frontend/backend JWT
signing configuration. No keys, cookies or private document text were added to
source control or the dashboard response.
