# Volunteer Login & Dashboard Integration Walkthrough

## Summary of Completed Work
We have implemented a **Volunteer Login system** into VariMitra, integrated alongside the existing **Pilgrim / Warkari** and **Admin / Seva Team** login systems.

---

## 1. Key Changes Made

### 1. Backend Authentication & Database (`backend/accounts/` & `backend/wari_core/`)
- **`UserProfile` Model**:
  - Added `'volunteer'` (`Volunteer / Sevekar`) to `ROLE_CHOICES`.
  - Added `department` (e.g., *Food & Annachatra*, *First-Aid & Medical*, *Clean Water*, *Night Shelter*, *Eco-Sanitation*, *Traffic/Crowd Flow*) and `squad_id` fields.
  - Applied Django migrations (`accounts.0002_userprofile_department_userprofile_squad_id_and_more`).
- **Serializers & Views (`serializers.py`, `views.py`)**:
  - Updated `LoginSerializer`, `RegisterSerializer`, `CheckIdentifierSerializer`, and `FirebaseLoginSerializer` to support `'volunteer'`.
  - Configured seeded demo volunteer credentials (`volunteer@varimitra.org` / `volunteer123` or `9823114455`).
  - Implemented 3-way strict role mismatch enforcement (`ROLE_MISMATCH_VOLUNTEER`, `ROLE_MISMATCH_ADMIN`, `ROLE_MISMATCH_PILGRIM`).
- **Permissions (`wari_core/permissions.py`)**:
  - Updated `IsAdminUser` to grant field operation capabilities (SOS dispatch, telemetry access) to volunteers.

---

### 2. Frontend UI & Auth Flow (`frontend/src/`)
- **Types (`types.ts`)**:
  - Updated `PortalType = 'pilgrim' | 'volunteer' | 'admin'`.
  - Extended `UserSession` with `department` and `squad_id`.
- **Portal Icons (`PortalIcons.tsx`)**:
  - Added custom SVG `VolunteerBadgeIcon` with emerald/green service styling.
- **Home Screen (`HomeScreen.tsx`)**:
  - Updated top-right "Login / Sign Up" popover with 3 options:
    1. **Pilgrim / Warkari** (Orange badge)
    2. **Volunteer / Sevekar** (Emerald badge)
    3. **Admin / Seva Team** (Navy blue shield)
- **Sign In Screen (`SignInScreen.tsx`)**:
  - **3-Way Segmented Switcher**: Smoothly switch between Pilgrim, Volunteer, and Admin portals.
  - **Volunteer Login Card**: Dedicated emerald styling with mobile/email input and password.
  - **Quick Demo Fill Button**: `⚡ Fill Demo Volunteer (volunteer@varimitra.org)` fills `volunteer@varimitra.org` / `volunteer123`.
  - **Volunteer Registration Modal**: Register with custom department squad selection and organization.
  - **Role Mismatch Alerts**: Displays direct 1-click switch buttons if an account belongs to a different portal.
- **Multilingual Support (`translations.ts`)**:
  - Added translations in English, Marathi (`mr`), and Hindi (`hi`) for Volunteer portal headers, placeholders, buttons, and error prompts.
- **Dedicated Volunteer Dashboard (`VolunteerDashboard.tsx`)**:
  - **🚨 Live SOS & Distress Dispatch**: Real-time distress reports from nearby pilgrims with 1-click *Acknowledge*, *Dispatch Me*, and *Resolve Incident* actions.
  - **🛡️ My Seva Squad**: Duty squad telemetry, shift checklist, inventory meters (water, food batches, first aid kits), and squad leader hotlines.
  - **🗺️ Route & Seva Points Map**: Palkhi GPS progression and checkpoint indicators.
  - **📢 Control Room Broadcasts & Field Report**: View live transmissions and transmit field situation reports to Central Command.
  - **🪪 Digital Sevekar ID Card**: Verified digital volunteer badge with QR code simulation.
- **App Routing (`App.tsx`)**:
  - Automatically routes `session.role === 'volunteer'` to `VolunteerDashboard`.

---

## 2. Verification & Testing

1. **Frontend Build**:
   - Executed `npm run build` with **0 errors**.
2. **Backend Checks**:
   - Executed `python manage.py check` with **0 issues**.
3. **API Validation**:
   - Tested volunteer login at `/api/auth/login/` with `volunteer@varimitra.org` -> `200 OK` (role: `volunteer`, department: `Food & Annachatra Seva`, squad: `SQD-FOOD-101`).
   - Tested volunteer registration at `/api/auth/register/` -> `201 Created` with custom squad assignment.
   - Tested cross-portal role mismatch check -> `403 Forbidden` with `ROLE_MISMATCH_VOLUNTEER` and user-friendly prompt.
