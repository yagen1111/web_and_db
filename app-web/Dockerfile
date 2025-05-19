# WEB-APP/Dockerfile

# שימוש בתמונת בסיס של Python 3.9
FROM python:3.9-slim

WORKDIR /app

# התקנת תלויות מערכת נדרשות
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# העתקת קובץ דרישות הספריות
COPY requirements.txt /app

# התקנת הספריות הנדרשות
RUN pip install --no-cache-dir -r requirements.txt

# העתקת כל קבצי האפליקציה
COPY . /app

# חשיפת פורט 5000 שעליו תפעל האפליקציה
EXPOSE 5000

# הגדרת משתנה סביבה
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

# הפעלת האפליקציה כאשר הקונטיינר מופעל
CMD ["python", "app.py"]