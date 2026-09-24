# Lucky spin and manual mobile payments

## Changes
- Add a fixed top pointer to the wheel, lay prize labels safely within each segment, and calculate the winning segment from the wheel’s final angle.
- Show the exact winning message after the animation and apply the stored prize to cart totals.
- Add an Easypaisa / JazzCash checkout payment step with the supplied account details, QR codes, required 11-digit TRX ID, and optional payment screenshot.
- Store locally placed orders with payment status set to Pending Verification and show that status in order history.

## Technical details
- Keep this presentation build entirely client-side.
- Store only the transaction ID and payment status with the local order. The optional screenshot is validated and previewed in-browser, but not persisted because browser storage is unsuitable for large image data.
- Verify both desktop and mobile layouts and the complete checkout flow.
