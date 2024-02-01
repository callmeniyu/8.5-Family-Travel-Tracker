import express from "express"
import bodyParser from "body-parser"
import pg from "pg"
import cors from "cors"

const app = express()
const port = 3000



const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "world",
    password: "postgre987",
    port: 5432,
})
db.connect()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static("../public"))
app.set('views', '../views');
app.set('view engine', 'ejs');
let currentUserId = 2

let users = []

async function checkVisisted(userId) {
    const result = await db.query("SELECT country_code FROM visited_countries WHERE user_id = $1", [userId])
    let countries = []
    result.rows.forEach((country) => {
        countries.push(country.country_code)
    })
    return countries
}

async function checkUsers(userId) {
    const result = await db.query("SELECT * FROM users")
    let users = []
    result.rows.forEach((user) => {
        users.push(user)
    })
    return users
}

async function addUser(newUser) {
    try {
        const result = await db.query("INSERT INTO users(first_name,color) VALUES ($1,$2) RETURNING first_name;", [
            newUser.name,
            newUser.color,
        ])
        return result[0].first_name
    } catch (err) {
        console.log("Couldn't add new user")
    }
}

app.get("/", async (req, res) => {
    const countries = await checkVisisted(currentUserId)
    const users = await checkUsers();
    const currentUser = users.find((user) => user.id === currentUserId);

    res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser ? currentUser.color : ""
    })
})
app.post("/add", async (req, res) => {
    const input = req.body["country"]

    try {
        const result = await db.query(
            "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
            [input.toLowerCase()]
        )

        const data = result.rows[0]
        const countryCode = data.country_code
        try {
            const result = await db.query("INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)", [
                countryCode,
                currentUserId,
            ])
            res.redirect("/")
        } catch (err) {
            console.log("Country has been already added")
        }
    } catch (err) {
        console.log("Given country doesn't exist")
    }
})
app.post("/user", async (req, res) => {
    const userId = parseInt(req.body.user)
    currentUserId = userId
    res.redirect("/")
})

app.route("/new")
    .get(async (req, res) => {
        //Hint: The RETURNING keyword can return the data that was inserted.
        //https://www.postgresql.org/docs/current/dml-returning.html

        res.render("new", {})
    })
    .post(async (req, res) => {
        //Hint: The RETURNING keyword can return the data that was inserted.
        //https://www.postgresql.org/docs/current/dml-returning.html
        const newUser = req.body
        const newuser = await addUser(newUser)
        res.redirect("/")
        console.log(newuser)
    })

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})
