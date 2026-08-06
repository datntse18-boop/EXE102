// Check if the phone number is valid (Vietnamese phone number format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/
  return phoneRegex.test(phone)
}

// Check if the password is valid (6 digits, no leading zeros)
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^[1-9]{6}$/
  return passwordRegex.test(password)
}