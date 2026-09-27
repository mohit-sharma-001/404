import logging
import os
import resend

logger = logging.getLogger(__name__)

# Initialize API key from environment
resend.api_key = os.environ.get("RESEND_API_KEY")


def send_cyclone_alert(
    to_email: str,
    category: str,
    wind_speed_kmh: float,
    confidence: float,
) -> bool:
    """Sends a formatted cyclone alert email via Resend.

    Returns True on success, False on failure or when API key is missing.
    Never raises an exception so calling endpoints will not crash.
    """
    api_key = os.environ.get("RESEND_API_KEY") or resend.api_key
    if not api_key:
        logger.warning("RESEND_API_KEY is missing or empty. Skipping email alert.")
        return False

    resend.api_key = api_key

    subject = f"Cyclone Alert: {category} Detected"
    disclaimer = "This is an AI-assisted decision support tool, not an official IMD warning."

    plain_text = (
        f"Cyclone Alert: {category} Detected\n\n"
        f"Alert Details:\n"
        f"- Intensity Category: {category}\n"
        f"- Estimated Wind Speed: {wind_speed_kmh:.1f} km/h\n"
        f"- Model Confidence: {confidence:.1f}%\n\n"
        f"Disclaimer: {disclaimer}\n"
    )

    html_content = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b1120; color: #f8fafc; border: 1px solid #1e293b; border-radius: 12px; padding: 24px;">
      <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
        <span style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8;">Vayu-Netra Warning System</span>
        <h2 style="color: #ffffff; margin: 8px 0 0 0; font-size: 20px;">Cyclone Alert: {category} Detected</h2>
      </div>

      <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Intensity Category:</td>
            <td style="padding: 6px 0; color: #f59e0b; font-weight: bold; text-align: right;">{category}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Estimated Wind Speed:</td>
            <td style="padding: 6px 0; color: #38bdf8; font-weight: bold; text-align: right;">{wind_speed_kmh:.1f} km/h</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Model Confidence:</td>
            <td style="padding: 6px 0; color: #10b981; font-weight: bold; text-align: right;">{confidence:.1f}%</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 12px; line-height: 1.5; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; margin: 0;">
        <strong>Disclaimer:</strong> {disclaimer}
      </p>
    </div>
    """

    params = {
        "from": "onboarding@resend.dev",
        "to": [to_email] if isinstance(to_email, str) else to_email,
        "subject": subject,
        "text": plain_text,
        "html": html_content,
    }

    try:
        response = resend.Emails.send(params)
        logger.info(f"Email alert sent successfully to {to_email}. Response: {response}")
        return True
    except Exception as e:
        logger.error(f"Failed to send cyclone alert email to {to_email}: {e}")
        return False
