<div align="center">

# 🌐 SnapClass: AI-powered attendance system

### The marketing and walkthrough site for the SnapClass AI attendance system

[**Live Site**](https://snapclass-frontend-beryl.vercel.app/) · [**Launch the App**](https://snapclasses-ai.streamlit.app/) · [**Main App Repo**](https://github.com/Ariesjeev/snapclass)

![Flask](https://img.shields.io/badge/Flask-000000?logo=flask&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## 📖 Overview

This is the public-facing landing page for **SnapClass**, an AI-powered attendance system that uses face recognition and voice biometrics. It explains what the product does, walks through the teacher and student journeys with screenshots, shows the tech stack, and sends visitors straight into the live Streamlit app.

The attendance engine itself lives in the [main SnapClass repo](https://github.com/Ariesjeev/snapclass). This repo is only the Flask-served front door.

## ✨ What's on the Page

- **Hero section** with a one-click *Start AI Attendance* button
- **Innovative features**: AI face analysis, sequential voice ID, QR-driven roster
- **The Teacher's Journey** (6 steps): secure login → dashboard → course management → FaceID attendance → Voice ID attendance → records
- **The Student's Journey** (3 phases): instant enrollment → biometric registration → personal dashboard
- **Advanced tech stack** overview
- Responsive navigation with anchors for Home, Features, Journey and Tech Stack

## 🧰 Tech Stack

| Layer | Tools |
|---|---|
| Server | Flask (Python) |
| Templating | Jinja2 (`templates/`) |
| Assets | HTML, CSS, JS, product screenshots (`static/`) |
| Hosting | Vercel |

## 📁 Project Structure

```
snapclass-frontend/
├── app.py             # Flask app serving the landing page
├── requirements.txt
├── templates/         # index.html
└── static/            # CSS, JS, images and demo screenshots
```

## 🚀 Run Locally

```bash
git clone https://github.com/Ariesjeev/snapclass-frontend.git
cd snapclass-frontend

python -m venv venv
source venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt
python app.py
```

Then open `http://localhost:5002`.

## ☁️ Deployment

The site is deployed on **Vercel**. Pushing to `main` triggers a new deployment.

## 🔗 Related

- 🧠 **SnapClass app (Streamlit):** [github.com/Ariesjeev/snapclass](https://github.com/Ariesjeev/snapclass)
- 🚀 **Live app:** [snapclasses-ai.streamlit.app](https://snapclasses-ai.streamlit.app/)

## 👤 Author

**Jeevan Bikash Sahoo**: Full Stack Developer & AI Engineer  
GitHub: [@Ariesjeev](https://github.com/Ariesjeev)
