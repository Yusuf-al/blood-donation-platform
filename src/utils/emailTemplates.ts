export const registrationConfirmationTemplate = (name: string) => {
  return `
    <div style="max-width:480px; margin:40px auto; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,.06);">

      <div style="padding:24px; text-align:center; border-bottom:1px solid #eee;">
        <h2 style="margin:0; color:#d62839;">FAST<span style="color:#263238;">Blood</span></h2>
        <p style="margin:6px 0 0; font-size:12px; color:#888;">Confirmation</p>
      </div>

      <div style="padding:30px;">
        <h3 style="margin:0 0 12px; color:#172b4d;">
          Registration Confirmation
        </h3>

        <p style="font-size:14px; line-height:1.7; color:#5f6c7b;">
          Hello <strong>${name}</strong>,
        </p>

        <p style="font-size:14px; line-height:1.7; color:#5f6c7b;">
          Your FASTBlood account has been successfully created.
          You can now access the platform and use its blood donation
          and emergency services.
        </p>

        <div style="margin:20px 0; padding:16px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; font-size:13px; color:#166534;">
          ✓ Your registration is complete.
        </div>

        <p style="margin:0; font-size:13px; line-height:1.6; color:#8a94a3;">
          Thank you for joining FASTBlood and helping make blood donation faster and more accessible.
        </p>
      </div>

      <div style="padding:18px; text-align:center; background:#fafbfc; font-size:11px; color:#9aa4b2;">
        &copy; ${new Date().getFullYear()} FASTBlood. All rights reserved.
      </div>

    </div>
  `;
};

export const otpSendEmailTemplates = (
  otp: string,
  email: string,
  name: string,
) => {
  return `<div style="max-width:480px; margin:40px auto; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,.06);">
     <div style="padding:24px; text-align:center; border-bottom:1px solid #eee;"> 
     <h2 style="margin:0; color:#d62839;">FAST<span style="color:#263238;">Blood</span></h2> 
     <p style="margin:6px 0 0; font-size:12px; color:#888;">Email Verification</p> 
     </div> <div style="padding:30px;"> <h3 style="margin:0 0 12px; color:#172b4d;">Verify your email address</h3> 
     <p style="font-size:14px; line-height:1.7; color:#5f6c7b;"> Hello <strong>${name}</strong>,<br /> 
     Use the OTP below to verify <strong>${email}</strong>. </p> <div style="margin:24px 0; padding:20px; text-align:center; background:#fff1f2; border:1px solid #ffd9dd; border-radius:10px;">
      <div style="font-size:32px; font-weight:700; letter-spacing:8px; color:#d62839;"> ${otp} </div> 
      <p style="margin:10px 0 0; font-size:12px; color:#8b6b70;"> Expires in 5 minutes </p> 
      </div> <p style="margin:0; font-size:12px; line-height:1.6; color:#8a94a3;"> If you didn't request this verification, simply ignore this email. Never share your OTP. </p> 
      </div> 
      <div style="padding:18px; text-align:center; background:#fafbfc; font-size:11px; color:#9aa4b2;"> &copy; 2026 FASTBlood. All rights reserved. </div> 
      </div>`;
};
