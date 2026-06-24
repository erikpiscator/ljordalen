# Deploying Ljørdalen to App Engine

Mirrors the `chollo` setup: push a **GitHub Release** → GitHub Actions deploys to
App Engine using **keyless Workload Identity Federation** (no service-account
keys in GitHub).

The GCP project **`ljordalen-booking`** (number `241239742436`) is already
created. Everything below is run from this repo.

## ✅ Current status (provisioned)

The app is **live**: https://ljordalen-booking.ew.r.appspot.com

Already done: billing linked · APIs enabled · App Engine app (europe-west) ·
Firestore **Native** DB (eur3) · public avatars bucket
`ljordalen-booking-avatars` · Workload Identity Federation (pool + repo-locked
provider + `github-deployer` SA) · first deploy.

**Remaining (needs you):**
1. **Google OAuth client** — the app deployed with *placeholder* credentials, so
   "Fortsätt med Google" won't work until you create a real client (step 3) and
   update `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`, then redeploy
   (`gcloud app deploy`) or set them as GitHub secrets.
2. **GitHub repo + push** (step 5) to enable release-triggered CI.
3. *(optional)* **Resend** key for email notifications.

---

## 0. Fix billing (current blocker)

Linking billing failed with *"Cloud billing quota exceeded"* — your billing
account has hit Google's limit on number of funded projects. Pick one:

- **Request a quota increase** (fastest if you want a dedicated project):
  https://support.google.com/code/contact/billing_quota_increase — then:
  ```bash
  gcloud billing projects link ljordalen-booking --billing-account=01154B-526E8F-97FAD8
  ```
- **Free up a slot** by unlinking billing from an unused project, then run the
  command above.
- **Reuse `malagacar-tracker`** instead (it already has billing). If you go this
  route, tell me and I'll switch the app to a separate App Engine *service*
  there (it would share that project's Firestore).

Nothing below works until the project has billing linked.

## 1. Enable APIs

```bash
gcloud config set project ljordalen-booking
gcloud services enable \
  appengine.googleapis.com firestore.googleapis.com storage.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com cloudbuild.googleapis.com
```

## 2. App Engine, Firestore, Storage

```bash
# App Engine app (region is permanent; europe-west = Belgium)
gcloud app create --region=europe-west

# Firestore in Native mode
gcloud firestore databases create --location=eur3

# Avatar bucket, public-read
gsutil mb -l europe-west1 gs://ljordalen-booking-avatars
gsutil iam ch allUsers:objectViewer gs://ljordalen-booking-avatars
```

## 3. Google OAuth client (manual, in the console)

APIs & Services → Credentials → **Create OAuth client ID** → *Web application*.
Authorized redirect URIs:

- `http://localhost:3000/api/auth/callback/google`
- `https://ljordalen-booking.REGION.r.appspot.com/api/auth/callback/google`
  (use the real URL from `gcloud app browse` after the first deploy)

Copy the client ID + secret for the secrets below.

## 4. Workload Identity Federation (keyless CI auth)

```bash
PROJECT=ljordalen-booking
NUMBER=241239742436
REPO=erikpiscator/ljordalen   # your GitHub repo

# Deployer service account + roles
gcloud iam service-accounts create github-deployer --project=$PROJECT
for ROLE in roles/appengine.deployer roles/appengine.serviceAdmin \
            roles/cloudbuild.builds.editor roles/storage.admin \
            roles/iam.serviceAccountUser roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:github-deployer@$PROJECT.iam.gserviceaccount.com" \
    --role="$ROLE"
done

# WIF pool + provider locked to your repo
gcloud iam workload-identity-pools create github-pool \
  --project=$PROJECT --location=global --display-name="GitHub"
gcloud iam workload-identity-pools providers create-oidc github-provider \
  --project=$PROJECT --location=global --workload-identity-pool=github-pool \
  --display-name="GitHub provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='$REPO'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Let the repo impersonate the deployer SA
gcloud iam service-accounts add-iam-policy-binding \
  github-deployer@$PROJECT.iam.gserviceaccount.com --project=$PROJECT \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/$REPO"
```

The provider path + SA email above already match `.github/workflows/deploy.yml`.

## 5. GitHub repo + secrets

```bash
# Create the repo and push (install gh, or create it on github.com first)
gh repo create erikpiscator/ljordalen --private --source=. --remote=origin --push
# …or, with an existing empty repo:
#   git remote add origin git@github.com:erikpiscator/ljordalen.git && git push -u origin main
```

In the repo: **Settings → Secrets and variables → Actions**.

Secrets:
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — from step 3
- `RESEND_API_KEY` — from Resend (optional)

Variables:
- `AUTH_URL` — `https://ljordalen-booking.REGION.r.appspot.com`
- `STORAGE_BUCKET` — `ljordalen-booking-avatars`
- `ADMIN_EMAILS` — `erik.piscator@protonmail.com,erik.piscator@gmail.com`
- `RESEND_FROM` — e.g. `Ljørdalen <noreply@yourdomain.se>`

## 6. Deploy

First deploy from your machine (creates the app + gives you the URL):

```bash
cp env.example.yaml env.yaml   # fill in real values
gcloud app deploy --project=ljordalen-booking
gcloud app browse
```

Then update the OAuth redirect URI + `AUTH_URL` with the real URL. After that,
every **GitHub Release** auto-deploys via the workflow:

```bash
gh release create v1.0.0 --notes "First release"
```
