export const STORAGE_KEYS = {
  // Auth
  TOKEN: "rdg_token",
  USER: "rdg_user",
  ADMIN_TOKEN: "rdg_admin_token",
  ADMIN_USER: "rdg_admin_user",

  // Password reset
  RESET_EMAIL: "rdg_reset_email",
  RESET_TOKEN: "rdg_reset_token",

  // Onboarding steps (session storage)
  ONBOARDING_STEP1: "rdg_onboarding_step1",
  ONBOARDING_STEP2: "rdg_onboarding_step2",
  ONBOARDING_STEP3: "rdg_onboarding_step3",
  ONBOARDING_STEP4: "rdg_onboarding_step4",

  // Misc
  ONBOARDING_COOKIE: "rdg_onboarding",
} as const;

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  OTP_VERIFICATION: "/otp-verification",
  CREATE_PASSWORD: "/create-password",
  ONBOARDING: "/onboarding",

  DASHBOARD: "/dashboard",
  FUNDERS: "/funders",
  MATCHES: "/matches",
  APPLICATIONS: "/applications",
  TRACKER: "/tracker",
  OUTREACH: "/outreach",
  FOLLOWUPS: "/follow-ups",
  WINS: "/wins",
  ALERTS: "/alerts",
  SETTINGS: "/settings",

  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DASHBOARD: "/admin/dashboard",
  ADMIN_AGENCIES: "/admin/agencies",
  ADMIN_FUNDERS: "/admin/funders",
  ADMIN_APPLICATIONS: "/admin/applications",
  ADMIN_OPPORTUNITIES: "/admin/opportunities",
  ADMIN_MATCHES: "/admin/matches",
  ADMIN_USERS: "/admin/users",
  ADMIN_SETTINGS: "/admin/settings",
} as const;
