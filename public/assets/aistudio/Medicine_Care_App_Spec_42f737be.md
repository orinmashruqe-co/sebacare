# Medicine Care App: Screen and Function Specification

Version: design board, 22 November 2026. Companion file: `Medicine_Care_App_Designs.pdf` (all 25 screens and the flow map).

---

## 1. What the app does

A mobile app (Android first) that helps people, mainly elderly patients, take their medicines on time, and keeps their family informed.

- **Free for everyone:** register, family profiles, prescription scan, medicine alarms, History, emergency health card.
- **Subscription (Pro):** automatic **AI voice calls in Bangla** that ask about medicines and health, scheduled **health check calls**, missed-call escalation to caregivers, and the option for one person to **pay for another's** plan.

## 2. Rules that apply to every screen

1. **Two languages from day one.** All text lives in language files (Bangla, English). One app-wide language setting. Dates, numbers, and fonts follow the language. The AI voice language is set separately per patient.
2. **Alarm is the base reminder.** It is set on the user's own phone and rings even when the app is closed or offline. The AI call is the paid upgrade. Each medicine has a reminder method: **Alarm**, **Call (Pro)**, or **Silent**.
3. **A prescription is the parent record.** Medicines, tests, doctor, and hospital belong to a prescription. A medicine added by hand belongs to "No prescription".
4. **Exact times, not three slots.** Any clock time (for example 02:00 AM, 05:30 AM). Morning/noon/night are optional labels only.
5. **Paused is not missed.** Paused doses never lower the follow-up percentage or trigger alerts.
6. **One dose log for everything.** Alarm and call results go into the same log (taken, late, missed, paused, snoozed), so History works for free users too.
7. **Mobile first.** Touch targets at least 44 px, one main action per screen, bottom navigation on main screens, a large-font mode.
8. **Privacy.** Support staff see no medical data unless the user allows it during a support chat. Calls on behalf of a patient need the patient's agreement (see open decisions).

## 3. Data model (summary)

| Record | Main fields |
|---|---|
| **Account** | name, mobile, NID, age, gender, blood group, password (hashed), plan (Free / Subscribed) |
| **Person (profile)** | name, relation (Self, Father, Mother, Spouse, Child, Other + custom text), age, NID or birth registration, blood group, allergies, reminder settings, caregivers |
| **Prescription** | doctor (name, specialty, registration no., phone), hospital (name, address), date, follow-up date, vitals, diagnosis, advice, scan image, extra fields, edit history, source of each value (AI or person) |
| **Medicine** | name, strength, exact times, repeat pattern, duration, food relation, critical flag, reminder method, prescription link |
| **Test** | name, due date, prescription link |
| **Dose log** | medicine, planned time, outcome, source (alarm, call, manual), time of action |
| **Problem note** | text, date and time, source (person, voice call) |
| **Alert** | type (problem reported, 3 missed calls), person, time, state |
| **Health check call plan** | person, frequency, start date and time, payer |
| **Subscription** | payer account, covered persons, state, renewal date |

## 4. Navigation

- **Bottom bar (main screens):** Home, Family, History, Settings.
- **Always reachable:** Emergency card, Support.
- **Back:** every other screen returns to where it came from.

---

## 5. Screens

### S1a: Sign in
**Purpose:** let a user in.
**Shows:** mobile number or NID, password.
**Actions:**
- Sign in → **S2a** if the account has no medicines, otherwise **S2b**.
- Sign in with OTP → same destinations.
- Demo login → **S2b**.
- Create account → **S1b**.
- Emergency card, no login → **S10a**.
- Language switch (বাংলা | EN) available before login.

### S1b: Register
**Fields:** full name, mobile number, NID, age, gender, blood group, password.
**Actions:** Create account → creates the account (Free plan), the Self profile, and the default reminder schedule, then opens **S2a**.
**Rules:** password stored hashed; mobile number and NID must be unique.

### S2a: Home 1 (no medicines yet)
**Purpose:** guide a new user to the first useful action.
**Shows:** greeting, a card "Add your first medicine", a four-step checklist (family member, medicine, alarm times, ER PIN), a subscribe banner, the Emergency button.
**Actions:**
- Scan prescription → **S8a**.
- Add manually → **S5**.
- Checklist items → **S3a**, **S5**, **S11**, **S10a**.
- Subscribe banner → **S17**.
- Emergency card → **S10a**.
**Rules:** shown only until the first medicine exists. Text says "alarm", not "call", for users on the Free plan.

