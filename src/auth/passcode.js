const PASSCODE_STORAGE_KEY = "woloviz.passcode.ok";

const getAllowedPasscodes = () => {
  const envValue = import.meta.env.VITE_PASS_USERS || "";
  return envValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
};

export const isPasscodeValid = (input) => {
  const allowed = getAllowedPasscodes();
  if (allowed.length === 0) {
    return false;
  }

  return allowed.includes(String(input || "").trim());
};

export const markPasscodeAccepted = () => {
  sessionStorage.setItem(PASSCODE_STORAGE_KEY, "1");
};

export const clearPasscodeAccepted = () => {
  sessionStorage.removeItem(PASSCODE_STORAGE_KEY);
};

export const hasPasscodeAccepted = () =>
  sessionStorage.getItem(PASSCODE_STORAGE_KEY) === "1";
