// src/utils/avatarFromEmail.js
export function avatarFromEmail(email) {
  if (!email) return ''; // Handle undefined email gracefully
  const base = 'https://ui-avatars.com/api/';
  const name = email.split('@')[0];
  return `${base}?name=${name}&background=random&color=fff&rounded=true&size=64`;
}