### S2b: Home 2 (has medicines)
**Purpose:** answer "what do I need to do right now?"
**Shows:** greeting and active profile (one-tap switch), the **Now card** (current time slot, medicines due, food relation, doctor), an alert strip (only when something needs attention), today's progress ("2 of 3 taken"), quick actions.
**Actions on the Now card:**
- **Taken** → logs the dose, card changes to the next dose.
- **Snooze 30 min** → alarm (or call) repeats in 30 minutes.
- **Not yet** → keeps it open and logs nothing.
**Other actions:** Scan → **S8a**; Add medicine → **S5**; Emergency → **S10a**; alert strip → **S13**; profile chip → **S3a**.
**Rules:** when nothing is due, the card shows the next dose time. Alerts strip disappears when there are none. Call status shows only for subscribers.

### S3a: Family
**Shows:** each member with their follow-up status ("2 of 3 taken") and alert badges; the caregiver inbox with a new-alert count.
**Actions:** tap a member → **S4**; Add family member → **S3b**; Caregiver inbox → **S13**.

### S3b: Add family member
**Fields:** relation buttons (Father, Mother, Spouse, Child, **Other**), custom relation text (for example Brother, Child 2), full name, age, NID (adult) or birth registration (child), blood group.
**Actions:** Save member → **S3a**.
**Rules:** any number of members, including several children. The ID type follows the age.

### S4: Person menu
**Purpose:** the hub for one person.
**Rows:** Prescriptions → **S15a**; Medicines → **S5**; Pause & schedule → **S6a**; History & reports → **S7**; Scan prescription → **S8a**; Reminder preferences → **S11**; Health check calls (Pro) → **S18**; Health card → **S10a**.

### S5: Add medicine
**Fields:** name, the prescription it belongs to, **exact times** (any number of times), repeat (every day, every X hours, every other day, weekdays, weekly, only if needed), duration (N days or ongoing), food relation, reminder method (**Alarm**, **Call (Pro)**, **Silent**), **Critical medicine** switch.
**Actions:** Save medicine → **S2b**. Choosing Call on the Free plan opens **S17**.
**Rules:** medicines due at the same time are bundled into one reminder. A finished course stops automatically. Critical medicines may ring during quiet hours and escalate faster. A tolerance window decides on time / late / missed.

