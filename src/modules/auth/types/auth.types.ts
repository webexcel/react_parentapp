export interface LoginFormData {
  mobileNumber: string;
}

export interface OtpFormData {
  otp: string;
}

export interface LoginScreenParams {}

export interface OtpScreenParams {
  mobileNumber: string;
  installId?: string;
}
