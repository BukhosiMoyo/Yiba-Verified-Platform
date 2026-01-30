/**
 * Password strength validation utility
 */

export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0-4
  feedback: string[];
  meetsMinimum: boolean;
}

/**
 * Check password strength and return detailed feedback
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      strength: "weak",
      score: 0,
      feedback: [],
      meetsMinimum: false,
    };
  }

  // Length checks
  if (password.length < 8) {
    feedback.push("At least 8 characters");
    return {
      strength: "weak",
      score: 0,
      feedback,
      meetsMinimum: false,
    };
  } else if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (hasLowercase) score += 1;
  else feedback.push("Add lowercase letters");

  if (hasUppercase) score += 1;
  else feedback.push("Add uppercase letters");

  if (hasNumbers) score += 1;
  else feedback.push("Add numbers");

  if (hasSpecial) score += 1;
  else feedback.push("Add special characters");

  // Determine strength
  let strength: PasswordStrength;
  if (score <= 1) {
    strength = "weak";
  } else if (score === 2) {
    strength = "fair";
  } else if (score === 3) {
    strength = "good";
  } else {
    strength = "strong";
  }

  return {
    strength,
    score,
    feedback: feedback.length > 0 ? feedback : [],
    meetsMinimum: password.length >= 8,
  };
}

/**
 * Get color for password strength
 */
export function getStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "text-red-600 bg-red-50 border-red-200";
    case "fair":
      return "text-orange-600 bg-orange-50 border-orange-200";
    case "good":
      return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "strong":
      return "text-green-600 bg-green-50 border-green-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

/**
 * Get strength label
 */
export function getStrengthLabel(strength: PasswordStrength): string {
  switch (strength) {
    case "weak":
      return "Weak";
    case "fair":
      return "Fair";
    case "good":
      return "Good";
    case "strong":
      return "Strong";
    default:
      return "Unknown";
  }
}
