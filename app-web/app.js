const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// הגדרות middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);

// הגדרת session עבור flash messages
app.use(session({
    secret: process.env.SECRET_KEY || 'default_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Middleware עבור flash messages
app.use((req, res, next) => {
    res.locals.messages = req.session.messages || {};
    req.session.messages = {};
    next();
});

// פונקציה להוספת flash message
const flash = (req, type, message) => {
    if (!req.session.messages) {
        req.session.messages = {};
    }
    if (!req.session.messages[type]) {
        req.session.messages[type] = [];
    }
    req.session.messages[type].push(message);
};

// פונקציה להתחברות לדאטה בייס עם ניסיונות חוזרים
async function createConnection() {
    const maxAttempts = 10;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        try {
            const connection = await mysql.createConnection({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'webapp_db'
            });
            
            console.log("התחברות למסד הנתונים MySQL בוצעה בהצלחה");
            return connection;
        } catch (error) {
            attempt++;
            console.log(`ניסיון ${attempt} נכשל: ${error.message}`);
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 3000)); // המתנה לפני ניסיון נוסף
            } else {
                console.log(`כל הניסיונות נכשלו. שגיאה אחרונה: ${error.message}`);
                return null;
            }
        }
    }
}

// ניתוב לדף הבית
app.get('/', (req, res) => {
    res.render('index');
});

// ניתוב לשמירת נתונים
app.post('/submit', async (req, res) => {
    const { input1, input2, input3 } = req.body;
    
    // שמירת הנתונים במסד הנתונים
    const connection = await createConnection();
    
    if (connection) {
        try {
            const query = "INSERT INTO user_data (field1, field2, field3) VALUES (?, ?, ?)";
            const values = [input1, input2, input3];
            
            await connection.execute(query, values);
            flash(req, 'success', 'הנתונים נשמרו בהצלחה!');
            
        } catch (error) {
            flash(req, 'danger', `שגיאה בשמירת הנתונים: ${error.message}`);
        } finally {
            await connection.end();
            console.log("החיבור למסד הנתונים נסגר");
        }
    } else {
        flash(req, 'danger', 'לא ניתן להתחבר למסד הנתונים');
    }
    
    res.redirect('/');
});

// ניתוב להצגת כל הנתונים
app.get('/view_data', async (req, res) => {
    const connection = await createConnection();
    let data = [];
    
    if (connection) {
        try {
            const [rows] = await connection.execute("SELECT * FROM user_data");
            data = rows;
        } catch (error) {
            flash(req, 'danger', `שגיאה בטעינת הנתונים: ${error.message}`);
        } finally {
            await connection.end();
        }
    } else {
        flash(req, 'danger', 'לא ניתן להתחבר למסד הנתונים');
    }
    
    res.render('view_data', { data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`השרת פועל על פורט ${PORT}`);
});