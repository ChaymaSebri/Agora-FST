function isStrongPassword(password) {
  const value = String(password || '');

  if (value.length < 8) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[^A-Za-z0-9]/.test(value);

  return hasUppercase && hasNumber && hasSpecial;
}

function getPasswordPolicyMessage() {
  return 'Le mot de passe doit contenir au moins 8 caractères, avec au moins une majuscule, un chiffre et un caractère spécial';
}

module.exports = {
  isStrongPassword,
  getPasswordPolicyMessage,
};
