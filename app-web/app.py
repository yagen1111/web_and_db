from flask import Flask, render_template, request, redirect, url_for, flash
import mysql.connector
from mysql.connector import Error
import os
import time
from dotenv import load_dotenv

# טעינת משתני סביבה
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'default_secret_key')

# פונקציה להתחברות לדאטה בייס עם ניסיונות חוזרים
def create_connection():
    connection = None
    max_attempts = 10
    attempt = 0
    
    while attempt < max_attempts:
        try:
            connection = mysql.connector.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                user=os.getenv('DB_USER', 'root'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'webapp_db'),
                auth_plugin='mysql_native_password'
            )
            print("התחברות למסד הנתונים MySQL בוצעה בהצלחה")
            return connection
        except Error as e:
            attempt += 1
            print(f"ניסיון {attempt} נכשל: {e}")
            if attempt < max_attempts:
                time.sleep(3)  # המתנה לפני ניסיון נוסף
            else:
                print(f"כל הניסיונות נכשלו. שגיאה אחרונה: {e}")
    
    return connection

# ניתוב לדף הבית
@app.route('/')
def index():
    return render_template('index.html')

# ניתוב לשמירת נתונים
@app.route('/submit', methods=['POST'])
def submit_data():
    if request.method == 'POST':
        # קבלת הנתונים מהטופס
        input1 = request.form.get('input1')
        input2 = request.form.get('input2')
        input3 = request.form.get('input3')
        
        # שמירת הנתונים במסד הנתונים
        connection = create_connection()
        if connection:
            try:
                cursor = connection.cursor()
                query = "INSERT INTO user_data (field1, field2, field3) VALUES (%s, %s, %s)"
                values = (input1, input2, input3)
                cursor.execute(query, values)
                connection.commit()
                flash("הנתונים נשמרו בהצלחה!", "success")
            except Error as e:
                flash(f"שגיאה בשמירת הנתונים: {e}", "danger")
            finally:
                if connection.is_connected():
                    cursor.close()
                    connection.close()
                    print("החיבור למסד הנתונים נסגר")
        
        return redirect(url_for('index'))

# ניתוב להצגת כל הנתונים
@app.route('/view_data')
def view_data():
    connection = create_connection()
    data = []
    
    if connection:
        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute("SELECT * FROM user_data")
            data = cursor.fetchall()
        except Error as e:
            flash(f"שגיאה בטעינת הנתונים: {e}", "danger")
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    return render_template('view_data.html', data=data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')