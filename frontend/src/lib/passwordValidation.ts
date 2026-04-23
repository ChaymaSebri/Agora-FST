export function isStrongPassword(password: string): boolean {
  const value = String(password || "");

  if (value.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasUppercase && hasNumber && hasSpecial;
}

export function getPasswordPolicyMessage(): string {
  return "Le mot de passe doit contenir au moins 8 caracteres, avec au moins une majuscule, un chiffre et un caractere special";
}