### S6a: Pause & schedule
**Options:** Pause alarms & calls → **S6b**; Skip next reminder; Temporary schedule (shift times for a period, then revert); One-time reminder (for example tomorrow's blood test).
**Shows:** a banner when a pause is active ("Resumes automatically").
**Rules:** only caregivers can pause. A patient can only snooze. Paused doses are logged as paused.

### S6b: Pause dates
**Fields:** from, until (for example 3 days), reason (Hospital, Travel, Doctor), automatic resume.
**Actions:** Confirm pause → **S6a**.

### S7: History
**Purpose:** a full overview of the person's story, newest at the bottom.
**Shows (top to bottom):** a **date-to-date search** (From, To), a small **chart** of on-time doses per day, then a scrolling feed. The feed starts at the present and the person scrolls **up** for older days.
**Feed entries:** each dose (on time, late, missed, paused), calls (answered, missed), **health check call notes**, prescriptions added (with the doctor and hospital), problem notes, tests.
**Marker:** a **NOW** line at the bottom with the next dose.
**Rules:** loaded in pages (recent first, older on scroll). Free users see alarm-based history; subscribers also see call entries.

### S8a: Scan
**Shows:** camera view.
**Actions:** Take photo → **S8b**. Photo is compressed and processed in the background.

### S8b: Scan result
**Shows:** the full prescription found: doctor, hospital, date and follow-up, diagnosis and advice, medicines, suggested tests. Each field is tagged **AI** (read from the scan), **Edited**, or **Empty**.
**Actions:** edit any field; Save prescription → creates the prescription record and builds the routine and alarms, then **S15a**.
**Rules:** unknown extra fields are kept, not dropped. A person's correction wins over the AI and updates alarms. Edits keep a history.

### S9: Problem note
**Fields:** text (or voice), date and time.
**Actions:** Save and notify caregiver → **S2b**. Appears in History.

### S10a: Emergency card, open layer
**Shows:** QR code, blood group, allergies. Visible to anyone with the QR.
**Actions:** Unlock and print → **S10b** after a 4-digit **ER Doctor PIN**.

### S10b: Emergency card, unlocked
**Shows:** NID, latest diagnosis (from the newest prescription), emergency medicines, blood group, allergy. **Print** button.

### S11: Settings
**App:** language, large-font mode, app lock, ER PIN.
**Per person:** voice language, alarm sound and volume, ringtone, quiet hours, caregivers; call settings for subscribers.
**Other:** Plans & subscribe → **S17**; Contact support → **S12**; offline cache.

### S12: Support chat
**Shows:** chat with the admin or support team, a "Report a problem" shortcut from any screen.
**Rules:** support asks permission ("Can we view his call settings for this chat?") before seeing anything. Allow / No.

### S13: Caregiver inbox (subscribers)
**Shows:** alerts such as "Mother reported dizziness" and "3 calls missed".
**Actions per alert:** WhatsApp reminder (one tap); History → **S7**.

### S14: AI call (subscribers)
**Flow:** at the set time, or 30 minutes after a snooze, an incoming call arrives. The AI speaks Bangla ("Sir/Madam, did you take your 2:00 AM medicine?"), the reply is turned into text and understood:
- **Taken** → logged.
- **Later** → snooze, call again in 30 minutes.
- **Problem** → saved as a note and an alert goes to **S13**. Serious words (chest pain, fall) trigger an urgent alert at once.
**Fallbacks:** ask once more, then "press 1 for taken, 2 for later". After 3 missed or rejected calls an alert is created.
**Rules:** the AI never gives medical advice.

### S15a: Prescriptions
**Shows:** list, newest first (doctor, hospital, date, diagnosis), plus "No prescription" for hand-added medicines.
**Actions:** tap a row → **S15b**; Scan new prescription → **S8a**.

### S15b: Prescription detail and edit
**Shows:** every field, each marked AI or Edited; View original scan.
**Actions:** edit, Save changes → **S15a**. A new prescription can replace or update an older routine; the old one stays in history.

### S16: Alarm ringing
**Shows:** time, medicines, doctor. Works offline and with the app closed.
**Actions:** Taken, Snooze 30 min, Not yet → **S2b**. Logged in the same dose log as calls.

### S17: Plans
**Shows:** Free (alarms, scan, prescriptions, History, emergency card) and Subscribed ([PRICE]: AI voice calls in Bangla, missed-call escalation, health check calls, pay for a family member).
**Actions:** Subscribe → store payment, then the server marks the account Subscribed and unlocks Pro features.
**Rules:** subscription state is kept on the server. A payer can cover another person's profile.

### S18: Health check calls (Pro)
**Fields:** who it is for (Me, Mother, Father, Other), how often (daily, weekly, monthly, every N days), start date and time, **who pays** (Me, the patient, another person).
**Actions:** Set up calls → **S7**.
**Flow:** at the chosen times an AI voice call asks about physical health; answers are saved automatically in History.

---

## 6. Flow summary

| From | To |
|---|---|
| S1a | S2a, S2b, S1b, S10a |
| S1b | S2a |
| S2a | S8a, S5, S3a, S10a, S11, S17 |
| S2b | S3a, S5, S8a, S10a, S13, S7, S11 |
| S3a | S4, S3b, S13 |
| S4 | S15a, S5, S6a, S7, S8a, S11, S18, S10a |
| S5 | S2b, S17 |
| S6a | S6b |
| S8a | S8b → S15a |
| S10a | S10b |
| S11 | S12, S17 |
| S13 | S7 |
| S14 | S2b, S13 |
| S15a | S15b, S8a |
| S16 | S2b |
| S18 | S7 |

## 7. Technical notes

- **App:** Flutter (Android first). **Alarms:** scheduled on the phone with native Android code so they work offline.
- **Server:** Python (FastAPI) for scanning, speech, and subscription state. **Jobs:** a queue that fires calls at exact times and retries.
- **Database:** PostgreSQL on the server, SQLite on the phone for offline use.
- **Avoid freezing:** heavy work in the background, compressed photos, paged History, saved data shown first, time limits on requests.
- **Battery savers** on many phones stop background apps: schedule alarms locally, guide the user to turn off battery optimization, test on low-cost phones.

## 8. Open decisions

1. Which of caregiver alerts and WhatsApp reminders are free, and which are Pro?
2. If someone else pays for a patient's calls, must the patient agree before calls start?
3. Does the Alarm screen offer exactly the same buttons as the call?
4. Should the person review an AI scan result before the routine is created, or create it at once and edit later?
5. Are scanned images kept forever, or can the person delete them?
6. Price, and which telephony and Bangla speech provider to use (to be tested with real recordings).
