// ==========================================================================
// CampusNest Edge Functions — SMS Provider Abstraction
// Clean provider interface for Twilio SMS / Indian DLT dispatch with mock fallback
// ==========================================================================

export interface SmsDispatchResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  name: string;
  isConfigured: boolean;
  sendFounderOtp(
    recipientPhone: string,
    applicantName: string,
    applicantUsername: string,
    otp: string
  ): Promise<SmsDispatchResult>;
}

/**
 * Twilio SMS Provider Implementation
 * Uses Twilio REST API with Basic Auth over TLS
 */
export class TwilioSmsProvider implements SmsProvider {
  name = 'TwilioSmsProvider';
  isConfigured = true;

  private accountSid: string;
  private authToken: string;
  private fromPhone: string;

  constructor(accountSid: string, authToken: string, fromPhone: string) {
    this.accountSid = accountSid;
    this.authToken = authToken;
    this.fromPhone = fromPhone;
  }

  async sendFounderOtp(
    recipientPhone: string,
    applicantName: string,
    applicantUsername: string,
    otp: string
  ): Promise<SmsDispatchResult> {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: recipientPhone,
        From: this.fromPhone,
        Body: `CampusNest Security: Admin registration requested for ${applicantName} (@${applicantUsername}). Founder authorization OTP is: ${otp}. Valid for 10 minutes. Do not share if unauthorized.`,
      });

      const credentials = btoa(`${this.accountSid}:${this.authToken}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `Twilio dispatch failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        messageId: data.sid,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        error: `Network failure connecting to SMS gateway: ${errorMsg}`,
      };
    }
  }
}

/**
 * Mock / Sandbox SMS Provider
 * Safely active when Twilio credentials are not yet configured in environment.
 * NEVER outputs plaintext OTP in logs.
 */
export class MockSmsProvider implements SmsProvider {
  name = 'MockSmsProvider';
  isConfigured = false;

  async sendFounderOtp(
    recipientPhone: string,
    applicantName: string,
    applicantUsername: string,
    _otp: string
  ): Promise<SmsDispatchResult> {
    const maskedPhone = recipientPhone.length > 5 
      ? `${recipientPhone.slice(0, 3)}****${recipientPhone.slice(-3)}` 
      : '***';

    console.info(
      `[SMS Provider: Mock] Founder OTP queued for ${maskedPhone} (Applicant: ${applicantName} / @${applicantUsername}). ` +
      `Real Twilio credentials not configured in Edge Function environment. Ready for provider connection.`
    );

    return {
      success: true,
      messageId: `mock_dispatch_${crypto.randomUUID()}`,
    };
  }
}

/**
 * Factory function to retrieve the configured SMS provider
 */
export function getSmsProvider(): SmsProvider {
  // @ts-ignore Deno global access in Edge Function runtime
  const accountSid = typeof Deno !== 'undefined' ? Deno.env.get('TWILIO_ACCOUNT_SID') : undefined;
  // @ts-ignore Deno global access in Edge Function runtime
  const authToken = typeof Deno !== 'undefined' ? Deno.env.get('TWILIO_AUTH_TOKEN') : undefined;
  // @ts-ignore Deno global access in Edge Function runtime
  const fromPhone = typeof Deno !== 'undefined' ? Deno.env.get('TWILIO_FROM_PHONE') : undefined;

  if (accountSid && authToken && fromPhone) {
    return new TwilioSmsProvider(accountSid, authToken, fromPhone);
  }

  return new MockSmsProvider();
}
