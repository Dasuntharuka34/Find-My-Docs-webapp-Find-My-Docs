export const validateEmail = (email) => {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export const validateNic = (nic) => {
  const oldNicPattern = /^\d{9}[vVxX]$/;
  const newNicPattern = /^\d{12}$/;
  return oldNicPattern.test(nic) || newNicPattern.test(nic);
};

export const validateMobile = (mobile) => {
  const mobilePattern = /^\d{10}$/;
  return mobilePattern.test(mobile);
};
