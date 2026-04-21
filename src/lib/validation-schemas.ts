import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export const passwordField = z
  .string()
  .min(1, "Password is required")
  .refine((val) => val.length === 0 || val.length >= 8, {
    message: "Password must be at least 8 characters",
  });

export const optionalUrlField = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), {
    message: "Enter a valid URL (include https://)",
  });

export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  email: emailField,
  password: passwordField,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const createPasswordSchema = z
  .object({
    newPassword: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z
  .string()
  .length(6, "Enter all 6 digits")
  .regex(/^\d{6}$/, "Code must be 6 digits");

export const onboardingStep1Schema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, "Organization name is required")
    .max(200, "Name must be 200 characters or fewer"),
  organizationType: z.enum(
    ["police", "fire", "ems", "school", "healthcare", "nonprofit", "municipality", "other"],
    { errorMap: () => ({ message: "Please select an organization type" }) }
  ),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City name too long"),
  state: z.string().trim().min(1, "State is required"),
  county: z
    .string()
    .trim()
    .min(1, "County is required")
    .max(100, "County name too long"),
  website: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v === "" || /^https?:\/\/.+/i.test(v), {
      message: "Enter a valid URL starting with https://",
    }),
});


export const onboardingStep2Schema = z.object({
  missionStatement: z
    .string()
    .trim()
    .min(1, "Mission statement is required")
    .min(20, "Please write at least 20 characters"),
  populationServed: z
    .string()
    .trim()
    .min(1, "Population served is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, {
      message: "Enter a valid number greater than 0",
    }),
  serviceArea: z.enum(["local", "county", "regional", "statewide"], {
    errorMap: () => ({ message: "Please select a service area" }),
  }),
  staffSizeRange: z.enum(["1-10", "11-25", "26-50", "50+"], {
    errorMap: () => ({ message: "Please select a staff size" }),
  }),
  annualVolume: z.string().trim().optional(),
});


export const onboardingStep3Schema = z.object({
  biggestChallenge: z
    .string()
    .trim()
    .min(1, "Please describe your biggest challenge")
    .min(20, "Please write at least 20 characters"),
  urgencyStatement: z
    .string()
    .trim()
    .min(1, "Please describe what happens if not solved")
    .min(10, "Please write at least 10 characters"),
});


export const onboardingStep4Schema = z.object({
  projectTitle: z
    .string()
    .trim()
    .min(1, "Project title is required")
    .max(150, "Title must be 150 characters or fewer"),
  specificRequest: z
    .string()
    .trim()
    .min(1, "Please describe what you need funding for")
    .min(20, "Please write at least 20 characters"),
  whobenefits: z
    .string()
    .trim()
    .min(1, "Please specify who benefits from this project"),
});


export const organizationFormSchema = z.object({
  name: z.string().trim().min(1, "Organization name is required"),
  location: z.string().trim().min(1, "Location is required"),
  website: optionalUrlField,
  mission: z
    .string()
    .trim()
    .min(1, "Mission statement is required")
    .min(20, "Please write at least 20 characters"),
  focusAreas: z
    .string()
    .trim()
    .refine(
      (s) =>
        s.split(",").some((part) => part.trim().length > 0),
      "Add at least one focus area (comma-separated)"
    ),
});

export const agencyFormSchema = z.object({
  name: z.string().trim().min(1, "Agency name is required"),
  type: z.string().min(1, "Select an agency type"),
  location: z.string().trim().min(1, "Location is required"),
  email: emailField,
});

export const addOpportunitySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  funder: z.string().trim().min(1, "Funder is required"),
  deadline: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v),
      "Use mm/dd/yyyy"
    ),
  maxAmount: z
    .string()
    .trim()
    .refine(
      (v) => v === "" || /^\d+(\.\d{1,2})?$/.test(v.replace(/,/g, "")),
      "Enter a valid amount"
    ),
  sourceUrl: optionalUrlField,
  keywords: z.string().trim(),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .min(20, "Please write at least 20 characters"),
});

export const settingsSaveSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: emailField,
    currentPassword: z.string(),
    newPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const cur = data.currentPassword.trim();
    const neu = data.newPassword.trim();
    if (neu === "" && cur === "") return;
    if (cur === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your current password to set a new one",
        path: ["currentPassword"],
      });
    }
    if (neu === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a new password",
        path: ["newPassword"],
      });
    }
    if (neu.length > 0 && neu.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be at least 8 characters",
        path: ["newPassword"],
      });
    }
  });

/** Staff portal settings: same as agency profile + password, with confirm field. */
export const adminSettingsSaveSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    email: emailField,
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    const cur = data.currentPassword.trim();
    const neu = data.newPassword.trim();
    const conf = data.confirmPassword.trim();
    if (neu === "" && cur === "") return;
    if (cur === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter your current password to set a new one",
        path: ["currentPassword"],
      });
    }
    if (neu === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a new password",
        path: ["newPassword"],
      });
    }
    if (neu.length > 0 && neu.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "New password must be at least 8 characters",
        path: ["newPassword"],
      });
    }
    if (neu !== "" && conf !== neu) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export const deleteAccountConfirmSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .refine((v) => v.toUpperCase() === "DELETE", {
      message: 'Type DELETE to confirm',
    }),
});

export const ashleenApplicationDraftSchema = z.object({
  organizationName: z.string().trim().min(1, "Organization name is required"),
  contactName: z.string().trim().min(1, "Contact name is required"),
  projectTimeline: z.string().trim().min(1, "Project timeline is required"),
  contactEmail: emailField,
  amountRequested: z.string().trim().min(1, "Amount is required"),
  projectTitle: z.string().trim().min(1, "Project title is required"),
  projectSummary: z
    .string()
    .trim()
    .min(1, "Project summary is required")
    .min(40, "Please expand the project summary (at least 40 characters)"),
  communityImpact: z
    .string()
    .trim()
    .min(1, "Community impact is required")
    .min(40, "Please expand community impact (at least 40 characters)"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type CreatePasswordFormValues = z.infer<typeof createPasswordSchema>;
export type OnboardingStep1FormValues = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2FormValues = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3FormValues = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4FormValues = z.infer<typeof onboardingStep4Schema>;
export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;
export type AgencyFormValues = z.infer<typeof agencyFormSchema>;
export type AddOpportunityFormValues = z.infer<typeof addOpportunitySchema>;
export type SettingsSaveFormValues = z.infer<typeof settingsSaveSchema>;
export type AdminSettingsSaveFormValues = z.infer<typeof adminSettingsSaveSchema>;
export type DeleteAccountConfirmValues = z.infer<typeof deleteAccountConfirmSchema>;
export type AshleenApplicationDraftValues = z.infer<typeof ashleenApplicationDraftSchema>;
