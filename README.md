Flask MySQL Docker Application
אפליקציית ווב המבוססת על Flask ו-MySQL, עם קונטיינרים Docker לסביבת עבודה אחידה.

תיאור הפרויקט
פרויקט זה מציג אפליקציית Flask פשוטה שמתחברת למסד נתונים MySQL ומאפשרת:

הזנת נתונים דרך טופס פשוט
שמירת הנתונים במסד הנתונים
צפייה בכל הנתונים שהוזנו
כל הפרויקט ארוז באמצעות Docker ו-Docker Compose, כך שהוא קל להתקנה ולהפעלה בכל סביבה.

טכנולוגיות
Backend: Python, Flask
Database: MySQL
Frontend: HTML, CSS, JavaScript
Containerization: Docker, Docker Compose
מבנה הפרויקט
.
├── app.py                     # קובץ Flask הראשי
├── docker-compose.yml         # קובץ הגדרות Docker Compose
├── requirements.txt           # ספריות Python הנדרשות
├── .env                       # קובץ משתני סביבה (לא כלול בגיט)
├── .gitignore                 # קובץ התעלמות מקבצים בגיט
│
├── WEB-APP/
│   ├── TEMPLATES/
│   │   ├── index.html         # טופס הכנסת נתונים
│   │   └── view_data.html     # עמוד הצגת נתונים
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── script.js
│   └── Dockerfile             # קובץ Docker לאפליקציה
│
└── DB-WEB/
    ├── Dockerfile             # קובץ Docker למסד הנתונים
    └── init.sql               # קובץ אתחול מסד הנתונים
התקנה והפעלה
דרישות מקדימות
Docker
Docker Compose
Git
צעדים להתקנה
שכפל את המאגר:
bash
git clone https://github.com/YOUR_USERNAME/flask-mysql-docker-app.git
cd flask-mysql-docker-app
הפעל את השירותים:
bash
docker-compose up --build
גישה לאפליקציה:
פתח דפדפן בכתובת: http://localhost:5000
הערות
הנתונים של MySQL נשמרים ב-Docker volume, כך שהם יישמרו גם אם תכבה את הקונטיינרים
אפליקציית הווב תתחדש אוטומטית בזמן פיתוח כשתעשה שינויים בקוד
תרומה לפרויקט
אנו מקבלים בברכה תרומות ושיפורים! אנא פעל לפי השלבים הבאים:

צור Fork של המאגר
צור ענף (Branch) חדש:
bash
git checkout -b feature/your-feature-name
בצע את השינויים שלך
בדוק שהכל עובד כראוי
דחוף את השינויים לענף שלך:
bash
git push origin feature/your-feature-name
פתח Pull Request בגיטהאב
הערה: כל Pull Request ייבדק ויאושר על ידי מנהלי הפרויקט לפני שילוב במאגר הראשי.

רישיון
פרויקט זה מופץ תחת רישיון MIT. ראה קובץ LICENSE לפרטים נוספים.

יצירת קשר
אם יש לך שאלות או הצעות, אנא צור קשר דרך Issues בגיטהאב.

