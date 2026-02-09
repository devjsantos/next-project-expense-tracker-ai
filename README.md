# 💰 SmartJuanPeso AI - Financial Tracker

Ang **SmartJuanPeso AI** ay isang modernong expense tracker na binuo gamit ang **Next.js 16**, **Prisma**, at **OpenRouter AI**. Dinisenyo ito para sa mga Pinoy upang mas madaling mamahala ng budget gamit ang AI insights at receipt scanning.

## 🌟 Key Features

* **AI Financial Advisor:** Nagbibigay ng insights at tips sa iyong spending habits gamit ang Mistral at Gemini models.
* **Receipt Scanner:** Automatic extraction ng data mula sa resibo gamit ang Vision AI at Tesseract.js fallback.
* **Budget Management:** Month-to-month budget tracking na may rollover support.
* **Secure Auth:** Powered by Clerk (Google & Email Sign-in).
* **PWA Ready:** Maaaring i-install bilang mobile app.

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router)
* **Database:** PostgreSQL (Neon DB) with Prisma ORM
* **AI Engine:** OpenRouter (Mistral 7B & Gemini 2.0 Flash)
* **Styling:** Tailwind CSS & GSAP for animations
* **Authentication:** Clerk

## 🚀 Pag-setup (Local Development)

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/your-repo/smartjuanpeso-ai.git](https://github.com/your-repo/smartjuanpeso-ai.git)
    cd smartjuanpeso-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables:**
    Gumawa ng `.env` file sa root directory at ilagay ang mga sumusunod:
    ```env
    DATABASE_URL="iyong-postgresql-url"
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="iyong-clerk-key"
    CLERK_SECRET_KEY="iyong-clerk-secret"
    OPENROUTER_API_KEY="iyong-openrouter-key"
    SMTP_PASS="iyong-gmail-app-password"
    ```

4.  **Database Migration:**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  **Run the app:**
    ```bash
    npm run dev
    ```

## 🤖 AI Maintenance & Testing

Kapag nagbago ang mga free models sa OpenRouter, maaari mong i-test ang connection gamit ang:
```bash
npm run test:ai