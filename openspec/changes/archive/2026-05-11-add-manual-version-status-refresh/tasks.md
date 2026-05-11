## 1. Server refresh trigger

- [x] **1.1** Expose the existing version snapshot service `refresh()` operation through the server API without changing startup behavior.
- [x] **1.2** Keep concurrent refresh requests deduplicated so repeated clicks while a lookup is in flight do not start duplicate npm/CLI checks.
- [x] **1.3** Add or update server tests for the refresh-trigger endpoint and returned snapshot shape.

## 2. Frontend version status flow

- [x] **2.1** Update the version status API client/store so a manual refresh triggers a real server-side recheck before reading the latest snapshot.
- [x] **2.2** Keep existing loading/error handling and startup retry behavior intact for the initial boot-time snapshot.
- [x] **2.3** Add or update store tests for manual refresh behavior and in-flight disabling.

## 3. Versions header UX

- [x] **3.1** Add a right-aligned icon-only refresh button to the Versions section header.
- [x] **3.2** Show the latest checked-at timestamp immediately to the left of the refresh action, with a clear fallback when no successful check time exists yet.
- [x] **3.3** Disable the refresh button and show a loading affordance while a refresh is in progress.

## 4. Localization and verification

- [x] **4.1** Add localization strings for the checked-at label, refresh action, and any empty/loading timestamp copy.
- [x] **4.2** Update Versions page UI tests for header layout, timestamp rendering, and manual refresh interaction.
- [x] **4.3** Run targeted validation for the new change artifacts and affected test suites.
